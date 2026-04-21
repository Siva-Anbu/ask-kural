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
}

interface Message {
  type: 'user' | 'response';
  text?: string;
  kural?: Kural;
  keywords?: string[];
  error?: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    setStarted(true);
    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { type: 'response', error: data.error }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'response',
          kural: data.kural,
          keywords: data.keywords,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { type: 'response', error: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.lampIcon}>
            <svg viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="38" rx="10" ry="4" fill="rgba(212,163,80,0.12)"/>
              <path d="M24 35 C16 35 12 27 12 20 C12 12 17 8 24 8 C31 8 36 12 36 20 C36 27 32 35 24 35Z" fill="rgba(212,163,80,0.1)" stroke="rgba(212,163,80,0.6)" strokeWidth="1.5"/>
              <path d="M20 35 L21 42 L27 42 L28 35" stroke="rgba(212,163,80,0.5)" strokeWidth="1.2" fill="none"/>
              <line x1="21" y1="42" x2="27" y2="42" stroke="rgba(212,163,80,0.7)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="20" r="4" fill="rgba(212,163,80,0.7)"/>
              <line x1="24" y1="10" x2="24" y2="7" stroke="rgba(212,163,80,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>
              <span className={styles.titleTamil}>திருக்குறள் அருளுரை</span>
              <span className={styles.titleEnglish}>Ask Kural</span>
            </h1>
            <p className={styles.subtitle}>வள்ளுவரிடம் கேளுங்கள் · Ask Valluvar anything</p>
          </div>
        </header>

        {/* Messages */}
        <div className={styles.messages}>
          {!started && (
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

          {messages.map((msg, i) => (
            <div key={i} className={msg.type === 'user' ? styles.userMsg : styles.responseMsg}>
              {msg.type === 'user' ? (
                <div className={styles.userBubble}>{msg.text}</div>
              ) : msg.error ? (
                <div className={styles.errorText}>{msg.error}</div>
              ) : (
                <div className={styles.responseBubble}>

                  {/* Keywords detected */}
                  {msg.keywords && msg.keywords.length > 0 && (
                    <div className={styles.keywordRow}>
                      {msg.keywords.slice(0, 6).map((kw, ki) => (
                        <span key={ki} className={styles.keywordTag}>{kw}</span>
                      ))}
                    </div>
                  )}

                  {/* Kural card */}
                  {msg.kural && (
                    <div className={styles.kuralCard}>
                      <div className={styles.kuralMeta}>
                        குறள் #{msg.kural.number} · {msg.kural.chapter_tamil} · {msg.kural.book_tamil}
                      </div>
                      <p className={styles.kuralTamil}>
                        {msg.kural.tamil.replace(/\\n/g, '\n')}
                      </p>
                      <div className={styles.kuralDivider} />
                      <p className={styles.kuralTranslit}>
                        {msg.kural.transliteration.replace(/\\n/g, '\n')}
                      </p>
                      <p className={styles.kuralEnglish}>&ldquo;{msg.kural.english}&rdquo;</p>
                    </div>
                  )}

                  {/* Chapter context */}
                  {msg.kural && (
                    <p className={styles.chapterContext}>
                      From chapter: <em>{msg.kural.chapter_english}</em> · {msg.kural.book_english}
                    </p>
                  )}

                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className={styles.responseMsg}>
              <div className={styles.responseBubble}>
                <div className={styles.loadingDots}><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
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
