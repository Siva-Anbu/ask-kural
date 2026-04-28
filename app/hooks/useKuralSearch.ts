'use client';

import { useState } from 'react';

export interface Kural {
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

export interface SearchResponse {
  kurals: Kural[];
  keywords: string[];
  source: 'direct' | 'chapter' | 'predefined' | 'questionare' | 'keyword' | 'semantic' | 'theme-fallback';
  matchedSituation?: string;
  similarity?: number;
  confidence?: 'high' | 'medium' | 'low';
  confidenceMessage?: string;
  keywordCount?: number;
  detectedThemes?: string[];
}

export interface ErrorResponse {
  error: string;
  suggestions?: string[];
}

export const PROMPTS = [
  { tamil: 'மகிழ்ச்சியாக வாழ', english: 'How to live happily' },
  { tamil: 'காதலில் மகிழ்ச்சி', english: 'I am in love' },
  { tamil: 'நன்றியுடன் வாழ', english: 'How to be grateful' },
  { tamil: 'நட்பின் மதிப்பு', english: 'Value of true friendship' },
  { tamil: 'அன்பானவரை இழந்தேன்', english: 'I lost someone I love' },
  { tamil: 'மனம் வருந்துகிறேன்', english: 'I feel deeply sad' },
];

export function useKuralSearch() {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) {
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
        body: JSON.stringify({ message: query }),
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
        suggestions: ['Try: "show me kural 1"', 'Try: "advice for sadness"'],
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, error, loading, search, reset };
}
