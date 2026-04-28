'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import AskKuralMobile from './AskKuralMobile';
import { useKuralSearch, PROMPTS } from './hooks/useKuralSearch';

export default function Home() {
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [isMobile, setIsMobile] = useState(false);
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
          <div className={styles.titleTamil}>திருக்குறள் உரை</div>
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

            {/* LEFT — kural */}
            <div className={styles.leftCol}>
              <div className={styles.kuralCard}>
                <div className={styles.kuralMeta}>
                  <span className={styles.kuralNum}>குறள் #{result.kural.Number}</span>
                  {/* Chapter info removed since new table doesn't have it */}
                </div>
                <p className={styles.kuralTamil}>
                  {result.kural.Line1}
                  {'\n'}
                  {result.kural.Line2}
                </p>
                <p className={styles.kuralTranslit}>
                  {result.kural.transliteration1}
                  {'\n'}
                  {result.kural.transliteration2}
                </p>
                <div className={styles.kuralEnBox}>
                  <p className={styles.kuralEn}>&ldquo;{result.kural.Translation}&rdquo;</p>
                </div>
                {/* Chapter footer removed since new table doesn't have it */}
              </div>
            </div>

            {/* RIGHT — 2×2 commentary grid */}
            <div className={styles.rightCol}>
              <div className={styles.comHeader}>
                <span className={styles.comHeaderLeft}>உரையாசிரியர்கள்</span>
                <span className={styles.comHeaderRight}>COMMENTARIES</span>
              </div>

              <div className={styles.comGrid}>

                {result.kural.mv && (
                  <div className={styles.comCard}>
                    <div className={styles.comCardHead}>
                      <span className={styles.avatar}>மு.வ</span>
                      <div className={styles.comAuthor}>
                        <div className={styles.comName}>Mu. Varadharasanar</div>
                        <div className={styles.comNameTamil}>முனைவர் மு. வரதராசனார்</div>
                      </div>
                    </div>
                    <p className={styles.comText}>{result.kural.mv}</p>
                  </div>
                )}

                {result.kural.sp && (
                  <div className={styles.comCard}>
                    <div className={styles.comCardHead}>
                      <span className={styles.avatar}>ச.பா</span>
                      <div className={styles.comAuthor}>
                        <div className={styles.comName}>Solomon Pappaiah</div>
                        <div className={styles.comNameTamil}>சாலமன் பாப்பையா</div>
                      </div>
                    </div>
                    <p className={styles.comText}>{result.kural.sp}</p>
                  </div>
                )}

                {result.kural.mk && (
                  <div className={styles.comCard}>
                    <div className={styles.comCardHead}>
                      <span className={styles.avatar}>க.க</span>
                      <div className={styles.comAuthor}>
                        <div className={styles.comName}>Kalaignar Karunanidhi</div>
                        <div className={styles.comNameTamil}>கலைஞர் கருணாநிதி</div>
                      </div>
                    </div>
                    <p className={styles.comText}>{result.kural.mk}</p>
                  </div>
                )}

                {result.kural.explanation && (
                  <div className={styles.comCard}>
                    <div className={styles.comCardHead}>
                      <span className={styles.avatarEn}>EN</span>
                      <div className={styles.comAuthor}>
                        <div className={styles.comName}>English Explanation</div>
                        <div className={styles.comNameTamil}>ஆங்கில விளக்கம்</div>
                      </div>
                    </div>
                    <p className={styles.comText}>{result.kural.explanation}</p>
                  </div>
                )}

              </div>
            </div>

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
        <p className={styles.credit}>a humble tribute to thirukkural · anbuselvan sivaraju</p>
      </div>

    </div>
  );
}
