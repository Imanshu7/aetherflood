import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  Send, 
  Download, 
  FileText, 
  ShieldCheck,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { apiUrl } from '../config';

export default function CopilotView({ currentUser, lang = 'en', onLanguageChange }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [selectedIncident, setSelectedIncident] = useState('nepal-tibet-2026-08-26');
  // The greeting is language-reactive: its text is resolved from the dictionary
  // at render time so toggling EN/NE updates an already-mounted chat.
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      author: 'Aether Rescue Copilot',
      text: 'Welcome to AetherFlood Decision Copilot. This decision-support system is strictly grounded in verified Earth observation and agency reports. It cannot invent incident numbers.',
      time: 'Grounded Mode',
      provider: 'Zero-Hallucination Engine',
      isGreeting: true
    }
  ]);

  const displayMessages = useMemo(
    () => messages.map((m) => (m.isGreeting
      ? { ...m, author: t.copilot.welcomeAuthor, text: t.copilot.welcomeText, time: t.copilot.groundedMode, provider: t.copilot.zeroHallucination }
      : m)),
    [messages, lang]
  );

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sitrepModalOpen, setSitrepModalOpen] = useState(false);
  const [sitrepData, setSitrepData] = useState(null);
  // Translating a full SITREP through Sarvam takes several seconds, so the
  // language switch needs its own pending state or the document appears frozen.
  const [sitrepLoading, setSitrepLoading] = useState(false);
  const [incidentRecords, setIncidentRecords] = useState([]);
  // Scroll behaviour: follow new messages, but never yank the view away while
  // the operator is reading older ones.
  const streamRef = useRef(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      // After layout, so the new height is already applied.
      const raf = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [displayMessages, isTyping]);

  // While a reply is being produced the stream grows on its own. Those growth
  // scroll events must not be mistaken for the operator scrolling away to read
  // older messages, or auto-scroll would disengage mid-answer.
  const revealInFlightRef = useRef(false);

  const handleStreamScroll = () => {
    const el = streamRef.current;
    if (!el) return;
    if (revealInFlightRef.current || isTyping) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 48;
    stickToBottomRef.current = atBottom;
    setShowJumpToLatest(!atBottom);
  };

  const jumpToLatest = () => {
    const el = streamRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowJumpToLatest(false);
  };

  // --- Smooth response presentation -------------------------------------
  // Grounded answers return in ~20ms, so the pending state would otherwise
  // flicker (or never paint) and a 2000-character reply would appear in a
  // single jump. A short guaranteed pending window gives consistent feedback,
  // and the reply is then revealed progressively so it reads as an answer being
  // written rather than a wall of text materialising.
  const MIN_PENDING_MS = 260;
  const REVEAL_CHUNK = 90;      // characters revealed per frame
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTimerRef = useRef(null);

  useEffect(() => () => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
  }, []);

  // Fills the newest bot bubble a chunk at a time so a long grounded answer
  // reads as being written instead of appearing in one jump. Resolves when the
  // bubble holds the complete text.
  const revealProgressively = (fullText) => {
    const text = String(fullText || '');
    if (prefersReducedMotion || text.length <= REVEAL_CHUNK) {
      setMessages(prev => prev.map((m) => (
        m.streaming ? { ...m, text, streaming: false } : m
      )));
      return Promise.resolve();
    }
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    return new Promise((resolve) => {
      let shown = 0;
      revealTimerRef.current = setInterval(() => {
        shown = Math.min(text.length, shown + REVEAL_CHUNK);
        if (shown >= text.length) {
          clearInterval(revealTimerRef.current);
          revealTimerRef.current = null;
          setMessages(prev => prev.map((m) => (
            m.streaming ? { ...m, text, streaming: false } : m
          )));
          resolve();
        } else {
          const slice = text.slice(0, shown);
          setMessages(prev => prev.map((m) => (
            m.streaming ? { ...m, text: slice } : m
          )));
        }
      }, 16);
    });
  };

  useEffect(() => {
    fetch(apiUrl(`/api/incidents?incident_id=${selectedIncident}`))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIncidentRecords(data);
        }
      })
      .catch(err => console.warn(err));
  }, [selectedIncident]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    const currentQuery = inputQuery;
    setInputQuery('');
    sendQuery(currentQuery);
  };

  const holdPending = async (startedAt) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_PENDING_MS) {
      await new Promise((r) => setTimeout(r, MIN_PENDING_MS - elapsed));
    }
    setIsTyping(false);
  };

  const sendQuery = async (queryText) => {
    const currentQuery = queryText;
    if (!currentQuery || !currentQuery.trim()) return;
    // Guard: the send control is also disabled while typing, but Enter and a
    // fast double-press can still race past that render.
    if (isTyping) return;

    const userMessage = {
      sender: 'user',
      author: currentUser ? currentUser.name : (lang === 'ne' ? 'उद्धार अधिकारी' : 'Incident Commander'),
      text: currentQuery,
      time: 'Just now'
    };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);
    revealInFlightRef.current = true;
    const pendingStarted = Date.now();

    try {
      const res = await fetch(apiUrl('/api/copilot/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentQuery,
          incident_id: selectedIncident,
          language: lang,
          mode: 'offline',
          // Bounded conversation so follow-ups resolve references.
          history: messages
            .filter((m) => !m.isGreeting)
            .slice(-8)
            .map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: String(m.text || '').slice(0, 1200),
            })),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Copilot request failed (${res.status}).`);
      
      const replyText = typeof data.reply === 'object' ? (data.reply.summary || JSON.stringify(data.reply)) : (data.summary || data.reply);
      const proof = data.audit_proof;
      const provider = data.provider || data.model_provider || 'grounded';
      const model = data.model || data.model_name;

      // Hold the pending state briefly so the indicator is always perceivable,
      // then add the bubble empty and let it fill in progressively.
      await holdPending(pendingStarted);
      stickToBottomRef.current = true;
      setMessages(prev => [...prev, {
        sender: 'bot',
        author: lang === 'ne' ? 'ऐथर उद्धार कोपाइलट' : 'Aether Rescue Copilot',
        text: '',
        streaming: true,
        query: currentQuery,
        incidentId: data.incident_id || null,
        time: model ? `${provider} (${model})` : provider,
        auditProof: proof,
        provider: provider,
        facts: data.verified_facts || [],
        dataGaps: data.data_gaps || [],
        sources: data.sources || [],
        translation: data.translation || null
      }]);
      await revealProgressively(replyText);
      revealInFlightRef.current = false;
    } catch {
      setMessages(prev => [...prev, {
        sender: 'bot',
        author: lang === 'ne' ? 'ऐथर उद्धार कोपाइलट' : 'Aether Rescue Copilot',
        text: lang === 'ne' 
          ? 'प्रमाणित स्रोतहरूसँग सम्पर्क हुन सकेन। कृपया आफ्नो प्रश्न पुनः प्रयास गर्नुहोस्।'
          : 'Unable to reach the decision copilot backend. Please check connection and retry.',
        time: 'Connection error',
        provider: 'fallback'
      }]);
    } finally {
      revealInFlightRef.current = false;
      setIsTyping(false);
    }
  };

  const handleFetchSitrep = async (selectedLang) => {
    const l = selectedLang || lang;
    setSitrepLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/copilot/sitrep?incident_id=${selectedIncident}&language=${l}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Situation report request failed (${res.status}).`);
      setSitrepData(data);
      setSitrepModalOpen(true);
    } catch {
      alert("Unable to fetch SITREP document from backend.");
    } finally {
      setSitrepLoading(false);
    }
  };

  // Chrome's `ne-NP` locale silently falls back to US month/day ordering, which
// makes an issued-at date ambiguous on a printed disaster report. DD/MM/YYYY is
// the unambiguous form used for both languages.
const formatReportTimestamp = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
};

const isSafeHttpUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Inline renderer: safe links [text](http...) + **bold**. Never raw HTML,
  // never scripts; non-http(s) targets render as plain text. Numbers and
  // identifiers without brackets pass through byte-identical.
  const renderInlineContent = (text, keyPrefix = '') => {
    const linkParts = String(text).split(/(\[[^\]]+?\]\([^)]+?\))/g);
    return linkParts.map((part, li) => {
      const linkMatch = part.match(/^\[([^\]]+?)\]\(([^)]+?)\)$/);
      if (linkMatch && isSafeHttpUrl(linkMatch[2])) {
        return (
          <a key={`${keyPrefix}l${li}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            style={{ color: '#1e783e', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            {linkMatch[1]}
          </a>
        );
      }
      if (linkMatch) return <span key={`${keyPrefix}l${li}`}>{linkMatch[1]}</span>;
      return part.split(/(\*\*.*?\*\*)/g).map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4
          ? <strong key={`${keyPrefix}b${li}-${i}`}>{p.slice(2, -2)}</strong>
          : <span key={`${keyPrefix}b${li}-${i}`}>{p}</span>
      );
    });
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <div key={idx} style={{ fontWeight: '800', fontSize: '15px', margin: '0 0 8px 0', color: '#0a2213' }}>{renderInlineContent(trimmed.replace('# ', ''), `h${idx}`)}</div>;
      }
      if (trimmed.startsWith('### ')) {
        return <div key={idx} style={{ fontWeight: '700', fontSize: '13px', margin: '8px 0 4px 0', color: '#0a2213' }}>{renderInlineContent(trimmed.replace('### ', ''), `h${idx}`)}</div>;
      }
      if (trimmed.startsWith('## ')) {
        return <div key={idx} style={{ fontWeight: '800', fontSize: '13.5px', margin: '12px 0 6px 0', color: '#1e783e', paddingBottom: '4px', borderBottom: '1px solid rgba(30, 120, 62, 0.2)' }}>{renderInlineContent(trimmed.replace('## ', ''), `h${idx}`)}</div>;
      }
      if (trimmed === '---' || trimmed === '***') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(10, 34, 19, 0.12)', margin: '10px 0' }} />;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <div key={idx} style={{ fontWeight: '600', fontSize: '13px', margin: '6px 0 2px 0', color: '#0a2213' }}>{renderInlineContent(trimmed.replace(/\*\*/g, ''), `s${idx}`)}</div>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const cleaned = trimmed.replace(/^[-•*]\s+/, '');
        return (
          <div key={idx} style={{ paddingLeft: '8px', margin: '3px 0', lineHeight: '1.45', fontSize: '13px' }}>
            <span style={{ color: '#1e783e', marginRight: '6px' }}>•</span>
            {renderInlineContent(cleaned, `u${idx}`)}
          </div>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} style={{ paddingLeft: '8px', margin: '3px 0', lineHeight: '1.45', fontSize: '13px' }}>
            {renderInlineContent(trimmed, `o${idx}`)}
          </div>
        );
      }
      if (!trimmed) {
        return <div key={idx} style={{ height: '4px' }} />;
      }
      return (
        <div key={idx} style={{ margin: '3px 0', lineHeight: '1.45', fontSize: '13px' }}>
          {renderInlineContent(trimmed, `p${idx}`)}
        </div>
      );
    });
  };

  const isAugust = selectedIncident === 'nepal-tibet-2026-08-26';

  // The conversation can drift onto the other incident (retrieval is
  // query-driven), so suggestions and the placeholder follow what has actually
  // been discussed rather than only the pill in the header. The incident id
  // comes from the backend response, which is authoritative — sniffing the
  // answer text is unreliable because every reply quotes a related incident.
  const activeIncidentId = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i -= 1) {
      const m = displayMessages[i];
      if (m.sender === 'bot' && !m.isGreeting && m.incidentId) return m.incidentId;
    }
    return selectedIncident;
  }, [displayMessages, selectedIncident]);

  const talkingAugust = activeIncidentId === 'nepal-tibet-2026-08-26';

  const inputPlaceholder = lang === 'ne'
    ? `${talkingAugust ? 'अगस्ट २६' : 'अक्टोबर ११'} बाढी सम्बन्धी सोध्नुहोस्...`
    : `Ask about the ${talkingAugust ? '26 Aug' : '11 Oct'} incident…`;

  // Suggestions progress with the conversation instead of being static.
  const activeSuggestions = useMemo(() => {
    if (talkingAugust) {
      return [
        { label: 'Bridges affected', query: 'Which bridges were reported affected?' },
        { label: 'Verification status', query: 'What information is still unverified?' },
        { label: 'Satellite pairs', query: 'Which satellite comparison pairs are available?' },
        { label: 'Sources', query: 'Which sources reported this incident?' },
      ];
    }
    return [
      { label: 'Bridges affected', query: 'Which bridges were reported affected?' },
      { label: 'Casualties', query: 'What is the confirmed casualty count?' },
      { label: 'Missing data', query: 'What information is still missing?' },
      { label: 'Compare with August', query: 'Compare this with the August Trishuli flood.' },
    ];
  }, [talkingAugust]);

  return (
    <div className="copilot-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Top Header Card with Incident Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 22px',
        borderRadius: '22px',
        border: '1px solid rgba(10, 34, 19, 0.08)',
        boxShadow: '0 4px 16px rgba(10, 34, 19, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0a2213', letterSpacing: '-0.015em' }}>
              {t.copilot.title}
            </div>
            <div style={{ fontSize: '11px', color: '#52735d' }}>
              Bilingual Grounded Decision Engine · English &amp; नेपाली
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            backgroundColor: 'rgba(30, 120, 62, 0.12)',
            color: '#1e783e',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: '600',
            border: '1px solid rgba(30, 120, 62, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={11} color="#1e783e" />
            Zero-Hallucination Safe
          </span>
        </div>

        {/* Right Controls: Incident Selector + Language + Sitrep */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Incident Selector Pills */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f2f7f4',
            borderRadius: '9999px',
            padding: '2px',
            border: '1px solid rgba(10, 34, 19, 0.12)'
          }}>
            <button
              type="button"
              onClick={() => setSelectedIncident('nepal-tibet-2026-08-26')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: isAugust ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: isAugust ? '#0d2818' : 'transparent',
                color: isAugust ? '#ffffff' : '#0a2213',
                transition: 'all 0.15s ease'
              }}
            >
              Incident A (26 Aug 2026)
            </button>
            <button
              type="button"
              onClick={() => setSelectedIncident('budhi-gandaki-2026-10-11')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: !isAugust ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: !isAugust ? '#0d2818' : 'transparent',
                color: !isAugust ? '#ffffff' : '#0a2213',
                transition: 'all 0.15s ease'
              }}
            >
              Incident B (11 Oct 2026)
            </button>
          </div>

          {/* Bilingual Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(10, 34, 19, 0.06)',
            borderRadius: '9999px',
            padding: '2px',
            border: '1px solid rgba(10, 34, 19, 0.12)'
          }}>
            <button
              onClick={() => onLanguageChange && onLanguageChange('en')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: lang === 'en' ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: lang === 'en' ? '#0d2818' : 'transparent',
                color: lang === 'en' ? '#ffffff' : '#0a2213',
                boxShadow: lang === 'en' ? '0 2px 6px rgba(10, 34, 19, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange && onLanguageChange('ne')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '11px',
                fontWeight: lang === 'ne' ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: lang === 'ne' ? '#0d2818' : 'transparent',
                color: lang === 'ne' ? '#ffffff' : '#0a2213',
                boxShadow: lang === 'ne' ? '0 2px 6px rgba(10, 34, 19, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              नेपाली
            </button>
          </div>

          {/* SITREP Button */}
          <button 
            className="btn-dark-green-pill" 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: '600' }}
            onClick={() => handleFetchSitrep(lang)}
          >
            <FileText size={13} color="#ffffff" />
            <span>{t.copilot.generateSitrep}</span>
          </button>

        </div>
      </div>

      {/* Main Grid: Incident Records Sidebar (Left) + Interactive Grounded Chat (Right) */}
      <div className="copilot-main-grid">
        
        {/* Left Sub-Panel: Grounding Context for Active Incident */}
        <div className="grey-card copilot-incidents-sidebar" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12.5px', color: '#0a2213', fontWeight: '700' }}>
              {isAugust ? t.copilot.groundingRecordsNepalTibet : t.copilot.groundingRecordsBudhi}
            </div>
            <span style={{ fontSize: '10px', color: '#1e783e', fontWeight: '600', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
              {t.copilot.verifiedCount.replace('{n}', String(incidentRecords.length))}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
            {incidentRecords.map((item) => {
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(10, 34, 19, 0.08)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onClick={() => {
                    setInputQuery(lang === 'ne' ? `${item.title} बारे विवरण दिनुहोस्` : `Provide details on ${item.title}`);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#0a2213' }}>{item.title}</span>
                    <span style={{ 
                      fontSize: '9px', 
                      fontWeight: '600', 
                      color: '#1e783e',
                      backgroundColor: 'rgba(30, 120, 62, 0.1)',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#52735d', lineHeight: '1.4' }}>
                    {item.subtitle}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#1e783e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>Source: {item.source_name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(10, 34, 19, 0.08)', fontSize: '10px', color: '#52735d' }}>
            {t.copilot.evidenceFooter}
          </div>
        </div>

        {/* Right Sub-Panel: Chat Stream */}
        <div className="grey-card copilot-chat-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

          {showJumpToLatest && (
            <button type="button" className="copilot-scroll-latest" onClick={jumpToLatest}>
              <ChevronDown size={12} aria-hidden="true" />
              {lang === 'ne' ? 'तल जानुहोस्' : 'Jump to latest'}
            </button>
          )}

          {/* Messages Stream */}
          <div
            className="copilot-chat-stream"
            ref={streamRef}
            onScroll={handleStreamScroll}
          >
            {displayMessages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '88%',
                    alignSelf: isBot ? 'flex-start' : 'flex-end'
                  }}
                >
                  {/* Author & Time */}
                  <div className="copilot-meta-row">
                    <strong>{msg.author}</strong>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={[
                      'copilot-msg-bubble',
                      isBot ? 'is-bot' : 'is-user',
                      msg.streaming ? 'is-streaming' : '',
                      index === displayMessages.length - 1 && !msg.streaming ? 'copilot-msg-enter' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {renderMessageContent(msg.text)}

                    {/* Verified Facts Tagging */}
                    {isBot && msg.facts && msg.facts.length > 0 && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(10, 34, 19, 0.08)' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#1e783e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} color="#1e783e" />
                          Grounded Verified Facts ({msg.facts.length})
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#2b4d37' }}>
                          {msg.facts.slice(0, 3).map((f, fi) => (
                            <li key={fi} style={{ marginBottom: '2px' }}>
                              {f.statement} <em>({f.source_name})</em>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Data Gaps Notice */}
                    {isBot && msg.dataGaps && msg.dataGaps.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#855800', backgroundColor: '#fff9e6', padding: '4px 8px', borderRadius: '6px' }}>
                        <strong>Documented Data Gap:</strong> {msg.dataGaps[0]}
                      </div>
                    )}

                    {/* Translation status: Sarvam Nepali or explicit error + retry */}
                    {isBot && msg.translation && msg.translation.status === 'ok' && (
                      <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#1e783e', fontWeight: '600' }}>
                        नेपाली अनुवाद · Sarvam AI{msg.translation.model ? ` (${msg.translation.model})` : ''}
                      </div>
                    )}
                    {isBot && msg.translation && msg.translation.status === 'error' && (
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#855800', backgroundColor: '#fff9e6', padding: '6px 8px', borderRadius: '6px' }}>
                        <strong>Nepali translation unavailable:</strong> {msg.translation.error || msg.translation.code}
                        <button
                          type="button"
                          onClick={() => sendQuery(msg.query || '')}
                          disabled={isTyping || !msg.query}
                          style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(133, 88, 0, 0.35)', background: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', color: '#855800' }}
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Audit Proof Token */}
                    {isBot && msg.auditProof && (
                      <div style={{ marginTop: '6px', fontSize: '9px', color: '#8e8e93', fontFamily: 'monospace' }}>
                        Proof: {msg.auditProof}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="copilot-typing">
                <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #1e783e', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>{lang === 'ne' ? 'प्रमाणित घटना आधार खोज्दै...' : 'Checking verified incident grounding…'}</span>
              </div>
            )}
          </div>

          {/* Context-aware follow-up suggestions for the active conversation */}
          <div className="copilot-quick-row" role="group" aria-label={lang === 'ne' ? 'सुझावहरू' : 'Suggested follow-ups'}>
            {activeSuggestions.map((q) => (
              <button
                key={q.label}
                type="button"
                className="copilot-quick-chip"
                onClick={() => setInputQuery(q.query)}
                title={q.query}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form className="copilot-input-row" onSubmit={handleSendMessage}>
            <textarea
              className="copilot-textarea"
              value={inputQuery}
              rows={1}
              aria-label={lang === 'ne' ? 'प्रश्न लेख्नुहोस्' : 'Ask a question about the incident records'}
              placeholder={inputPlaceholder}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter inserts a newline.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isTyping || !inputQuery.trim()}
              className="btn-dark-green-pill copilot-send-btn"
              aria-label={lang === 'ne' ? 'पठाउनुहोस्' : 'Send question'}
            >
              <Send size={13} color="#ffffff" />
              <span>{isTyping ? (lang === 'ne' ? 'पठाइँदै' : 'Sending') : 'Ask'}</span>
            </button>
          </form>

        </div>

      </div>

      {/* Official Situation Report (SITREP) Modal */}
      {sitrepModalOpen && (
        <div className="modal-overlay print-report-overlay" onClick={() => setSitrepModalOpen(false)}>
          <div 
            className="modal-content print-report-sheet" 
            style={{ maxWidth: '840px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', backgroundColor: '#ffffff', border: '1px solid rgba(10, 34, 19, 0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Print-only document masthead: absent on screen, present on paper. */}
            <div className="print-only print-report-masthead">
              <div className="print-report-brand">
                AETHERFLOOD<span>{t.copilot.report.brand}</span>
              </div>
              <div className="print-report-meta">
                <div><strong>{t.copilot.report.labelReport}</strong> {sitrepData?.incident_title || (lang === 'ne' ? 'परिस्थिति प्रतिवेदन' : 'Situation Report')}</div>
                <div><strong>{t.copilot.report.labelPrepared}</strong> {sitrepData?.generated_at ? formatReportTimestamp(sitrepData.generated_at) : 'UTC'}</div>
                <div><strong>{t.copilot.report.labelLanguage}</strong> {lang === 'ne' ? t.copilot.report.languageNe : t.copilot.report.languageEn}</div>
                <div><strong>{t.copilot.report.labelStatus}</strong> {sitrepData?.status || 'unavailable'}</div>
              </div>
            </div>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(10, 34, 19, 0.08)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0a2213', margin: 0 }}>
                    {sitrepData?.incident_title || (lang === 'ne' ? 'परिस्थिति प्रतिवेदन' : 'Situation Report')}
                  </h3>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#1e783e', backgroundColor: 'rgba(30, 120, 62, 0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                    {t.copilot.report.groundedBadge}
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#52735d', marginTop: '2px' }}>
                  {t.copilot.report.compliant}
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', backgroundColor: 'rgba(10, 34, 19, 0.06)', borderRadius: '9999px', padding: '2px', border: '1px solid rgba(10, 34, 19, 0.12)' }}>
                  <button
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange('en');
                      handleFetchSitrep('en');
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      border: 'none',
                      fontSize: '10.5px',
                      fontWeight: lang === 'en' ? '700' : '500',
                      cursor: 'pointer',
                      backgroundColor: lang === 'en' ? '#0d2818' : 'transparent',
                      color: lang === 'en' ? '#ffffff' : '#0a2213',
                      boxShadow: lang === 'en' ? '0 2px 6px rgba(10, 34, 19, 0.25)' : 'none'
                    }}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange('ne');
                      handleFetchSitrep('ne');
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      border: 'none',
                      fontSize: '10.5px',
                      fontWeight: lang === 'ne' ? '700' : '500',
                      cursor: 'pointer',
                      backgroundColor: lang === 'ne' ? '#0d2818' : 'transparent',
                      color: lang === 'ne' ? '#ffffff' : '#0a2213',
                      boxShadow: lang === 'ne' ? '0 2px 6px rgba(10, 34, 19, 0.25)' : 'none'
                    }}
                  >
                    नेपाली
                  </button>
                </div>

                <button 
                  className="btn-white-pill" 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => window.print()}
                >
                  <Download size={12} color="#1e783e" />
                  <span>{t.copilot.report.printDocument}</span>
                </button>

                <button className="btn-black-pill" style={{ fontSize: '11px', padding: '4px 12px' }} onClick={() => setSitrepModalOpen(false)}>
                  {t.copilot.report.close}
                </button>
              </div>
            </div>

            {/* Rendered SITREP Text Content */}
            <div className="print-report-body" style={{
              backgroundColor: '#f6faf7',
              border: '1px solid rgba(10, 34, 19, 0.08)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#0a2213',
              marginTop: '14px'
            }}>
              {sitrepLoading ? (
              <div className="copilot-typing" style={{ padding: '18px 4px' }}>
                    <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #1e783e', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    {t.copilot.report.translating}
                  </div>
            ) : (
              sitrepData && renderMessageContent(sitrepData.sitrep_markdown)
            )}
            </div>

            {sitrepData?.translation?.status === 'ok' && (
              <div style={{ marginTop: '8px', fontSize: '10px', color: '#1e783e', fontWeight: '600' }}>
                {t.copilot.report.translatedBy} · Sarvam AI{sitrepData.translation.model ? ` (${sitrepData.translation.model})` : ''}
              </div>
            )}
            {sitrepData?.translation?.status === 'partial' && (
              <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#855800', backgroundColor: '#fff9e6', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 149, 0, 0.3)' }} role="status">
                <strong>{t.copilot.report.translationPartial}</strong>{' '}
                {t.copilot.report.translationPartialBody}
              </div>
            )}
            {sitrepData?.translation?.status === 'error' && (
              <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#855800', backgroundColor: '#fff9e6', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 149, 0, 0.3)' }} role="alert">
                <strong>{t.copilot.report.translationFailed}</strong> {sitrepData.translation.error || sitrepData.translation.code}
                {' '}{t.copilot.report.translationFailedBody}
              </div>
            )}

            {Array.isArray(sitrepData?.sources) && sitrepData.sources.length > 0 && (
              <div className="print-report-sources" style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0a2213', marginBottom: '6px' }}>
                  {lang === 'ne' ? 'स्रोतहरू' : 'Sources'}
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#1f422b', display: 'grid', gap: '4px' }}>
                  {sitrepData.sources.map((source, si) => (
                    <li key={si}>
                      {/^https?:\/\//.test(source.url || '') ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#1e783e', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                          {source.name || source.url}
                        </a>
                      ) : (
                        <span>{source.name || 'Source'}</span>
                      )}
                      {source.date ? <span style={{ color: '#52735d' }}> — {source.date}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Sign-off */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(10, 34, 19, 0.08)',
              fontSize: '10.5px',
              color: '#52735d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} color="#1e783e" />
                <span>Zero-Hallucination: Grounded in verified source records</span>
              </div>
              <div>
                Generated at: {sitrepData?.generated_at ? new Date(sitrepData.generated_at).toLocaleString() : 'UTC'}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
