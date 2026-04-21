import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── STOP WORDS ───────────────────────────────────────────────────────────────
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
  'find','need','ask','show','call','turn','move','live','leave',
]);

// ─── SYNONYM MAP — expand user words to searchable equivalents ────────────────
const SYNONYMS: Record<string, string[]> = {
  // Ego / pride
  egoistic: ['arrogance','ego','pride'],
  egotistic: ['arrogance','ego','pride'],
  arrogant: ['arrogance','ego','pride'],
  selfish: ['selfish','ego','arrogance'],
  narcissist: ['ego','arrogance','pride'],
  rude: ['arrogance','difficult','anger'],
  disrespect: ['arrogance','ego','difficult'],
  disrespectful: ['arrogance','ego','difficult'],
  toxic: ['difficult','arrogance'],
  tackle: ['difficult','wisdom','enemy'],
  handle: ['wisdom','difficult'],
  deal: ['wisdom','difficult'],
  // Anger
  furious: ['anger','rage'],
  irritate: ['anger','frustration'],
  annoying: ['anger','difficult'],
  // Loneliness
  homesick: ['loneliness','missing','home'],
  isolated: ['loneliness','alone'],
  // Grief
  grief: ['suffering','sadness','loss'],
  depressed: ['suffering','peace','sadness'],
  // Career
  unemployed: ['perseverance','effort','wealth'],
  jobless: ['perseverance','effort','wealth'],
  fired: ['perseverance','effort'],
  // Relationships
  divorce: ['love','separation'],
  breakup: ['love','heartbreak'],
  cheating: ['betrayal','friendship'],
  betray: ['betrayal','friendship'],
  backstab: ['betrayal','friendship'],
  // Laziness
  distracted: ['laziness','procrastination'],
  unmotivated: ['laziness','procrastination'],
  // Health
  sick: ['medicine','health'],
  ill: ['medicine','health'],
  mental: ['peace','mind','wisdom'],
  // People
  neighbour: ['arrogance','difficult','wisdom'],
  neighbor: ['arrogance','difficult','wisdom'],
  colleague: ['work','career'],
  coworker: ['work','career'],
  // Language
  language: ['speech','language','words','eloquence'],
  speak: ['speech','language','words'],
  talking: ['speech','language','words'],
  communication: ['speech','language','words'],
};

// ─── EXTRACT KEYWORDS ─────────────────────────────────────────────────────────
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    // Add synonyms
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));
    // Stem basic suffixes
    const stemmed = word.replace(/ing$|tion$|ness$|ment$|ed$|ly$|er$|s$/, '');
    if (stemmed !== word && stemmed.length > 2) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }

  return Array.from(expanded);
}

// ─── FIND BEST KURAL using Postgres full-text search ─────────────────────────
async function findBestKural(keywords: string[]) {
  // Build a plainto_tsquery compatible string
  const queryString = keywords.join(' ');

  // Step 1: Full-text search — ranked by how well kural matches the keywords
  const { data: ftResults } = await supabase.rpc('search_kurals', {
    query_text: queryString,
    result_limit: 5
  });

  if (ftResults && ftResults.length > 0) {
    // Pick randomly from top 3 for variety
    return ftResults[Math.floor(Math.random() * Math.min(ftResults.length, 3))];
  }

  // Step 2: Fallback — theme overlap
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(10);

  if (themeMatches && themeMatches.length > 0) {
    return themeMatches[Math.floor(Math.random() * Math.min(themeMatches.length, 3))];
  }

  // Step 3: ILIKE fallback on meaningful words
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(3);
    if (data && data.length > 0) return data[0];
  }

  // Step 4: Random
  const { data: all } = await supabase.from('kurals').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];

  return null;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const keywords = extractKeywords(message);

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'Could not understand the query. Please try again.' }, { status: 400 });
    }

    const kural = await findBestKural(keywords);
    if (!kural) {
      return NextResponse.json({ error: 'Could not find a matching Kural.' }, { status: 500 });
    }

    return NextResponse.json({ kural, keywords: keywords.slice(0, 6) });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
