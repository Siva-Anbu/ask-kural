'use client';

import { useState } from 'react';

interface Kural {
  Number: number;
  Line1: string;
  Line2: string;
  Translation: string;
  transliteration1: string;
  transliteration2: string;
  mv?: string;
  sp?: string;
  mk?: string;
  couplet?: string;
  explanation?: string;
}

interface ApiResponse {
  kural: Kural;
  keywords: string[];
  source: 'direct' | 'chapter' | 'questionare' | 'keyword';
  confidence: 'high' | 'medium' | 'low';
  confidenceMessage?: string;
  matchedSituation?: string;
  similarity?: number;
  keywordCount?: number;
}

const AskKuralMobile = () => {
  const [showResult, setShowResult] = useState(false);
  const [question, setQuestion] = useState('');
  const [kural, setKural] = useState<Kural | null>(null);
  const [confidenceMessage, setConfidenceMessage] = useState<string>('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [keywordCount, setKeywordCount] = useState<number>(0);
  const [expandedCommentary, setExpandedCommentary] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const quickPrompts = [
    { tamil: 'வாழ்க்கையில் தோல்வி', english: 'I feel like a failure' },
    { tamil: 'கோபம் அடங்கவில்லை', english: 'I cannot control my anger' },
    { tamil: 'தனிமையாக இருக்கிறேன்', english: 'I feel lonely abroad' },
    { tamil: 'செய்வதை தள்ளிப்போடுகிறேன்', english: 'I keep procrastinating' },
    { tamil: 'அப்பாவிடம் சண்டை', english: 'I fought with my father' },
    { tamil: 'வேலை கிடைக்கவில்லை', english: 'I cannot find a job' },
  ];

  const handleQuickPrompt = (prompt: { tamil: string; english: string }) => {
    setQuestion(prompt.english);
    handleSearch(prompt.english);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: searchQuery }),
      });

      const data: ApiResponse = await res.json();

      if ('error' in data) {
        setError((data as any).error);
      } else {
        setKural(data.kural);
        setConfidenceMessage(data.confidenceMessage || '');
        setConfidence(data.confidence);
        setKeywordCount(data.keywordCount || 0);
        setShowResult(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCommentary = (index: number) => {
    setExpandedCommentary(expandedCommentary === index ? null : index);
  };

  const handleReset = () => {
    setShowResult(false);
    setQuestion('');
    setKural(null);
    setConfidenceMessage('');
    setConfidence('medium');
    setKeywordCount(0);
    setExpandedCommentary(null);
    setError('');
  };

  if (showResult && kural) {
    const commentaries = [
      kural.mv ? { author: 'Mu. Varadharasanar', authorTamil: 'முனைவர் மு. வரதராசனார்', text: kural.mv, avatar: 'மு.வ' } : null,
      kural.sp ? { author: 'Solomon Pappaiah', authorTamil: 'சாலமன் பாப்பையா', text: kural.sp, avatar: 'ச.பா' } : null,
      kural.mk ? { author: 'Kalaignar Karunanidhi', authorTamil: 'கலைஞர் கருணாநிதி', text: kural.mk, avatar: 'க.க' } : null,
      kural.explanation ? { author: 'English Explanation', authorTamil: 'விளக்கம்', text: kural.explanation, avatar: 'EN' } : null,
    ].filter(Boolean) as { author: string; authorTamil: string; text: string; avatar: string }[];

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.resultHeader}>
          <h1 style={styles.titleSimple}>Ask Kural</h1>
          <div style={styles.questionBubble}>
            <span style={styles.questionLabel}>YOUR QUESTION</span>
            <p style={styles.questionText}>{question}</p>
          </div>
        </div>

        {/* Confidence Message with Keyword Match Indicator */}
        {confidenceMessage && (
          <div style={{
            ...styles.confidenceMessage,
            ...(confidence === 'high' ? styles.confidenceHigh :
              confidence === 'medium' ? styles.confidenceMedium :
                styles.confidenceLow)
          }}>
            <div style={styles.confidenceIconWrapper}>
              {confidence === 'high' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : confidence === 'medium' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div style={styles.confidenceTextWrapper}>
              <span style={styles.confidenceMainText}>{confidenceMessage}</span>
              {keywordCount > 0 && (
                <span style={styles.keywordMatchIndicator}>
                  {keywordCount} keyword{keywordCount > 1 ? 's' : ''} matched
                </span>
              )}
            </div>
          </div>
        )}

        {/* Kural Card */}
        <div style={styles.kuralCard}>
          <div style={styles.kuralNumber}>Kural #{kural.Number}</div>

          <div style={styles.kuralTamil}>
            {kural.Line1}
            {'\n'}
            {kural.Line2}
          </div>

          <div style={styles.kuralTranslit}>
            {kural.transliteration1}
            {'\n'}
            {kural.transliteration2}
          </div>

          <div style={styles.kuralEnglish}>
            &ldquo;{kural.Translation}&rdquo;
          </div>
        </div>

        {/* Commentaries */}
        <div style={styles.commentaries}>
          {commentaries.map((commentary, index) => (
            <div
              key={index}
              style={{
                ...styles.commentaryItem,
                ...(expandedCommentary === index ? styles.commentaryItemExpanded : {})
              }}
              onClick={() => toggleCommentary(index)}
            >
              <div style={styles.commentaryHeader}>
                <span style={styles.commentaryAuthor}>{commentary.author}</span>
                <svg
                  style={{
                    ...styles.chevron,
                    transform: expandedCommentary === index ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {expandedCommentary === index && (
                <div style={styles.commentaryContent}>
                  {commentary.text}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ask Again Button */}
        <button
          style={styles.askAgainBtn}
          onClick={handleReset}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25 4 6.82 5.38 5.38 7.5M5.38 7.5V4M5.38 7.5H8.88"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Ask Valluvar Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Tamil Typography */}
      <div style={styles.header}>
        <h1 style={styles.titleTamil}>திருக்குறள் அருளுரை</h1>
        <h2 style={styles.titleEnglish}>ASK KURAL</h2>
      </div>

      {/* Inspirational Quote */}
      {!isLoading && !error && (
        <div style={styles.quoteSection}>
          <p style={styles.quoteTamil}>"எண்ணிய எண்ணியாங்கு எய்துப"</p>
          <p style={styles.quoteEnglish}>What you seek with clear intent, you shall find.</p>
        </div>
      )}

      {/* Quick Prompts Grid */}
      {!isLoading && !error && (
        <div style={styles.promptsGrid}>
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              style={styles.promptCard}
              onClick={() => handleQuickPrompt(prompt)}
            >
              <div style={styles.promptTamil}>{prompt.tamil}</div>
              <div style={styles.promptEnglish}>{prompt.english}</div>
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Searching the palm-leaf manuscript...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.center}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.askAgainBtn} onClick={handleReset}>Try Again</button>
        </div>
      )}

      {/* Search Input */}
      {!isLoading && (
        <div style={styles.searchContainer}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Ask Valluvar anything..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && question.trim()) {
                handleSearch(question);
              }
            }}
          />
          <button
            style={{
              ...styles.searchBtn,
              ...((!question.trim() || isLoading) ? styles.searchBtnDisabled : {})
            }}
            onClick={() => question.trim() && handleSearch(question)}
            disabled={!question.trim() || isLoading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1410 100%)',
    padding: '32px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  titleTamil: {
    fontFamily: '"Noto Sans Tamil", "Mukta Malar", sans-serif',
    fontSize: '32px',
    fontWeight: 500,
    color: '#d4af7a',
    margin: '0 0 8px 0',
    letterSpacing: '1px',
    textShadow: '0 2px 8px rgba(212, 175, 122, 0.3)',
  },
  titleEnglish: {
    fontSize: '16px',
    fontWeight: 300,
    color: '#d4af7a',
    letterSpacing: '4px',
    margin: 0,
    opacity: 0.8,
  },
  quoteSection: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '0 20px',
  },
  quoteTamil: {
    fontFamily: '"Noto Sans Tamil", "Mukta Malar", sans-serif',
    fontSize: '20px',
    fontWeight: 400,
    color: '#f5e6d3',
    margin: '0 0 8px 0',
    letterSpacing: '0.5px',
    lineHeight: 1.6,
  },
  quoteEnglish: {
    fontSize: '14px',
    fontWeight: 300,
    color: '#c4c4c4',
    margin: 0,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  promptsGrid: {
    display: 'flex',
    overflowX: 'auto',
    gap: '12px',
    marginBottom: '32px',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  promptCard: {
    background: 'rgba(25, 25, 25, 0.6)',
    border: '1px solid rgba(212, 175, 122, 0.15)',
    borderRadius: '16px',
    padding: '20px 16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    minWidth: '200px',
    flexShrink: 0,
  },
  promptTamil: {
    fontFamily: '"Noto Sans Tamil", "Mukta Malar", sans-serif',
    fontSize: '15px',
    color: '#e8e8e8',
    marginBottom: '6px',
    lineHeight: 1.4,
  },
  promptEnglish: {
    fontSize: '13px',
    color: '#d4af7a',
    fontWeight: 300,
    opacity: 0.9,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(20, 20, 20, 0.6)',
    border: '1.5px solid rgba(212, 175, 122, 0.2)',
    borderRadius: '16px',
    padding: '18px 60px 18px 20px',
    fontSize: '15px',
    color: '#e8e8e8',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  searchBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, #d4af7a, #c99d64)',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#1a1410',
  },
  searchBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  resultHeader: {
    marginBottom: '24px',
  },
  titleSimple: {
    color: '#d4af7a',
    fontSize: '28px',
    fontWeight: 300,
    margin: '0 0 16px 0',
    letterSpacing: '0.5px',
  },
  questionBubble: {
    background: 'rgba(212, 175, 122, 0.08)',
    border: '1px solid rgba(212, 175, 122, 0.2)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '8px',
  },
  questionLabel: {
    color: '#d4af7a',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: 500,
    display: 'block',
    marginBottom: '8px',
  },
  questionText: {
    color: '#e8e8e8',
    fontSize: '15px',
    margin: 0,
    lineHeight: 1.5,
  },
  // Enhanced confidence message with icon and keyword indicator
  confidenceMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 18px',
    borderRadius: '14px',
    marginBottom: '16px',
    lineHeight: 1.5,
    transition: 'all 0.3s ease',
  },
  confidenceIconWrapper: {
    marginTop: '2px',
  },
  confidenceTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  confidenceMainText: {
    fontSize: '14px',
    fontWeight: 400,
  },
  keywordMatchIndicator: {
    fontSize: '12px',
    opacity: 0.7,
    fontWeight: 300,
  },
  confidenceHigh: {
    background: 'rgba(100, 200, 100, 0.12)',
    border: '1px solid rgba(100, 200, 100, 0.3)',
    color: '#a8e6a8',
  },
  confidenceMedium: {
    background: 'rgba(212, 175, 122, 0.12)',
    border: '1px solid rgba(212, 175, 122, 0.3)',
    color: '#d4af7a',
  },
  confidenceLow: {
    background: 'rgba(212, 175, 122, 0.08)',
    border: '1px solid rgba(212, 175, 122, 0.2)',
    color: '#c4c4c4',
  },
  kuralCard: {
    background: 'rgba(20, 20, 20, 0.6)',
    border: '1.5px solid rgba(212, 175, 122, 0.3)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  kuralNumber: {
    color: '#d4af7a',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(212, 175, 122, 0.15)',
    letterSpacing: '0.5px',
  },
  kuralTamil: {
    fontFamily: '"Noto Sans Tamil", "Mukta Malar", sans-serif',
    fontSize: '22px',
    lineHeight: 1.7,
    color: '#f5e6d3',
    marginBottom: '16px',
    fontWeight: 400,
    letterSpacing: '0.3px',
    whiteSpace: 'pre-line',
  },
  kuralTranslit: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#c4c4c4',
    marginBottom: '16px',
    fontWeight: 300,
    fontStyle: 'italic',
    opacity: 0.8,
    whiteSpace: 'pre-line',
  },
  kuralEnglish: {
    color: '#c4c4c4',
    fontSize: '15px',
    lineHeight: 1.7,
    fontWeight: 300,
    paddingTop: '16px',
    borderTop: '1px solid rgba(212, 175, 122, 0.15)',
  },
  commentaries: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  commentaryItem: {
    background: 'rgba(20, 20, 20, 0.5)',
    border: '1px solid rgba(212, 175, 122, 0.2)',
    borderRadius: '14px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  commentaryItemExpanded: {
    borderColor: 'rgba(212, 175, 122, 0.4)',
    background: 'rgba(20, 20, 20, 0.7)',
  },
  commentaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
  },
  commentaryAuthor: {
    color: '#e8e8e8',
    fontSize: '15px',
    fontWeight: 400,
  },
  chevron: {
    color: '#d4af7a',
    transition: 'transform 0.3s ease',
  },
  commentaryContent: {
    padding: '0 20px 20px 20px',
    color: '#c4c4c4',
    fontFamily: '"Noto Sans Tamil", "Mukta Malar", sans-serif',
    fontSize: '14px',
    lineHeight: 1.8,
  },
  askAgainBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(212, 175, 122, 0.15), rgba(212, 175, 122, 0.08))',
    border: '1.5px solid rgba(212, 175, 122, 0.3)',
    borderRadius: '16px',
    padding: '18px',
    color: '#d4af7a',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(212, 175, 122, 0.2)',
    borderTopColor: '#d4af7a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#c4c4c4',
    fontSize: '15px',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '15px',
    textAlign: 'center',
  },
};

export default AskKuralMobile;