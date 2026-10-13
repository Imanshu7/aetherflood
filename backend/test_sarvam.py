"""Offline tests for the Sarvam AI translation integration.

No external network: requests.post is stubbed, so these tests verify failure
modes, prompt construction, response parsing, and engine wiring — not live
Sarvam output. A live translation check requires SARVAM_API_KEY.
"""
import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from unittest import mock
import re
import requests as real_requests

from backend.services import sarvam_translate as ST
from backend.services.copilot_engine import copilot_engine


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload if payload is not None else {}
        self.text = text
        self.ok = 200 <= status_code < 300

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


def with_key(key):
    return mock.patch.object(ST.config, "sarvam_api_key", key)


_NE_FILLER = [
    "नेपाली अनुवाद पाठ यहाँ उपलब्ध छ।",
    "यस रिपोर्टको स्रोत प्रमाणित छ र विश्वसनीय मानिएको छ।",
    "क्षतिग्रस्त क्षेत्रको विवरण यस अनुवादमा समावेश गरिएको छ।",
    "अन्य सूचनाका लागि स्रोत साहित्य हेर्नुपर्नेछ।",
    "यो विवरण अघिल्लो प्रतिवेदनसँग मिल्दो छ।",
]

# Markdown prefix (heading hashes, bullets, bold) must survive translation.
_MD_PREFIX = re.compile(r"^\s*(?:(?:#{1,6}|[-*])\s*|\*\*|__)")


def ne_translation_of(source: str) -> str:
    """
    Build a stand-in Nepali translation that mirrors the source line-for-line.

    Sarvam is required to preserve Markdown structure exactly, so a realistic
    mock must do the same. Returning an unrelated fixed string (as an earlier
    version of this test did) is correctly rejected by the coverage guard, and
    keeping the English prose would be correctly rejected by the whole-document
    Devanagari floor. This replaces the prose and keeps the structure.
    """
    out = []
    counter = 0
    for line in source.split("\n"):
        stripped = line.strip()
        if len(re.findall(r"[A-Za-z]", stripped)) < ST._MIN_CHECKABLE_LETTERS:
            out.append(line)
            continue
        match = _MD_PREFIX.match(line)
        prefix = match.group(0) if match else ""
        out.append(prefix + _NE_FILLER[counter % len(_NE_FILLER)])
        counter += 1
    return "\n".join(out)


def test_missing_key():
    with with_key(""):
        try:
            ST.translate_text("Hello", target_lang="ne")
            raise AssertionError("translated without a key")
        except ST.SarvamError as exc:
            assert exc.code == "missing_key", exc.code
    print("[PASS] missing key raises a clear configuration error")


def test_validation():
    with with_key("k"):
        for kwargs, code in [
            ({"text": "   ", "target_lang": "ne"}, "empty_input"),
            ({"text": "x", "target_lang": "xx"}, "unsupported_language"),
            ({"text": "x" * (ST.MAX_CHARS_PER_REQUEST + 1), "target_lang": "ne"}, "too_long"),
        ]:
            try:
                ST.translate_text(**kwargs)
                raise AssertionError(f"accepted invalid input ({code})")
            except ST.SarvamError as exc:
                assert exc.code == code, (code, exc.code)
    print("[PASS] input validation (empty/unsupported/oversize)")


def test_prompt_pins_facts():
    messages = ST.build_translation_prompt("Area is 14.82 km².", source_lang="en", target_lang="ne")
    system = messages[0]["content"]
    assert "Preserve every number" in system
    assert "never add facts" in system.lower() or "Never add facts" in system
    print("[PASS] translation prompt pins fact preservation")


def ok_payload(text):
    return {"choices": [{"message": {"content": text}}]}


def test_success_and_failures():
    with with_key("k"):
        calls = []
        def fake_post(url, json=None, headers=None, timeout=None):
            calls.append({"url": url, "json": json, "headers": headers})
            return FakeResponse(200, ok_payload("बाढी प्रतिवेदन।"))
        with mock.patch.object(ST.requests, "post", side_effect=fake_post):
            out = ST.translate_text("Flood report.", target_lang="ne")
            assert out["text"] == "बाढी प्रतिवेदन।", out
            assert out["provider"] == "sarvam" and out["model"] == ST.config.sarvam_model
            sent = calls[0]
            assert sent["url"] == ST.config.sarvam_api_url, sent["url"]
            assert sent["json"]["model"] == ST.config.sarvam_model
            assert sent["json"]["reasoning_effort"] is None
            assert sent["headers"]["api-subscription-key"] == "k", "missing Sarvam auth header"
            assert "Bearer" in sent["headers"].get("Authorization", "")
        with mock.patch.object(ST.requests, "post", return_value=FakeResponse(401, {}, "denied")):
            try:
                ST.translate_text("x", target_lang="ne")
                raise AssertionError("accepted 401")
            except ST.SarvamError as exc:
                assert exc.code == "auth", exc.code
        with mock.patch.object(ST.requests, "post", return_value=FakeResponse(403, {}, "forbidden")):
            try:
                ST.translate_text("x", target_lang="ne")
                raise AssertionError("accepted 403")
            except ST.SarvamError as exc:
                assert exc.code == "auth", exc.code
        with mock.patch.object(ST.requests, "post", return_value=FakeResponse(429, {}, "slow")):
            try:
                ST.translate_text("x", target_lang="ne")
                raise AssertionError("accepted 429")
            except ST.SarvamError as exc:
                assert exc.code == "rate_limited", exc.code
        with mock.patch.object(ST.requests, "post",
                               return_value=FakeResponse(200, {"choices": [{"message": {"content": "  "}}]})):
            try:
                ST.translate_text("x", target_lang="ne")
                raise AssertionError("accepted empty output")
            except ST.SarvamError as exc:
                assert exc.code == "empty", exc.code
        with mock.patch.object(ST.requests, "post",
                               return_value=FakeResponse(200, ok_payload(
                                   "This is a long English echo with more than twenty latin characters."))):
            try:
                ST.translate_text(
                    "This is a long English echo with more than twenty latin characters.",
                    target_lang="ne")
                raise AssertionError("accepted an untranslated English echo")
            except ST.SarvamError as exc:
                assert exc.code == "empty", exc.code
        long_source = ("This is a much longer English source text that definitely exceeds one hundred "
                       "and twenty characters in total length for testing purposes here.")
        with mock.patch.object(ST.requests, "post",
                               return_value=FakeResponse(200, ok_payload(long_source + " हो।"))):
            try:
                ST.translate_text(long_source, target_lang="ne")
                raise AssertionError("accepted a mostly-English partial echo")
            except ST.SarvamError as exc:
                assert exc.code == "empty", exc.code
        with mock.patch.object(ST.requests, "post",
                               side_effect=real_requests.Timeout("slow")):
            try:
                ST.translate_text("x", target_lang="ne")
                raise AssertionError("accepted timeout")
            except ST.SarvamError as exc:
                assert exc.code == "timeout", exc.code
    print("[PASS] success parsing + auth/rate-limit/empty/timeout handling")


def test_engine_wiring():
    with with_key(""):
        resp = copilot_engine.answer_query(query="What was damaged?", lang="ne")
        assert resp.status == "ok", resp.status
        # A missing key must never leak the key value itself.
        assert resp.translation.get("api_key") is None
        assert resp.translation["status"] == "error", resp.translation
        assert resp.translation["code"] == "missing_key", resp.translation
        assert "SARVAM_API_KEY" in (resp.translation.get("error") or "")
    with with_key("k"):
        # The mock must translate whatever it is given, line for line; a fixed
        # unrelated string is correctly rejected as an incomplete translation.
        def echo_translation(url=None, json=None, **kwargs):
            source = (json or {}).get("messages", [{}])[-1].get("content", "")
            return FakeResponse(200, ok_payload(ne_translation_of(source)))

        with mock.patch.object(ST.requests, "post", side_effect=echo_translation):
            resp = copilot_engine.answer_query(query="What was damaged?", lang="ne")
            assert resp.status == "ok", resp.status
            assert resp.summary.strip(), "summary must not be empty"
            assert "नेपाली अनुवाद" in resp.summary, resp.summary
            assert "14.82" not in resp.summary
        # Sarvam composes directly in the requested language, so no separate
        # translation step runs and the response must say so.
        assert resp.model_provider == "sarvam", resp.model_provider
        assert resp.model_name == ST.config.sarvam_model, resp.model_name
        assert resp.translation["status"] == "native", resp.translation
        assert resp.translation["provider"] == "sarvam", resp.translation

        # A Sarvam outage must fall back to the deterministic grounded answer,
        # never to an empty reply.
        with mock.patch.object(ST.requests, "post",
                               side_effect=real_requests.ConnectionError("down")):
            fell_back = copilot_engine.answer_query(query="What was damaged?", lang="en")
        assert fell_back.summary.strip(), "fallback summary must not be empty"
        assert fell_back.verified_facts, "fallback must keep verified facts"

        # The breaker is a cooldown, not a permanent kill: it must recover.
        copilot_engine._sarvam_failures = 0
        copilot_engine._sarvam_disabled_until = 0.0
        assert copilot_engine._sarvam_ready() is True

        resp_en = copilot_engine.answer_query(query="What was damaged?", lang="en")
        assert resp_en.translation["status"] in ("skipped", "ok", "native"), resp_en.translation
    print("[PASS] engine answers via Sarvam, falls back cleanly, English path intact")


def test_sitrep_structure():
    with with_key(""):
        en = copilot_engine.generate_sitrep(lang="en")
        assert en["status"] == "unavailable"
        assert "## Executive summary" in en["sitrep_markdown"], "missing sections"
        assert "## Limitations" in en["sitrep_markdown"]
        assert "not connected" in en["sitrep_markdown"]
        assert en["translation"]["status"] == "skipped"
        ne = copilot_engine.generate_sitrep(lang="ne")
        assert ne["status"] == "unavailable" and ne["facts"] == []
        assert ne["translation"]["status"] == "error", ne["translation"]
        assert "SARVAM_API_KEY" in (ne["translation"].get("error") or "")
        assert "विपद् परिस्थिति प्रतिवेदन" in ne["sitrep_markdown"]
    with with_key("k"):
        def sitrep_translation(url=None, json=None, **kwargs):
            source = (json or {}).get("messages", [{}])[-1].get("content", "")
            return FakeResponse(200, ok_payload(ne_translation_of(source)))

        with mock.patch.object(ST.requests, "post", side_effect=sitrep_translation):
            ne2 = copilot_engine.generate_sitrep(lang="ne")
            assert ne2["translation"]["status"] == "ok", ne2["translation"]
            assert "नेपाली अनुवाद" in ne2["sitrep_markdown"], ne2["sitrep_markdown"]
            # A complete translation must still keep the report's Markdown shape.
            assert "##" in ne2["sitrep_markdown"], ne2["sitrep_markdown"]

        # A model that leaves the title and opening lines in English must not be
        # reported as "ok" - that is the defect this guard exists to catch.
        def partial_translation(url=None, json=None, **kwargs):
            source = (json or {}).get("messages", [{}])[-1].get("content", "")
            src_lines = source.split("\n")
            lines = ne_translation_of(source).split("\n")
            left_english = 0
            for i, line in enumerate(src_lines):
                if len(re.findall(r"[A-Za-z]", line)) < ST._MIN_CHECKABLE_LETTERS:
                    continue
                if left_english >= 4:
                    break
                lines[i] = line  # left untranslated, as observed from Sarvam
                left_english += 1
            return FakeResponse(200, ok_payload("\n".join(lines)))

        with mock.patch.object(ST.requests, "post", side_effect=partial_translation):
            ne3 = copilot_engine.generate_sitrep(lang="ne")
            assert ne3["translation"]["status"] == "partial", ne3["translation"]
            assert ne3["translation"]["heading_coverage"] < ST.HEADING_COVERAGE_FLOOR
    print("[PASS] sitrep sections + Nepali translation/fallback behavior")


if __name__ == "__main__":
    test_missing_key()
    test_validation()
    test_prompt_pins_facts()
    test_success_and_failures()
    test_engine_wiring()
    test_sitrep_structure()
    print("================ ALL 6 SARVAM TESTS PASSED! ================")
