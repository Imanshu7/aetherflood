
from typing import Any, Dict, List, Optional
import re
import requests

from backend.config import config

TIMEOUT = (10, 30)
MAX_CHARS_PER_REQUEST = 6000

# Internal language selection; Sarvam is instructed via language names so no
# invented language-code scheme is required.
LANGUAGE_NAMES = {
    "en": "English",
    "ne": "Nepali, written in Devanagari script",
}


class SarvamError(Exception):
    """Raised for every Sarvam failure mode with a machine-readable code."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def is_configured() -> bool:
    return bool(config.sarvam_api_key)


# Brief in-memory cache for successful translations only, keyed by content
# hash + target language. Failures are never cached as translations.
_TRANSLATION_CACHE: Dict[str, Any] = {}
_TRANSLATION_TTL_S = 24 * 3600


def _cache_key(text: str, target_lang: str) -> str:
    import hashlib
    digest = hashlib.sha256(f"{target_lang}\n{text}".encode("utf-8")).hexdigest()
    return digest


def cache_get(text: str, target_lang: str) -> Optional[str]:
    import time
    entry = _TRANSLATION_CACHE.get(_cache_key(text, target_lang))
    if entry and entry[1] > time.time():
        return entry[0]
    if entry:
        _TRANSLATION_CACHE.pop(_cache_key(text, target_lang), None)
    return None


def cache_put(text: str, target_lang: str, translated: str):
    import time
    if len(_TRANSLATION_CACHE) > 2000:
        _TRANSLATION_CACHE.clear()
    _TRANSLATION_CACHE[_cache_key(text, target_lang)] = (translated, time.time() + _TRANSLATION_TTL_S)


def build_translation_prompt(text: str, *, source_lang: str, target_lang: str) -> List[Dict[str, str]]:
    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    return [
        {
            "role": "system",
            "content": (
                "You are a precise disaster-response report translator. Translate the user "
                f"text from {source_name} into natural, fluent {target_name} for "
                "a Nepali emergency-response reader. STRICT RULES: "
                "(1) Preserve every number, date, coordinate, measurement, unit, URL, dataset ID, "
                "scene ID, place-code, and proper name exactly — never convert, round, or transliterate "
                "values where that would cause confusion. "
                "(2) Preserve Markdown structure (headings, bold markers, lists, links) exactly. "
                "(3) Never add facts, measurements, warnings, or recommendations that are not in the source. "
                "(4) Keep uncertainty and limitation statements equivalent in strength. "
                "Output ONLY the translation, no preamble."
            ),
        },
        {"role": "user", "content": text},
    ]


def _extract_content(payload: Dict[str, Any]) -> str:
    try:
        choices = payload.get("choices") or []
        content = (choices[0].get("message") or {}).get("content", "")
    except (IndexError, AttributeError, TypeError):
        content = ""
    if not isinstance(content, str):
        content = str(content) if content is not None else ""
    return content.strip()


# A line must carry at least this many Latin letters to count as substantive
# prose worth checking; shorter lines are labels, separators or identifiers.
_MIN_CHECKABLE_LETTERS = 12

# Fraction of substantive lines that must come back with Devanagari before the
# translation is accepted as complete. Sarvam occasionally leaves a line (most
# often the report title) in English while translating the rest correctly, which
# a whole-document Devanagari ratio cannot detect.
HEADING_COVERAGE_FLOOR = 0.9


def heading_coverage(source: str, translated: str) -> float:
    """
    Fraction of substantive source lines whose translation contains Devanagari.

    Returns 1.0 when there is nothing substantive to check. Lines are compared
    positionally, which holds because the prompt requires the Markdown structure
    to be preserved exactly.
    """
    src_lines = (source or "").split("\n")
    tgt_lines = (translated or "").split("\n")
    checked = 0
    missing = 0
    for idx, src in enumerate(src_lines):
        if len(re.findall(r"[A-Za-z]", src)) < _MIN_CHECKABLE_LETTERS:
            continue
        checked += 1
        if idx >= len(tgt_lines) or not re.search(r"[\u0900-\u097F]", tgt_lines[idx]):
            missing += 1
    if not checked:
        return 1.0
    return (checked - missing) / checked


def _auth_headers() -> Dict[str, str]:
    """Sarvam auth headers. The key is read from config and never returned."""
    return {
        # Primary Sarvam authentication header, plus Bearer for
        # OpenAI-compatible tooling (both documented as accepted).
        "api-subscription-key": config.sarvam_api_key,
        "Authorization": f"Bearer {config.sarvam_api_key}",
        "Content-Type": "application/json",
    }


def chat_completion(
    messages: List[Dict[str, str]],
    *,
    max_tokens: int = 600,
    timeout: tuple = TIMEOUT,
    temperature: float = 0.1,
) -> str:
    """
    Run a single grounded chat completion and return the assistant text.

    This is the Sarvam counterpart used by the Copilot for answer composition,
    as opposed to translate_text which is restricted to translation. Raises
    SarvamError on every failure mode so the caller can fall back explicitly.
    """
    if not is_configured():
        raise SarvamError(
            "missing_key",
            "Sarvam API key is not configured (SARVAM_API_KEY is empty). "
            "Set the backend environment variable to enable Sarvam answers.",
        )
    body = {
        "model": config.sarvam_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        # Disable thinking mode so reasoning tokens do not consume the
        # completion budget (per Sarvam docs).
        "reasoning_effort": None,
    }
    try:
        response = requests.post(
            config.sarvam_api_url, json=body, headers=_auth_headers(), timeout=timeout
        )
    except requests.Timeout as exc:
        raise SarvamError("timeout", "Sarvam completion timed out.") from exc
    except requests.RequestException as exc:
        raise SarvamError("network", f"Sarvam request failed: {exc}.") from exc
    if response.status_code in (401, 403):
        raise SarvamError("auth", "Sarvam rejected the API key (check SARVAM_API_KEY).")
    if response.status_code == 429:
        raise SarvamError("rate_limited", "Sarvam rate limit hit (429). Wait and retry.")
    if not response.ok:
        raise SarvamError(
            "bad_response", f"Sarvam returned HTTP {response.status_code}: {response.text[:200]}."
        )
    try:
        content = _extract_content(response.json())
    except ValueError as exc:
        raise SarvamError("bad_response", "Sarvam returned invalid JSON.") from exc
    if not content:
        raise SarvamError("empty", "Sarvam returned an empty completion.")
    return content


def translate_text(
    text: str,
    *,
    source_lang: str = "en",
    target_lang: str = "ne",
    timeout: tuple = TIMEOUT,
    max_retries: int = 1,
) -> Dict[str, Any]:
    """
    Translate report text via Sarvam chat completions. Returns
    {"text", "model", "provider"}. Raises SarvamError on any failure.
    """
    if target_lang not in LANGUAGE_NAMES:
        raise SarvamError("unsupported_language", f"Unsupported target language: {target_lang}.")
    if not text or not text.strip():
        raise SarvamError("empty_input", "Nothing to translate.")
    if len(text) > MAX_CHARS_PER_REQUEST:
        raise SarvamError(
            "too_long",
            f"Report text ({len(text)} chars) exceeds the {MAX_CHARS_PER_REQUEST}-char translation limit.",
        )
    if not is_configured():
        raise SarvamError(
            "missing_key",
            "Sarvam API key is not configured (SARVAM_API_KEY is empty). "
            "Set the backend environment variable to enable Nepali translation.",
        )
    body = {
        "model": config.sarvam_model,
        "messages": build_translation_prompt(text, source_lang=source_lang, target_lang=target_lang),
        "temperature": 0,
        "max_tokens": 2500,
        # Disable thinking mode for deterministic translation output; reasoning
        # tokens would otherwise consume the completion budget (per Sarvam docs).
        "reasoning_effort": None,
    }
    headers = _auth_headers()
    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(config.sarvam_api_url, json=body, headers=headers, timeout=timeout)
        except requests.Timeout as exc:
            last_error = exc
            continue  # bounded retry on timeout
        except requests.RequestException as exc:
            raise SarvamError("network", f"Sarvam request failed: {exc}.") from exc
        if response.status_code in (401, 403):
            raise SarvamError("auth", "Sarvam rejected the API key (check SARVAM_API_KEY).")
        if response.status_code == 429:
            raise SarvamError("rate_limited", "Sarvam rate limit hit (429). Wait and retry.")
        if 500 <= response.status_code < 600:
            last_error = requests.HTTPError(f"Sarvam server error ({response.status_code}).")
            continue  # bounded retry on 5xx
        if not response.ok:
            raise SarvamError(
                "bad_response",
                f"Sarvam returned HTTP {response.status_code}: {response.text[:200]}.",
            )
        try:
            translated = _extract_content(response.json())
        except ValueError as exc:
            raise SarvamError("bad_response", "Sarvam returned invalid JSON.") from exc
        if not translated:
            raise SarvamError("empty", "Sarvam returned an empty translation.")
        if (
            target_lang == "ne"
            and len(re.findall(r"[A-Za-z]", text)) >= 30
            and not re.search(r"[\u0900-\u097F]", translated)
        ):
            raise SarvamError(
                "empty",
                "Sarvam returned untranslated English text instead of Nepali.",
            )
        if target_lang == "ne" and len(text) >= 120:
            # Guard against partial echoes: mostly-English output with only a
            # token of Nepali is not a usable translation either.
            deva_ratio = len(re.findall(r"[\u0900-\u097F]", translated)) / max(len(translated), 1)
            if deva_ratio < 0.15:
                raise SarvamError(
                    "empty",
                    "Sarvam returned a mostly-English response instead of Nepali.",
                )
        coverage = 1.0
        if target_lang == "ne":
            coverage = heading_coverage(text, translated)
            if coverage < HEADING_COVERAGE_FLOOR and attempt < max_retries:
                # Some lines (usually the title) came back untranslated. Spend
                # the bounded retry to get a complete document rather than
                # falling back wholesale.
                last_error = ValueError(
                    f"only {coverage:.0%} of substantive lines were translated"
                )
                continue
        return {
            "text": translated,
            "model": config.sarvam_model,
            "provider": "sarvam",
            "heading_coverage": coverage,
        }
    if isinstance(last_error, requests.Timeout):
        raise SarvamError("timeout", "Sarvam translation timed out.") from last_error
    if isinstance(last_error, ValueError):
        raise SarvamError("partial_translation", str(last_error)) from last_error
    raise SarvamError("network", f"Sarvam request failed after retry: {last_error}.")
