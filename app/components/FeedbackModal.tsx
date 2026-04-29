'use client';

import { useState } from 'react';

interface Props { onClose: () => void; }

export default function FeedbackModal({ onClose }: Props) {
  const [name, setName]       = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    /* ── OVERLAY ── */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* ── PANEL ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg,#0f0e0b,#1a1410)',
          border: '1px solid rgba(212,175,122,.25)',
          borderRadius: '18px',
          padding: '32px',
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          fontFamily: '"Noto Sans Tamil","Noto Sans",Georgia,serif',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#d4af7a' }}>Share Your Thoughts</div>
            <div style={{ fontSize: '11px', color: 'rgba(212,175,122,.45)', letterSpacing: '.08em', marginTop: '4px' }}>
              உங்கள் கருத்தை பகிருங்கள்
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 12px' }}
          >
            ✕
          </button>
        </div>

        {status === 'done' ? (
          /* ── SUCCESS ── */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🙏</div>
            <div style={{ color: '#d4af7a', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>நன்றி · Thank you!</div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>Your feedback has been received.</div>
            <button
              onClick={onClose}
              style={{ marginTop: '20px', background: 'rgba(212,175,122,.15)', border: '1px solid rgba(212,175,122,.3)', borderRadius: '20px', padding: '8px 24px', color: '#d4af7a', cursor: 'pointer', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(212,175,122,.55)', letterSpacing: '.06em' }}>YOUR NAME (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Anonymous"
                style={{
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(212,175,122,.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* message */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'rgba(212,175,122,.55)', letterSpacing: '.06em' }}>YOUR FEEDBACK</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What did you like? What could be better?"
                rows={4}
                style={{
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(212,175,122,.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                }}
              />
            </div>

            {status === 'error' && (
              <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center' }}>
                Something went wrong. Please try again.
              </div>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || status === 'sending'}
              style={{
                background: !message.trim() || status === 'sending'
                  ? 'rgba(212,175,122,.1)'
                  : 'linear-gradient(135deg,#d4af7a,#c4975a)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                color: !message.trim() || status === 'sending' ? '#6b7280' : '#0a0a0a',
                fontWeight: 700,
                fontSize: '14px',
                cursor: !message.trim() || status === 'sending' ? 'not-allowed' : 'pointer',
                transition: 'all .2s',
                fontFamily: 'inherit',
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send Feedback'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
