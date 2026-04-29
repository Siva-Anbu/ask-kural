'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import { useKuralSearch, PROMPTS } from './hooks/useKuralSearch';
import KuralResult from './components/KuralResult';
import FeedbackModal from './components/FeedbackModal';

export default function AskKuralMobile() {
  const [question, setQuestion] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const { result, error, loading, search, reset } = useKuralSearch();

  const handleSearch = (searchQuery: string) => search(searchQuery);

  const handleQuickPrompt = (prompt: string) => {
    setQuestion(prompt);
    search(prompt);
  };

  const handleReset = () => {
    setQuestion('');
    reset();
  };


  return (
    <>
      {/* 🔒 LOCK VIEWPORT ZOOM */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div style={{ minHeight: '100dvh', background: 'linear-gradient(to bottom, #0a0a0a, #1a1410)', color: '#e5e7eb', fontFamily: '"Noto Sans Tamil", "Noto Sans", sans-serif', padding: '20px', paddingBottom: '100px', overflowX: 'hidden', WebkitTextSizeAdjust: '100%', touchAction: 'manipulation', position: 'relative' }}>
        {/* Valluvar background watermark */}
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '360px', height: '480px', backgroundImage: "url('/valluvar.jpg')", backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center top', opacity: 0.11, pointerEvents: 'none', zIndex: 0, maskImage: 'radial-gradient(ellipse 55% 60% at center, black 20%, rgba(0,0,0,0.6) 45%, transparent 72%)', WebkitMaskImage: 'radial-gradient(ellipse 55% 60% at center, black 20%, rgba(0,0,0,0.6) 45%, transparent 72%)' }} />
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 onClick={handleReset} style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 'bold', background: 'linear-gradient(to right, #d4af7a, #f4e4c1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px', cursor: 'pointer' }}>
            திருக்குறள் உரை
          </h1>
          <p style={{ fontSize: 'clamp(12px, 2.5vw, 16px)', color: '#9ca3af' }}>
            ASK KURAL · குறளிடம் கேளுங்கள்
          </p>
        </div>

        {!result && !error && !loading && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', maxWidth: '900px', margin: '0 auto' }}>
              {PROMPTS.map((prompt, idx) => (
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
            <p style={{ color: '#9ca3af' }}>பனை ஓலையில் தேடுகிறேன்...</p>
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
            {/* 3 kurals with tabs + save */}
            <KuralResult kurals={result.kurals} isMobile={true} />

            <button onClick={handleReset} style={{ width: '100%', maxWidth: '400px', display: 'block', margin: '20px auto 0', background: 'rgba(212,175,122,0.2)', border: '2px solid rgba(212,175,122,0.5)', borderRadius: '12px', padding: '14px', color: '#d4af7a', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              🔄 Ask Kural Again
            </button>
          </div>
        )}

        {/* 🔒 FIXED BOTTOM BAR */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10, 10, 10, 0.95)', borderTop: '1px solid rgba(212, 175, 122, 0.2)', padding: '16px 20px', backdropFilter: 'blur(10px)', zIndex: 50 }}>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '1200px', margin: '0 auto' }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(question); }}
              placeholder="Ask Kural anything..."
              style={{
                flex: 1,
                background: 'rgba(30, 30, 30, 0.8)',
                border: '1px solid rgba(212, 175, 122, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#e5e7eb',
                fontSize: '16px', // ✅ FIXED: Prevents iOS auto-zoom
                outline: 'none',
                WebkitTextSizeAdjust: '100%',
                touchAction: 'manipulation'
              }}
            />
            <button
              onClick={() => handleSearch(question)}
              disabled={loading || !question.trim()}
              style={{
                background: loading || !question.trim() ? 'rgba(212, 175, 122, 0.2)' : 'linear-gradient(135deg, #d4af7a, #c4975a)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                color: loading || !question.trim() ? '#6b7280' : '#0a0a0a',
                fontWeight: '600',
                cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                fontSize: '24px'
              }}
            >
              🔍
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#4b5563', marginTop: '40px', letterSpacing: '0.5px' }}>
          a small tribute to kural · குறளுக்கு ஒரு சிறு காணிக்கை<br />ANBUSELVAN SIVARAJU
        </p>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={() => setShowFeedback(true)}
            style={{ background: 'none', border: 'none', fontSize: '11px', color: 'rgba(212,175,122,.35)', letterSpacing: '.06em', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', fontStyle: 'italic' }}
          >
            Share Feedback
          </button>
        </div>
        {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}