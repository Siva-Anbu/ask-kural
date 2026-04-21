'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

interface Kural {
  number: number;
  chapter_english: string;
  chapter_tamil: string;
  book_english: string;
  book_tamil: string;
  tamil: string;
  transliteration: string;
  english: string;
  themes: string[];
  mv?: string;
  sp?: string;
  mk?: string;
  couplet?: string;
  explanation?: string;
}

interface Result {
  question: string;
  kural: Kural;
  keywords: string[];
  matchReasons: string[];
}

const SUGGESTIONS = [
  { tamil: 'வாழ்க்கையில் தோல்வி', english: 'I feel like a failure' },
  { tamil: 'கோபம் அடங்கவில்லை', english: 'I cannot control my anger' },
  { tamil: 'தனிமையாக இருக்கிறேன்', english: 'I feel lonely abroad' },
  { tamil: 'செய்வதை தள்ளிப்போடுகிறேன்', english: 'I keep procrastinating' },
  { tamil: 'அப்பாவிடம் சண்டை', english: 'I fought with my father' },
  { tamil: 'வேலை கிடைக்கவில்லை', english: 'I cannot find a job' },
];

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult({ 
        question: text, 
        kural: data.kural, 
        keywords: data.keywords,
        matchReasons: data.matchReasons || []
      });
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  function handleReset() {
    setResult(null); setError(''); setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className={styles.shell}>

      {/* ── TOP BAR: title left, question bubble right ── */}
      <header className={styles.topBar}>
        <div className={styles.titleBlock}>
          <div className={styles.titleTamil}>திருக்குறள் அருளுரை</div>
          <div className={styles.titleSub}>ASK KURAL · வள்ளுவரிடம் கேளுங்கள் · ASK VALLUVAR ANYTHING</div>
        </div>

        {result && (
          <div className={styles.qBubble}>
            <div className={styles.qLabel}>YOUR QUESTION</div>
            <div className={styles.qText}>&ldquo;{result.question}&rdquo;</div>
            {result.keywords?.length > 0 && (
              <div className={styles.tags}>
                {result.keywords.slice(0,3).map((k,i) => <span key={i} className={styles.tag}>{k}</span>)}
              </div>
            )}
            {/* Match Reasons */}
            {result.matchReasons && result.matchReasons.length > 0 && (
              <div className={styles.matchReasons}>
                <div className={styles.matchLabel}>Why this Kural?</div>
                {result.matchReasons.slice(0, 3).map((reason, i) => (
                  <div key={i} className={styles.matchReason}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 11.5L4 14L5 9.5L2 6.5L6 6L8 2Z" 
                            fill="currentColor" opacity="0.6"/>
                    </svg>
                    {reason}
                  </div>
                ))}
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
              {SUGGESTIONS.map((s, i) => (
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
            <div className={styles.dots}><span/><span/><span/></div>
            <p className={styles.loadingText}>Valluvar is thinking…</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className={styles.center}>
            <p className={styles.errorText}>{error}</p>
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
                  <span className={styles.kuralNum}>குறள் #{result.kural.number}</span>
                  <span className={styles.kuralChapter}>{result.kural.chapter_tamil} · {result.kural.book_tamil}</span>
                </div>
                <p className={styles.kuralTamil}>
                  {result.kural.tamil.replace(/\\n/g,'\n')}
                </p>
                <p className={styles.kuralTranslit}>
                  {result.kural.transliteration.replace(/\\n/g,'\n')}
                </p>
                <div className={styles.kuralEnBox}>
                  <p className={styles.kuralEn}>&ldquo;{result.kural.english}&rdquo;</p>
                </div>
                <div className={styles.kuralFooter}>
                  <span>{result.kural.chapter_english.toUpperCase()}</span>
                  <span>{result.kural.book_english.toUpperCase()}</span>
                </div>
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
              <path d="M2 8a6 6 0 1 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 11V8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ask Again
          </button>
        ) : (
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.inputBox}
              placeholder="வள்ளுவரிடம் கேளுங்கள்… · Ask Valluvar anything…"
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
                <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
        <p className={styles.inputHint}>Tamil or English</p>
      </div>

    </div>
  );
}
