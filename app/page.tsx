'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import AskKuralMobile from './AskKuralMobile';
import { useKuralSearch, PROMPTS } from './hooks/useKuralSearch';
import KuralResult from './components/KuralResult';
import FeedbackModal from './components/FeedbackModal';

export default function Home() {
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { result, error, loading, search, reset } = useKuralSearch();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    setQuestion(text);
    search(text);
  }

  function handleReset() {
    reset();
    setQuestion('');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Mobile view
  if (isMobile) {
    return <AskKuralMobile />;
  }

  // Desktop view (your existing layout)
  return (
    <div className={styles.shell}>

      {/* ── TOP BAR: title left, question bubble right ── */}
      <header className={styles.topBar}>
        <div className={styles.titleBlock}>
          <div className={styles.titleTamil} onClick={handleReset} style={{ cursor: 'pointer' }}>திருக்குறள் உரை</div>
          <div className={styles.titleSub}>ASK KURAL · குறளிடம் கேளுங்கள்</div>
        </div>

        {result && (
          <div className={styles.qBubble}>
            <div className={styles.qLabel}>YOUR QUESTION</div>
            <div className={styles.qText}>&ldquo;{question}&rdquo;</div>
            {result.keywords?.length > 0 && (
              <div className={styles.tags}>
                {result.keywords.slice(0, 3).map((k, i) => <span key={i} className={styles.tag}>{k}</span>)}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── BODY ── */}
      <div className={styles.body}>

        {/* WELCOME */}
        {!result && !loading && !error && (
          <div className={styles.welcome}>
            <p className={styles.welcomeQuote}>&ldquo;எண்ணிய எண்ணியாங்கு எய்துப&rdquo;</p>
            <p className={styles.welcomeSub}>What you seek with clear intent, you shall find.</p>
            <div className={styles.chips}>
              {PROMPTS.map((s, i) => (
                <button key={i} className={styles.chip} onClick={() => handleSend(s.english)}>
                  <span className={styles.chipTamil}>{s.tamil}</span>
                  <span className={styles.chipEn}>{s.english}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className={styles.center}>
            <div className={styles.dots}><span /><span /><span /></div>
            <p className={styles.loadingText}>Searching the palm-leaf manuscript.…</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className={styles.center}>
            <p className={styles.errorText}>{error.error}</p>
            <button className={styles.askAgainBtn} onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* RESULT */}
        {result && !loading && (
          <div className={styles.resultGrid}>
            <KuralResult kurals={result.kurals} isMobile={false} />
          </div>
        )}
      </div>

      {/* ── BOTTOM: ask again + input ── */}
      <div className={styles.bottomBar}>
        {result ? (
          <button className={styles.askAgainBtn} onClick={handleReset}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 8a6 6 0 1 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2 11V8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ask Again
          </button>
        ) : (
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.inputBox}
              placeholder="குறளிடம் கேளுங்கள்… · Ask Kural anything…"
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
              }}
            />
            <button className={styles.sendBtn} onClick={() => handleSend(input)}
              disabled={loading || !input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        <p className={styles.inputHint}>Tamil அல்லது English-ல் தட்டச்சு செய்யுங்கள்</p>
        <p className={styles.credit}>a small tribute to kural · குறளுக்கு ஒரு சிறு காணிக்கை<br />ANBUSELVAN SIVARAJU</p>
        <button onClick={() => setShowFeedback(true)} className={styles.feedbackLink}>
          Share Feedback
        </button>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
