'use client';

import React, { useState, useRef } from 'react';
import { Kural } from '../hooks/useKuralSearch';

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

interface Props {
  kurals: Kural[];
  isMobile?: boolean;
}

const COMMENTATORS = [
  { key: 'mv' as keyof Kural, short: 'மு.வ', name: 'Mu. Varadharasanar', tamil: 'முனைவர் மு. வரதராசனார்' },
  { key: 'sp' as keyof Kural, short: 'சொ.பா', name: 'Solomon Pappaiah', tamil: 'சாலமன் பாப்பையா' },
  { key: 'mk' as keyof Kural, short: 'க.கா', name: 'Kalaignar Karunanidhi', tamil: 'கலைஞர் கருணாநிதி' },
  { key: 'explanation' as keyof Kural, short: 'EN', name: 'English Explanation', tamil: 'ஆங்கில விளக்கம்' },
];

export default function KuralResult({ kurals, isMobile = false }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const kural = kurals[Math.min(activeTab, kurals.length - 1)];

  async function renderCard() {
    const html2canvas = (await import('html2canvas')).default;
    return html2canvas(shareCardRef.current!, {
      backgroundColor: '#0a0a0a', scale: 2, useCORS: true, logging: false,
    });
  }

  const handleSave = async () => {
    if (saving || !shareCardRef.current) return;
    setSaving(true);
    try {
      const canvas = await renderCard();
      const link = document.createElement('a');
      link.download = `thirukkural-${kural.Number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (sharing || !shareCardRef.current) return;
    setSharing(true);
    try {
      const shareText = `${kural.Line1}\n${kural.Line2}\n\n"${kural.Translation}"\n\nask-kural.vercel.app`;

      if (typeof navigator.share === 'function') {
        // Use fetch(dataURL) → blob — most reliable cross-browser approach
        const canvas = await renderCard();
        const dataUrl = canvas.toDataURL('image/png');
        const res     = await fetch(dataUrl);
        const blob    = await res.blob();
        const file    = new File([blob], `thirukkural-${kural.Number}.png`, { type: 'image/png' });

        const withFile = { files: [file], title: `திருக்குறள் #${kural.Number}`, text: shareText };
        const textOnly = { title: `திருக்குறள் #${kural.Number}`, text: shareText, url: 'https://ask-kural.vercel.app' };
        await navigator.share(navigator.canShare?.(withFile) ? withFile : textOnly);
      } else {
        // Desktop — open WhatsApp web with text
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  };

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const tabBar = kurals.length > 1 && (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
      {kurals.map((k, i) => (
        <button
          key={i}
          onClick={() => setActiveTab(i)}
          style={{
            background: activeTab === i ? 'linear-gradient(135deg, #d4af7a, #c4975a)' : 'rgba(212,175,122,0.1)',
            border: `1px solid ${activeTab === i ? 'transparent' : 'rgba(212,175,122,0.3)'}`,
            borderRadius: '20px',
            padding: '8px 18px',
            color: activeTab === i ? '#0a0a0a' : '#d4af7a',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: '"Noto Sans Tamil", sans-serif',
          }}
        >
          குறள் #{k.Number}
        </button>
      ))}
    </div>
  );

  const btnBase: React.CSSProperties = {
    border: '1px solid rgba(212,175,122,0.4)', borderRadius: '10px',
    padding: '8px 16px', color: '#d4af7a', fontSize: '13px', fontWeight: '600',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
  };

  // ── SAVE + SHARE BUTTONS ──────────────────────────────────────────────────
  const shareBtn = (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        style={{ ...btnBase, background: saving ? 'rgba(212,175,122,0.05)' : 'rgba(212,175,122,0.1)', cursor: saving ? 'wait' : 'pointer' }}>
        {saving ? '⏳ Saving…' : '🖼️ Save'}
      </button>
      {/* Share */}
      <button onClick={handleShare} disabled={sharing}
        style={{ ...btnBase, background: sharing ? 'rgba(212,175,122,0.05)' : 'rgba(212,175,122,0.15)', cursor: sharing ? 'wait' : 'pointer' }}>
        {sharing ? '⏳ Sharing…' : <><ShareIcon /> Share</>}
      </button>
    </div>
  );

  // ── KURAL CARD ────────────────────────────────────────────────────────────
  const kuralCard = (
    <div style={{ background: 'rgba(212,175,122,0.05)', border: '2px solid rgba(212,175,122,0.2)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'inline-block', background: 'rgba(212,175,122,0.2)', color: '#d4af7a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
        குறள் #{kural.Number}
      </div>
      <div style={{ fontSize: isMobile ? 'clamp(18px,4vw,24px)' : '22px', lineHeight: '1.8', color: '#f9fafb', marginBottom: '4px' }}>{kural.Line1}</div>
      <div style={{ fontSize: isMobile ? 'clamp(18px,4vw,24px)' : '22px', lineHeight: '1.8', color: '#f9fafb', marginBottom: '16px' }}>{kural.Line2}</div>
      <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '2px' }}>{kural.transliteration1}</div>
      <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '16px' }}>{kural.transliteration2}</div>
      <div style={{ fontSize: '15px', color: '#d4af7a', fontStyle: 'italic', borderLeft: '3px solid rgba(212,175,122,0.5)', paddingLeft: '12px' }}>
        &ldquo;{kural.Translation}&rdquo;
      </div>
      <div style={{ marginTop: '16px' }}>{shareBtn}</div>
    </div>
  );

  // ── COMMENTARIES GRID ─────────────────────────────────────────────────────
  const commentaries = (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#d4af7a', marginBottom: '14px', textAlign: 'center', letterSpacing: '0.05em' }}>
        உரையாசிரியர்கள் · COMMENTARIES
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {COMMENTATORS.map(({ key, short, name, tamil }) => {
          const text = kural[key] as string | undefined;
          if (!text) return null;
          return (
            <div key={key} style={{ background: 'rgba(30,30,30,0.5)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(212,175,122,0.2)', color: '#d4af7a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                  {short}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#f9fafb' }}>{name}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{tamil}</div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── HIDDEN SHARE CARD (captured by html2canvas) ───────────────────────────
  const shareCard = (
    <div
      ref={shareCardRef}
      style={{
        position: 'fixed', top: '-9999px', left: '-9999px',
        width: '600px', padding: '48px',
        background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1410 100%)',
        fontFamily: '"Noto Sans Tamil", "Noto Sans", Georgia, serif',
        color: '#e5e7eb',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '13px', color: 'rgba(212,175,122,0.6)', letterSpacing: '0.15em' }}>திருக்குறள் உரை</div>
        <div style={{ background: 'rgba(212,175,122,0.2)', color: '#d4af7a', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
          குறள் #{kural.Number}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(212,175,122,0.15)', marginBottom: '32px' }} />

      {/* Tamil lines */}
      <div style={{ fontSize: '26px', lineHeight: '1.9', color: '#f9fafb', marginBottom: '6px' }}>{kural.Line1}</div>
      <div style={{ fontSize: '26px', lineHeight: '1.9', color: '#f9fafb', marginBottom: '20px' }}>{kural.Line2}</div>

      {/* Transliteration */}
      <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginBottom: '2px' }}>{kural.transliteration1}</div>
      <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginBottom: '28px' }}>{kural.transliteration2}</div>

      {/* Translation */}
      <div style={{ borderLeft: '3px solid rgba(212,175,122,0.6)', paddingLeft: '18px', marginBottom: '40px' }}>
        <div style={{ fontSize: '17px', color: '#d4af7a', fontStyle: 'italic', lineHeight: '1.6' }}>
          &ldquo;{kural.Translation}&rdquo;
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(212,175,122,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: 'rgba(212,175,122,0.4)', letterSpacing: '0.08em' }}>
          a small tribute to kural · குறளுக்கு ஒரு சிறு காணிக்கை
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(212,175,122,0.5)', letterSpacing: '0.06em' }}>ask-kural.vercel.app</div>
      </div>
    </div>
  );

  // ── LAYOUT ────────────────────────────────────────────────────────────────
  return (
    <div>
      {tabBar}

      {isMobile ? (
        // Mobile: stacked
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {kuralCard}
          {commentaries}
        </div>
      ) : (
        // Desktop: side by side
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '24px', alignItems: 'start' }}>
          {kuralCard}
          {commentaries}
        </div>
      )}

      {shareCard}
    </div>
  );
}
