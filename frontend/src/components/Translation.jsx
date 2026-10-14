import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config';

const TRANSLATE_URL = apiUrl('/api/translate');
const CHUNK_SIZE = 20;

// Session caches: successes only. Failures are never cached as translations,
// so a retry always re-attempts failed items against the backend.
const memoryCache = new Map(); // `${target}:${text}` -> translated text
const inflight = new Map(); // batchKey -> Promise<array of translated-or-source>

function batchKey(texts, target) {
  return `${target}:${JSON.stringify(texts)}`;
}

/**
 * Translate an ordered list of source strings into `lang` via the backend
 * Sarvam batch endpoint. English returns sources immediately (no request).
 * Untranslatable items fall back to their English source AND surface an
 * explicit error — English is never silently presented as Nepali.
 */
export function useBatchTranslate(texts, lang) {
  const safeTexts = Array.isArray(texts) ? texts.map((t) => String(t ?? '')) : [];
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState(() => ({
    strings: safeTexts,
    isTranslating: lang === 'ne',
    error: '',
  }));
  const callIdRef = useRef(0);
  const key = `${lang}|${JSON.stringify(safeTexts)}`;

  useEffect(() => {
    const callId = callIdRef.current + 1;
    callIdRef.current = callId;
    if (lang !== 'ne') {
      setState({ strings: safeTexts, isTranslating: false, error: '' });
      return undefined;
    }
    const missing = [];
    const missingIdx = [];
    safeTexts.forEach((text, i) => {
      if (!memoryCache.has(`ne:${text}`)) {
        missing.push(text);
        missingIdx.push(i);
      }
    });
    if (missing.length === 0) {
      setState({
        strings: safeTexts.map((text) => memoryCache.get(`ne:${text}`) ?? text),
        isTranslating: false,
        error: '',
      });
      return undefined;
    }
    setState((prev) => ({ strings: prev.strings.length === safeTexts.length ? prev.strings : safeTexts, isTranslating: true, error: '' }));
    let cancelled = false;
    const run = async () => {
      const out = [...safeTexts];
      const failures = [];
      for (let start = 0; start < missing.length; start += CHUNK_SIZE) {
        const chunk = missing.slice(start, start + CHUNK_SIZE);
        const key2 = batchKey(chunk, 'ne');
        let promise = inflight.get(key2);
        if (!promise) {
          promise = (async () => {
            const res = await fetch(TRANSLATE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ texts: chunk, target_lang: 'ne' }),
            });
            if (!res.ok) throw new Error(`Translation request failed (${res.status}).`);
            const data = await res.json();
            if (!Array.isArray(data.translations)) throw new Error('Invalid translation response.');
            return data.translations;
          })();
          inflight.set(key2, promise);
          promise.finally(() => {
            if (inflight.get(key2) === promise) inflight.delete(key2);
          });
        }
        let items;
        try {
          items = await promise;
        } catch (err) {
          if (!cancelled && callIdRef.current === callId) {
            setState({ strings: [...safeTexts], isTranslating: false, error: err.message || 'Translation request failed.' });
          }
          return;
        }
        items.forEach((item) => {
          const globalIdx = missingIdx[start + item.index];
          if (item.status === 'ok' && item.text) {
            memoryCache.set(`ne:${chunk[item.index]}`, item.text);
            out[globalIdx] = item.text;
          } else {
            failures.push(item.code || 'error');
          }
        });
      }
      if (!cancelled && callIdRef.current === callId) {
        setState({
          strings: out,
          isTranslating: false,
          error: failures.length > 0
            ? `Nepali translation unavailable for ${failures.length} item${failures.length === 1 ? '' : 's'} — showing English source text.`
            : '',
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryCount]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);
  return { ...state, retry };
}

const EMPHASIS_PHRASES = {
  en: [
    'Pasang Lhamu Highway', 'Nepal–Tibet', 'Budhi Gandaki', 'Bhote Koshi',
    '11 October 2026', '26 August 2026', '12 August 2026', '27 August 2026',
    'Syapru Besi', 'Betrawati', 'Gerkhu', 'Trishuli', 'Chumchet',
    'EMSR927', 'NH09', 'ICIMOD',
  ],
  ne: [
    'पसाङ ल्हामु राजमार्ग', 'नेपाल–तिब्बत', 'बुढीगण्डकी', 'भोटेकोसी',
    '११ अक्टोबर २०२६', '२६ अगस्ट २०२६', '१२ अगस्ट २०२६', '२७ अगस्ट २०२६',
    'स्याप्रुवेशी', 'बेत्रावती', 'गेर्खु', 'त्रिशूली', 'चुम्चेत',
    'EMSR927', 'NH09', 'ICIMOD',
  ],
};

/**
 * Restrained exact-phrase emphasis for report prose (EN + NE). Splits on
 * known proper nouns, dates, and identifiers only — never regex, never
 * numbers/URLs/coords touched, so Nepali words and identifiers stay intact.
 */
export function emphasize(text, lang = 'en') {
  if (typeof text !== 'string' || !text) return text;
  const phrases = [...(EMPHASIS_PHRASES[lang] || EMPHASIS_PHRASES.en)]
    .sort((a, b) => b.length - a.length);
  let parts = [text];
  phrases.forEach((phrase) => {
    const next = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') {
        next.push(part);
        return;
      }
      let rest = part;
      let idx = rest.indexOf(phrase);
      while (idx !== -1) {
        if (idx > 0) next.push(rest.slice(0, idx));
        next.push({ em: phrase });
        rest = rest.slice(idx + phrase.length);
        idx = rest.indexOf(phrase);
      }
      next.push(rest);
    });
    parts = next;
  });
  return parts
    .filter((part) => part !== '')
    .map((part, i) => (typeof part === 'object'
      ? <strong key={i} style={{ color: '#0a2213' }}>{part.em}</strong>
      : <span key={i}>{part}</span>));
}

/** Compact inline notice for partial translation failure (never silent). */
export function TranslationNotice({ error, onRetry, lang }) {
  if (!error) return null;
  return (
    <div className="ems-compare-warning" role="status" style={{ marginTop: '8px' }}>
      <span>{lang === 'ne' ? 'नेपाली अनुवाद उपलब्ध छैन' : 'Nepali translation unavailable'}: {error}</span>
      {onRetry && (
        <button type="button" className="btn-white-pill" onClick={onRetry} style={{ marginLeft: '8px' }}>
          {lang === 'ne' ? 'पुनः प्रयास' : 'Retry'}
        </button>
      )}
    </div>
  );
}
