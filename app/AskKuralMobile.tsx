'use client';

import React, { useState } from 'react';

interface Kural {
  Number: number;
  Line1: string;
  Line2: string;
  Translation: string;
  transliteration1: string;
  transliteration2: string;
  mv: string;
  sp: string;
  mk: string;
  couplet: string;
  explanation: string;
}

interface SearchResponse {
  kural: Kural;
  keywords: string[];
  source: 'direct' | 'chapter' | 'questionare' | 'keyword' | 'theme-fallback';
  matchedSituation?: string;
  similarity?: number;
  confidence?: 'high' | 'medium' | 'low';
  confidenceMessage?: string;
  keywordCount?: number;
  detectedThemes?: string[];
}

interface ErrorResponse {
  error: string;
  suggestions?: string[];
}

const QUICK_PROMPTS = [
  { tamil: 'காதலில் தோல்வி', english: 'I failed in love' },
  { tamil: 'வேலை இழந்தேன்', english: 'I lost my job' },
  { tamil: 'தனிமையாக உணர்கிறேன்', english: 'I feel lonely' },
  { tamil: 'கோபம் கட்டுப்படுத்த', english: 'How to control anger' },
  { tamil: 'குடும்ப பிரச்சனை', english: 'Family problems' },
  { tamil: 'வாழ்வின் நோக்கம்', english: 'Purpose of life' },
];

export default function AskKuralMobile() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError({ error: 'Please enter a question' });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data as ErrorResponse);
        return;
      }

      setResult(data as SearchResponse);
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'An error occurred',
        suggestions: ['Try: "show me kural 1"', 'Try: "advice for sadness"']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setQuestion(prompt);
    handleSearch(prompt);
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
    setError(null);
  };

  const formatThemeName = (theme: string): string => {
    return theme.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { text: string; emoji: string; color: string }> = {
      direct: { text: 'Direct Kural', emoji: '🎯', color: 'rgba(168, 85, 247, 0.2)' },
      chapter: { text: 'Chapter Query', emoji: '📖', color: 'rgba(99, 102, 241, 0.2)' },
      questionare: { text: 'Life Situation', emoji: '💭', color: 'rgba(244, 114, 182, 0.2)' },
      keyword: { text: 'Keyword Match', emoji: '🔍', color: 'rgba(34, 211, 238, 0.2)' },
      'theme-fallback': { text: 'Theme Suggestion', emoji: '✨', color: 'rgba(139, 92, 246, 0.2)' },
    };
    return badges[source] || badges.keyword;
  };

  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    const badges = {
      high: { text: 'High Match', color: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)' },
      medium: { text: 'Good Match', color: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)' },
      low: { text: 'Possible Match', color: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)' },
    };
    return confidence ? badges[confidence] : null;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0a0a0a, #1a1410)', color: '#e5e7eb', fontFamily: '"Noto Sans Tamil", "Noto Sans", sans-serif', padding: '20px', paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 'bold', background: 'linear-gradient(to right, #d4af7a, #f4e4c1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          திருக்குறள் அறுளரை
        </h1>
        <p style={{ fontSize: 'clamp(12px, 2.5vw, 16px)', color: '#9ca3af' }}>
          ASK KURAL · வள்ளுவரிடம் கேட்டுங்கள் · ASK VALLUVAR ANYTHING
        </p>
      </div>

      {!result && !error && !loading && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', maxWidth: '900px', margin: '0 auto' }}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button key={idx} onClick={() => handleQuickPrompt(prompt.english)} style={{ background: 'rgba(212, 175, 122, 0.1)', border: '1px solid rgba(212, 175, 122, 0.3)', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 122, 0.2)'; e.currentTarget.style.borderColor = 'rgba(212, 175, 122, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 122, 0.1)'; e.currentTarget.style.borderColor = 'rgba(212, 175, 122, 0.3)'; }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#d4af7a', marginBottom: '4px' }}>{prompt.tamil}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{prompt.english}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(212, 175, 122, 0.2)', borderTop: '4px solid #d4af7a', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#9ca3af' }}>வள்ளுவர் சிந்திக்கிறார்...</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', color: '#ef4444', maxWidth: '900px', margin: '0 auto 20px' }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: '500' }}>{error.error}</p>
          {error.suggestions && error.suggestions.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', color: '#fca5a5', marginBottom: '8px' }}>Try these:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {error.suggestions.map((suggestion, idx) => (
                  <button key={idx} onClick={() => handleSearch(suggestion.replace('Try: ', '').replace(/['"]/g, ''))} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', color: '#fca5a5', cursor: 'pointer' }}>
                    {suggestion.replace('Try: ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {(() => {
              const sourceBadge = getSourceBadge(result.source);
              return (<span style={{ background: sourceBadge.color, color: '#d4af7a', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(212, 175, 122, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span>{sourceBadge.emoji}</span>{sourceBadge.text}</span>);
            })()}
            {result.confidence && (() => {
              const confBadge = getConfidenceBadge(result.confidence);
              return confBadge ? (<span style={{ background: confBadge.color, color: '#d4af7a', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: `1px solid ${confBadge.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span>✨</span>{confBadge.text}</span>) : null;
            })()}
          </div>

          {result.confidenceMessage && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#d4af7a', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>{result.confidenceMessage}</p>
            </div>
          )}

          {result.source === 'questionare' && result.matchedSituation && (
            <div style={{ background: 'rgba(244, 114, 182, 0.1)', border: '1px solid rgba(244, 114, 182, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>💭</span>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Matched Situation</p>
              </div>
              <p style={{ color: '#e5e7eb', fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px 0' }}>{result.matchedSituation}</p>
              {result.similarity !== undefined && <p style={{ color: '#f472b6', fontSize: '12px', margin: 0 }}>Similarity: {result.similarity.toFixed(0)}%</p>}
            </div>
          )}

          {result.detectedThemes && result.detectedThemes.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {result.detectedThemes.map((theme, idx) => (
                <span key={idx} style={{ background: 'rgba(212, 175, 122, 0.15)', color: '#d4af7a', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', border: '1px solid rgba(212, 175, 122, 0.3)' }}>{formatThemeName(theme)}</span>
              ))}
            </div>
          )}

          {result.source === 'keyword' && result.keywordCount !== undefined && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{result.keywordCount} keyword{result.keywordCount !== 1 ? 's' : ''} matched</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(212, 175, 122, 0.05)', border: '2px solid rgba(212, 175, 122, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(212, 175, 122, 0.2)', color: '#d4af7a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>குறள் #{result.kural.Number}</div>
              <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', lineHeight: '1.8', marginBottom: '8px', color: '#f9fafb' }}>{result.kural.Line1}</div>
              <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', lineHeight: '1.8', marginBottom: '16px', color: '#f9fafb' }}>{result.kural.Line2}</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px', fontStyle: 'italic' }}>{result.kural.transliteration1}</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px', fontStyle: 'italic' }}>{result.kural.transliteration2}</div>
              <div style={{ fontSize: '15px', color: '#d4af7a', fontStyle: 'italic', borderLeft: '3px solid rgba(212, 175, 122, 0.5)', paddingLeft: '12px' }}>"{result.kural.Translation}"</div>
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#d4af7a', marginBottom: '16px', textAlign: 'center' }}>உரைகாரர்கள் · COMMENTARIES</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(30, 30, 30, 0.5)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'rgba(212, 175, 122, 0.2)', color: '#d4af7a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>மு.வ</div>
                    <div><div style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb' }}>Mu. Varadharasanar</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>முனைவர் மு.வரதராசனார்</div></div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{result.kural.mv}</p>
                </div>
                <div style={{ background: 'rgba(30, 30, 30, 0.5)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'rgba(212, 175, 122, 0.2)', color: '#d4af7a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>சொ.பா</div>
                    <div><div style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb' }}>Solomon Pappaiah</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>சாலமன் பாப்பையா</div></div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{result.kural.sp}</p>
                </div>
                <div style={{ background: 'rgba(30, 30, 30, 0.5)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'rgba(212, 175, 122, 0.2)', color: '#d4af7a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>க.கா</div>
                    <div><div style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb' }}>Kalaignar Karunanidhi</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>கலைஞர் கருணாநிதி</div></div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{result.kural.mk}</p>
                </div>
                <div style={{ background: 'rgba(30, 30, 30, 0.5)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: 'rgba(212, 175, 122, 0.2)', color: '#d4af7a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>EN</div>
                    <div><div style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb' }}>English Explanation</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>ஆங்கில விளக்கம்</div></div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{result.kural.explanation}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleReset} style={{ width: '100%', maxWidth: '400px', display: 'block', margin: '0 auto', background: 'rgba(212, 175, 122, 0.2)', border: '2px solid rgba(212, 175, 122, 0.5)', borderRadius: '12px', padding: '14px', color: '#d4af7a', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 122, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 122, 0.2)'; }}>🔄 Ask Valluvar Again</button>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10, 10, 10, 0.95)', borderTop: '1px solid rgba(212, 175, 122, 0.2)', padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '1200px', margin: '0 auto' }}>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(question); }} placeholder="Ask Valluvar anything..." style={{ flex: 1, background: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(212, 175, 122, 0.3)', borderRadius: '12px', padding: '12px 16px', color: '#e5e7eb', fontSize: '14px', outline: 'none' }} />
          <button onClick={() => handleSearch(question)} disabled={loading || !question.trim()} style={{ background: loading || !question.trim() ? 'rgba(212, 175, 122, 0.2)' : 'linear-gradient(135deg, #d4af7a, #c4975a)', border: 'none', borderRadius: '12px', padding: '12px 20px', color: loading || !question.trim() ? '#6b7280' : '#0a0a0a', fontWeight: '600', cursor: loading || !question.trim() ? 'not-allowed' : 'pointer', fontSize: '24px' }}>🔍</button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}