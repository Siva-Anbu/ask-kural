import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── STOP WORDS — words that carry no meaning ────────────────────────────────
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
  'help','find','need','ask','show','call','turn','move','live','leave','work',
  // Tamil stop words
  'நான்','என்','எனக்கு','என்னை','நாம்','நமக்கு','அவர்','அவள்','அவன்',
  'இது','அது','ஒரு','என்று','இல்லை','இருக்கிறது','செய்கிறேன்','வேண்டும்',
]);

// ─── WORD STEMMER — reduce words to root form ────────────────────────────────
// e.g. "fighting" → "fight", "lonely" → "lone", "recovery" → "recover"
function stem(word: string): string {
  return word
    .replace(/ing$/, '')
    .replace(/tion$/, '')
    .replace(/ness$/, '')
    .replace(/ment$/, '')
    .replace(/ful$/, '')
    .replace(/less$/, '')
    .replace(/ed$/, '')
    .replace(/ly$/, '')
    .replace(/er$/, '')
    .replace(/est$/, '')
    .replace(/s$/, '');
}

// ─── EXTRACT MEANINGFUL KEYWORDS ─────────────────────────────────────────────

// ─── SYNONYM EXPANSION — maps user words to Supabase theme words ─────────────
const SYNONYMS: Record<string, string[]> = {
  // Ego / pride / arrogance
  egoistic: ['ego','arrogance','pride'],
  egotistic: ['ego','arrogance','pride'],
  arrogant: ['arrogance','ego','pride'],
  arrogance: ['arrogance','ego','pride'],
  proud: ['pride','ego','arrogance'],
  selfish: ['ego','selfish','arrogance'],
  rude: ['arrogance','ego','difficult'],
  disrespect: ['arrogance','ego','difficult'],
  disrespectful: ['arrogance','ego','difficult'],
  toxic: ['difficult','arrogance','ego'],
  narcissist: ['ego','arrogance','pride'],
  tackle: ['difficult','strategy','wisdom'],
  deal: ['difficult','strategy','wisdom'],
  handle: ['difficult','strategy','wisdom'],
  // Anger synonyms
  furious: ['anger','rage'],
  irritate: ['anger','frustration'],
  annoy: ['anger','frustration'],
  annoying: ['anger','frustration','difficult'],
  // Loneliness synonyms
  homesick: ['loneliness','missing','home'],
  isolated: ['loneliness','alone'],
  // Grief / sadness
  grief: ['perseverance','sadness','loss'],
  grieve: ['perseverance','sadness','loss'],
  heartbroken: ['love','heartbreak','loss'],
  depressed: ['perseverance','peace','sadness'],
  // Career synonyms
  unemployed: ['career','job','perseverance'],
  jobless: ['career','job','perseverance'],
  fired: ['career','job','perseverance'],
  // Relationship synonyms
  divorce: ['love','family','separation'],
  breakup: ['love','heartbreak','separation'],
  cheat: ['friendship','betrayal','love'],
  cheating: ['friendship','betrayal','love'],
  betray: ['friendship','betrayal'],
  // Friendship
  backstab: ['friendship','betrayal'],
  fake: ['friendship','betrayal'],
  // Procrastination synonyms
  distract: ['procrastination','laziness'],
  unmotivated: ['procrastination','laziness'],
  // Health
  sick: ['medicine','health','body'],
  ill: ['medicine','health','body'],
  // Neighbour / people
  neighbour: ['ego','difficult','wisdom','society'],
  neighbor: ['ego','difficult','wisdom','society'],
  colleague: ['work','career','difficult'],
  coworker: ['work','career','difficult'],
};

function expandWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>(keywords);
  for (const kw of keywords) {
    if (SYNONYMS[kw]) {
      SYNONYMS[kw].forEach(s => expanded.add(s));
    }
    // Also try stemmed version
    const stemmed = stem(kw);
    if (SYNONYMS[stemmed]) {
      SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2);

  const keywords = new Set<string>();
  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      keywords.add(word);           // original word
      keywords.add(stem(word));     // stemmed form
    }
  }

  return Array.from(keywords).filter(w => w.length > 2);
}

// ─── SCORE A KURAL AGAINST KEYWORDS ──────────────────────────────────────────
function scoreKural(kural: Record<string, unknown>, keywords: string[]): number {
  let score = 0;
  const themes = (kural.themes as string[]) || [];
  const english = ((kural.english as string) || '').toLowerCase();
  const chapterEn = ((kural.chapter_english as string) || '').toLowerCase();

  for (const kw of keywords) {
    // Theme match — highest weight (direct semantic match)
    for (const theme of themes) {
      if (theme.includes(kw) || kw.includes(theme)) score += 5;
    }
    // English meaning match — medium weight
    if (english.includes(kw)) score += 3;
    // Chapter name match — lower weight
    if (chapterEn.includes(kw)) score += 2;
  }

  return score;
}

// ─── FIND BEST KURAL FROM ALL 1330 ───────────────────────────────────────────
async function findBestKural(keywords: string[]) {
  // Step 1: Try overlapping themes with all keywords at once
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords);

  if (themeMatches && themeMatches.length > 0) {
    // Score each match and return the best one
    const scored = themeMatches
      .map(k => ({ kural: k, score: scoreKural(k as Record<string, unknown>, keywords) }))
      .sort((a, b) => b.score - a.score);
    return scored[0].kural;
  }

  // Step 2: Full text search across english meaning for each keyword
  const candidates: Record<string, unknown>[] = [];
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(10);
    if (data) candidates.push(...(data as Record<string, unknown>[]));
  }

  if (candidates.length > 0) {
    // Deduplicate by kural number
    const seen = new Set<number>();
    const unique = candidates.filter(k => {
      const num = k.number as number;
      if (seen.has(num)) return false;
      seen.add(num);
      return true;
    });
    // Score and return best
    const scored = unique
      .map(k => ({ kural: k, score: scoreKural(k, keywords) }))
      .sort((a, b) => b.score - a.score);
    return scored[0].kural;
  }

  // Step 3: Final fallback — return a random Kural
  const { data: all } = await supabase
    .from('kurals')
    .select('*')
    .limit(200);
  if (all && all.length > 0) {
    return all[Math.floor(Math.random() * all.length)];
  }

  return null;
}

// ─── MAIN API HANDLER ─────────────────────────────────────────────────────────
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

    const expandedKeywords = expandWithSynonyms(keywords);
    const kural = await findBestKural(expandedKeywords);
    if (!kural) {
      return NextResponse.json({ error: 'Could not find a matching Kural.' }, { status: 500 });
    }

    return NextResponse.json({ kural, keywords });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
