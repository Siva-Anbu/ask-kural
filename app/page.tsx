'use client';

import { useState, useRef, useEffect } from 'react';
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
  line1?: string;
  line2?: string;
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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult({ question: text, kural: data.kural, keywords: data.keywords });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  function handleReset() {
    setResult(null);
    setError('');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>

          <div className={styles.headerText}>
            <h1 className={styles.title}>
              <span className={styles.titleTamil}>திருக்குறள் அருளுரை</span>
              <span className={styles.titleEnglish}>Ask Kural</span>
            </h1>
            <p className={styles.subtitle}>வள்ளுவரிடம் கேளுங்கள் · Ask Valluvar anything</p>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>

          {/* Welcome — only shown before any question */}
          {!result && !loading && (
            <div className={styles.welcome}>
              <p className={styles.welcomeQuote}>&ldquo;எண்ணிய எண்ணியாங்கு எய்துப&rdquo;</p>
              <p className={styles.welcomeQuoteEn}>What you seek with clear intent, you shall find.</p>
              <p className={styles.welcomeInstruction}>
                உங்கள் மனதில் என்ன இருக்கிறது?<br />
                <span>What weighs on your heart today?</span>
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.suggestionBtn} onClick={() => handleSend(s.english)}>
                    <span className={styles.suggTamil}>{s.tamil}</span>
                    <span className={styles.suggEnglish}>{s.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.loadingWrap}>
              <div className={styles.loadingDots}><span /><span /><span /></div>
              <p className={styles.loadingText}>Valluvar is thinking...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className={styles.errorWrap}>
              <p className={styles.errorText}>{error}</p>
              <button className={styles.resetBtn} onClick={handleReset}>Try Again</button>
            </div>
          )}

          {/* Result — one clean answer */}
          {result && !loading && (
            <div className={styles.resultWrap} ref={resultRef}>

              {/* Question shown at top */}
              <div className={styles.questionBubble}>
                <p className={styles.questionText}>&ldquo;{result.question}&rdquo;</p>
              </div>

              {/* Keywords detected */}
              {result.keywords && result.keywords.length > 0 && (
                <div className={styles.keywordRow}>
                  {result.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className={styles.keywordTag}>{kw}</span>
                  ))}
                </div>
              )}

              {/* Kural card */}
              <div className={styles.kuralCard}>
                <div className={styles.kuralMeta}>
                  குறள் #{result.kural.number} · {result.kural.chapter_tamil} · {result.kural.book_tamil}
                </div>
                <p className={styles.kuralTamil}>
                  {result.kural.tamil.replace(/\\n/g, '\n')}
                </p>
                <div className={styles.kuralDivider} />
                <p className={styles.kuralTranslit}>
                  {result.kural.transliteration.replace(/\\n/g, '\n')}
                </p>
                <p className={styles.kuralEnglish}>&ldquo;{result.kural.english}&rdquo;</p>
              </div>

              {/* Chapter context */}
              <p className={styles.chapterContext}>
                From chapter: <em>{result.kural.chapter_english}</em> · {result.kural.book_english}
              </p>

              {/* Commentaries — horizontal card array */}
              {(result.kural.mv || result.kural.sp || result.kural.mk || result.kural.explanation) && (
                <div className={styles.commentaries}>
                  <h3 className={styles.commentaryHeading}>உரையாசிரியர்கள் · Commentaries</h3>
                  <div className={styles.commentaryGrid}>

                    {result.kural.mv && (
                      <div className={styles.commentaryCard}>
                        <div className={styles.commentaryCardHeader}>
                          <span className={styles.commentaryInitial}>மு.வ</span>
                          <span className={styles.commentaryName}>Mu. Varadharasanar</span>
                        </div>
                        <p className={styles.commentaryText}>{result.kural.mv}</p>
                      </div>
                    )}

                    {result.kural.sp && (
                      <div className={styles.commentaryCard}>
                        <div className={styles.commentaryCardHeader}>
                          <span className={styles.commentaryInitial}>ச.பா</span>
                          <span className={styles.commentaryName}>Solomon Pappaiah</span>
                        </div>
                        <p className={styles.commentaryText}>{result.kural.sp}</p>
                      </div>
                    )}

                    {result.kural.mk && (
                      <div className={styles.commentaryCard}>
                        <div className={styles.commentaryCardHeader}>
                          <span className={styles.commentaryInitial}>க.க</span>
                          <span className={styles.commentaryName}>Kalaignar Karunanidhi</span>
                        </div>
                        <p className={styles.commentaryText}>{result.kural.mk}</p>
                      </div>
                    )}

                    {result.kural.explanation && (
                      <div className={styles.commentaryCard}>
                        <div className={styles.commentaryCardHeader}>
                          <span className={styles.commentaryInitial}>EN</span>
                          <span className={styles.commentaryName}>English Explanation</span>
                        </div>
                        <p className={styles.commentaryText}>{result.kural.explanation}</p>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Ask Another button */}
              <button className={styles.askAnotherBtn} onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 1 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 11V8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ask Valluvar Again
              </button>

            </div>
          )}

        </div>

        {/* Input — always visible at bottom */}
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.inputBox}
              placeholder="வள்ளுவரிடம் கேளுங்கள்... · Ask Valluvar anything..."
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <button
              className={styles.sendBtn}
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>Tamil அல்லது English-ல் தட்டச்சு செய்யுங்கள் · Type in Tamil or English</p>
        </div>

      </div>
    </main>
  );
}
