'use client';
import { useState } from 'react';

const PHRASES = [
  "I am frustrated with my job",
  "I feel so lonely today",
  "I am happy and grateful",
  "I am angry at my friend",
  "I feel lazy and unmotivated",
  "I am scared about my future",
  "I feel proud of my achievement",
  "I am sad and crying",
  "I have too much greed for money",
  "I want to be courageous",
  "I feel jealous of others success",
  "I am overwhelmed with stress",
  "I want to show kindness to everyone",
  "I am confused about my life decisions",
  "I feel hopeful about tomorrow",
  "I am dealing with a very bad friend",
  "I want to learn wisdom",
  "when will my physical pain go off",
  "I need patience in difficult times",
  "I want to be a good leader",
];

interface KuralResult { number: number; chapter_english: string; english: string; }
interface TestResult { phrase: string; status: 'waiting'|'running'|'pass'|'fail'; kural?: KuralResult; keywords?: string[]; error?: string; }

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>(PHRASES.map(p => ({ phrase: p, status: 'waiting' })));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const rate = done > 0 ? Math.round((passed / done) * 100) : 0;
  const pct = Math.round((done / PHRASES.length) * 100);

  async function runTests() {
    setRunning(true); setDone(0);
    const fresh: TestResult[] = PHRASES.map(p => ({ phrase: p, status: 'waiting' }));
    setResults([...fresh]);
    for (let i = 0; i < PHRASES.length; i++) {
      fresh[i] = { ...fresh[i], status: 'running' };
      setResults([...fresh]);
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: PHRASES[i] }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'HTTP ' + res.status);
        if (!data.kural) throw new Error('No kural returned');
        fresh[i] = { ...fresh[i], status: 'pass', kural: data.kural, keywords: data.keywords };
      } catch (e: unknown) {
        fresh[i] = { ...fresh[i], status: 'fail', error: (e as Error).message };
      }
      setResults([...fresh]);
      setDone(i + 1);
      if (i < PHRASES.length - 1) await new Promise(r => setTimeout(r, 600));
    }
    setRunning(false);
  }

  function reset() { setResults(PHRASES.map(p => ({ phrase: p, status: 'waiting' }))); setDone(0); }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0e0b', color: '#e8d5a3', fontFamily: 'Georgia, serif', padding: '2rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#d4a350', marginBottom: 4 }}>
            Thirukkural — Auto Test Suite
          </h1>
          <p style={{ fontSize: 13, color: '#8a7a5a', margin: 0 }}>
            Runs 20 emotional phrases against{' '}
            <code style={{ background: '#1a1a14', padding: '1px 6px', borderRadius: 4 }}>/api/ask</code>
            {' '}and validates responses
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {([
            ['Total', PHRASES.length, '#e8d5a3'],
            ['Passed', done > 0 ? passed : '—', '#6aaa3a'],
            ['Failed', done > 0 ? failed : '—', '#cc4444'],
            ['Pass rate', done > 0 ? rate + '%' : '—', '#d4a350'],
          ] as [string, string|number, string][]).map(([l, v, c]) => (
            <div key={l} style={{ background: '#1a1a14', borderRadius: 10, padding: '0.75rem 1rem', border: '0.5px solid #2a2a1e' }}>
              <div style={{ fontSize: 11, color: '#6a6040', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ background: '#1a1a14', borderRadius: 4, height: 6, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: '#3B6D11', transition: 'width 0.3s', borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 12, color: '#6a6040', marginBottom: 20 }}>
          {running
            ? `Testing ${done + 1} of ${PHRASES.length}…`
            : done === PHRASES.length
            ? `Done — ${passed} passed, ${failed} failed (${rate}%)`
            : 'Ready to run'}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button
            onClick={runTests}
            disabled={running}
            style={{ padding: '8px 20px', background: running ? '#2a2a1e' : '#d4a350', color: running ? '#6a6040' : '#0f0e0b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: running ? 'not-allowed' : 'pointer' }}
          >
            {running ? 'Running…' : 'Run All 20 Tests'}
          </button>
          {done > 0 && !running && (
            <button onClick={reset} style={{ padding: '8px 20px', background: 'transparent', color: '#8a7a5a', border: '1px solid #2a2a1e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Reset
            </button>
          )}
        </div>

        {/* Test rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((r, i) => (
            <div key={i} style={{
              background: '#1a1a14',
              border: r.status === 'pass' ? '1px solid #3B6D11' : r.status === 'fail' ? '1px solid #7a2020' : '0.5px solid #2a2a1e',
              borderLeft: r.status === 'pass' ? '4px solid #6aaa3a' : r.status === 'fail' ? '4px solid #cc4444' : r.status === 'running' ? '4px solid #d4a350' : '4px solid #2a2a1e',
              borderRadius: 10, padding: '0.7rem 1rem',
              display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'start',
            }}>
              <span style={{ fontSize: 11, color: '#4a4030', paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8d5a3', marginBottom: 3 }}>{r.phrase}</div>
                <div style={{ fontSize: 11, color: '#7a6a4a' }}>
                  {r.status === 'running' && <span style={{ color: '#d4a350' }}>⟳ Testing…</span>}
                  {r.status === 'waiting' && '—'}
                  {r.status === 'pass' && r.kural && (
                    <>
                      <span style={{ color: '#d4a350', fontWeight: 600 }}>Kural #{r.kural.number}</span>
                      {' · '}
                      <span style={{ color: '#5a5040' }}>{r.kural.chapter_english}</span>
                      {r.keywords && r.keywords.length > 0 && (
                        <span style={{ color: '#4a6a30' }}>{' · '}{r.keywords.join(', ')}</span>
                      )}
                    </>
                  )}
                  {r.status === 'fail' && (
                    <span style={{ color: '#cc4444' }}>{r.error}</span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap',
                background: r.status === 'pass' ? '#1a3a0a' : r.status === 'fail' ? '#2a0a0a' : r.status === 'running' ? '#2a200a' : '#1e1e14',
                color: r.status === 'pass' ? '#6aaa3a' : r.status === 'fail' ? '#cc4444' : r.status === 'running' ? '#d4a350' : '#4a4030',
              }}>
                {r.status === 'waiting' ? 'Waiting' : r.status === 'running' ? 'Testing' : r.status === 'pass' ? '✓ Pass' : '✗ Fail'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
