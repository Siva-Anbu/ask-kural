import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STOP_WORDS = new Set([
  'i','me','my','myself','we','our','you','your','he','him','his','she','her',
  'they','them','their','it','its','a','an','the','and','or','but','if','in',
  'on','at','to','for','of','with','by','from','as','is','was','are','were',
  'be','been','being','have','has','had','do','did','does','will','would',
  'could','should','may','might','shall','can','need','must','am','this',
  'that','these','those','so','up','out','about','into','than','then','there',
  'when','where','who','how','what','which','why','not','no','yes','just',
  'very','too','also','still','even','already','now','today','yesterday',
  'please','want','like','get','got','getting','make','made','say','said',
  'think','know','feel','feels','feeling','felt','going','come','came','really',
  'actually','always','never','sometimes','maybe','perhaps','again','back',
  'way','thing','things','something','anything','everything','nothing','tell',
  'let','see','look','try','use','give','take','put','keep','start','end',
  'find','ask','show','call','turn','move','live','leave','help','work',
]);

// Simple but comprehensive synonym map — only for words Valluvar wouldn't use
const SYNONYMS: Record<string, string[]> = {
  egoistic: ['arrogance','ego','pride'],
  egotistic: ['arrogance','ego','pride'],
  arrogant: ['arrogance','pride'],
  selfish: ['selfish','ego'],
  rude: ['arrogance','anger'],
  toxic: ['difficult','anger'],
  tackle: ['wisdom','enemy'],
  handle: ['wisdom'],
  frustrated: ['frustration','anger','effort'],
  frustration: ['anger','effort'],
  stressed: ['peace','suffering'],
  stress: ['peace','suffering'],
  overwhelmed: ['suffering','peace'],
  burnout: ['effort','laziness'],
  exhausted: ['effort','perseverance'],
  depressed: ['suffering','peace'],
  anxiety: ['fear','peace'],
  anxious: ['fear','peace'],
  jobless: ['wealth','effort','perseverance'],
  unemployed: ['wealth','effort','perseverance'],
  fired: ['effort','perseverance'],
  breakup: ['love','separation'],
  divorce: ['love','separation'],
  cheating: ['betrayal','friendship'],
  betrayed: ['betrayal','friendship'],
  lonely: ['loneliness','love'],
  homesick: ['loneliness','home'],
  procrastinate: ['laziness','action'],
  lazy: ['laziness','action'],
  neighbour: ['arrogance','wisdom'],
  neighbor: ['arrogance','wisdom'],
  language: ['speech','words','eloquence'],
  speak: ['speech','words'],
  communication: ['speech','words'],
};

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    // Add synonyms
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));
    // Stem and add
    const stemmed = word
      .replace(/tion$|ing$|ness$|ment$|ful$|less$|ed$|ly$|er$|s$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

// Score each kural by counting keyword hits across all fields
function scoreKural(kural: Record<string, unknown>, keywords: string[]): number {
  let score = 0;
  const english = ((kural.english as string) || '').toLowerCase();
  const chapter  = ((kural.chapter_english as string) || '').toLowerCase();
  const themes   = ((kural.themes as string[]) || []).join(' ').toLowerCase();

  for (const kw of keywords) {
    if (kw.length < 3) continue;
    if (themes.includes(kw))  score += 5; // theme match = strongest
    if (english.includes(kw)) score += 3; // meaning match = strong
    if (chapter.includes(kw)) score += 2; // chapter match = medium
  }
  return score;
}

async function findBestKural(keywords: string[]) {
  const queryString = keywords.join(' ');

  // Step 1: Postgres full-text search — fast, gets top 30 candidates
  const { data: ftResults } = await supabase.rpc('search_kurals', {
    query_text: queryString,
    result_limit: 30,
  });

  if (ftResults && ftResults.length > 0) {
    // Re-score all candidates using our keyword hit counter
    const scored = (ftResults as Record<string, unknown>[])
      .map(k => ({ kural: k, score: scoreKural(k, keywords) }))
      .sort((a, b) => b.score - a.score);

    // Return best — add small randomness among top 3 for variety
    const top = scored.slice(0, 3);
    return top[Math.floor(Math.random() * top.length)].kural;
  }

  // Step 2: Theme overlap fallback
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(20);

  if (themeMatches && themeMatches.length > 0) {
    const scored = (themeMatches as Record<string, unknown>[])
      .map(k => ({ kural: k, score: scoreKural(k, keywords) }))
      .sort((a, b) => b.score - a.score);
    return scored[0].kural;
  }

  // Step 3: ILIKE search on english meaning
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(10);
    if (data && data.length > 0) {
      const scored = (data as Record<string, unknown>[])
        .map(k => ({ kural: k, score: scoreKural(k, keywords) }))
        .sort((a, b) => b.score - a.score);
      return scored[0].kural;
    }
  }

  // Step 4: Random fallback
  const { data: all } = await supabase.from('kurals').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const keywords = extractKeywords(message);
    if (keywords.length === 0) {
      return NextResponse.json({ error: 'Could not understand query. Please try again.' }, { status: 400 });
    }

    const kural = await findBestKural(keywords);
    if (!kural) {
      return NextResponse.json({ error: 'Could not find a matching Kural.' }, { status: 500 });
    }

    // Return only the original user-typed keywords for display (not expanded ones)
    const displayKeywords = message
      .toLowerCase()
      .replace(/[.,!?;:'"()\-]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w))
      .slice(0, 5);

    return NextResponse.json({ kural, keywords: displayKeywords });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
