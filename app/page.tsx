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
      else setResult({ question: text, kural: data.kural, keywords: data.keywords });
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  }

  function handleReset() {
    setResult(null); setError(''); setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className={styles.shell}>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleTamil}>திருக்குறள் அருளுரை</div>
        <div className={styles.titleSub}>ASK KURAL · வள்ளுவரிடம் கேளுங்கள் · Ask Valluvar anything</div>
      </header>

      {/* BODY */}
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
            <button className={styles.ghostBtn} onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* RESULT: left = kural, right = 2×2 commentary grid */}
        {result && !loading && (
          <div className={styles.resultGrid}>

            {/* LEFT */}
            <div className={styles.leftCol}>
              <div className={styles.qBubble}>
                <span className={styles.qText}>&ldquo;{result.question}&rdquo;</span>
                {result.keywords?.length > 0 && (
                  <div className={styles.tags}>
                    {result.keywords.slice(0,4).map((k,i) => <span key={i} className={styles.tag}>{k}</span>)}
                  </div>
                )}
              </div>

              <div className={styles.kuralCard}>
                <div className={styles.kuralMeta}>
                  குறள் #{result.kural.number} · {result.kural.chapter_tamil} · {result.kural.book_tamil}
                </div>
                <p className={styles.kuralTamil}>
                  {result.kural.tamil.replace(/\\n/g,'\n')}
                </p>
                <hr className={styles.divider}/>
                <p className={styles.kuralTranslit}>
                  {result.kural.transliteration.replace(/\\n/g,'\n')}
                </p>
                <p className={styles.kuralEn}>&ldquo;{result.kural.english}&rdquo;</p>
                <p className={styles.chapter}>{result.kural.chapter_english} · {result.kural.book_english}</p>
              </div>

              <button className={styles.ghostBtn} onClick={handleReset}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 1 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 11V8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ask Again
              </button>
            </div>

            {/* RIGHT: commentary 2×2 grid */}
            <div className={styles.rightCol}>
              <div className={styles.comLabel}>
                உரையாசிரியர்கள் · <span>COMMENTARIES</span>
              </div>
              <div className={styles.comGrid}>

                {result.kural.mv && (
                  <div className={styles.comCard}>
                    <div className={styles.comCardHead}>
                      <span className={styles.avatar}>மு.வ</span>
                      <div>
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
                      <div>
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
                      <div>
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
                      <span className={styles.avatar}>EN</span>
                      <div>
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

      {/* INPUT BAR */}
      <div className={styles.inputBar}>
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
        <p className={styles.inputHint}>Tamil அல்லது English-ல் தட்டச்சு செய்யுங்கள்</p>
      </div>

    </div>
  );
}
