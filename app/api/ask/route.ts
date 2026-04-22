import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'it', 'its', 'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in',
  'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'did', 'does', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'am', 'this',
  'that', 'these', 'those', 'so', 'up', 'out', 'about', 'into', 'than', 'then', 'there',
  'when', 'where', 'who', 'how', 'what', 'which', 'why', 'not', 'no', 'yes', 'just',
  'very', 'too', 'also', 'still', 'even', 'already', 'now', 'today', 'yesterday',
  'please', 'want', 'like', 'get', 'got', 'getting', 'make', 'made', 'say', 'said',
  'think', 'know', 'feel', 'feels', 'feeling', 'felt', 'going', 'come', 'came', 'really',
  'actually', 'always', 'never', 'sometimes', 'maybe', 'perhaps', 'again', 'back',
  'way', 'thing', 'things', 'something', 'anything', 'everything', 'nothing', 'tell',
  'let', 'see', 'look', 'try', 'use', 'give', 'take', 'put', 'keep', 'start', 'end',
  'find', 'ask', 'show', 'call', 'turn', 'move', 'live', 'leave', 'help', 'work',
  'kural', 'kuṟaḷ', 'குறள்', 'chapter', 'adhikaram', 'அதிகாரம்', 'give', 'show', 'tell',
]);

const ORDINALS_EN: Record<string, number> = {
  'first': 1, '1st': 1,
  'second': 2, '2nd': 2,
  'third': 3, '3rd': 3,
  'fourth': 4, '4th': 4,
  'fifth': 5, '5th': 5,
  'sixth': 6, '6th': 6,
  'seventh': 7, '7th': 7,
  'eighth': 8, '8th': 8,
  'ninth': 9, '9th': 9,
  'tenth': 10, '10th': 10,
  'last': 10,
};

const ORDINALS_TA: Record<string, number> = {
  'முதல்': 1, 'முதலாவது': 1, 'ஒன்றாம்': 1, 'ஒன்றாவது': 1,
  'இரண்டாம்': 2, 'இரண்டாவது': 2,
  'மூன்றாம்': 3, 'மூன்றாவது': 3,
  'நான்காம்': 4, 'நான்காவது': 4,
  'ஐந்தாம்': 5, 'ஐந்தாவது': 5,
  'ஆறாம்': 6, 'ஆறாவது': 6,
  'ஏழாம்': 7, 'ஏழாவது': 7,
  'எட்டாம்': 8, 'எட்டாவது': 8,
  'ஒன்பதாம்': 9, 'ஒன்பதாவது': 9,
  'பத்தாம்': 10, 'பத்தாவது': 10,
  'கடைசி': 10,
};

const SYNONYMS: Record<string, string[]> = {
  god: ['god', 'virtue', 'faith'],
  prayer: ['god', 'virtue', 'faith'],
  faith: ['god', 'virtue', 'faith'],
  worship: ['god', 'virtue', 'faith'],
  divine: ['god', 'virtue', 'faith'],
  bless: ['god', 'virtue', 'faith'],
  blessed: ['god', 'virtue', 'blessing'],
  spiritual: ['god', 'virtue', 'faith'],
  religion: ['god', 'virtue', 'faith'],
  temple: ['god', 'virtue', 'faith'],
  rain: ['rain', 'nature', 'farming'],
  drought: ['rain', 'nature', 'poverty'],
  nature: ['rain', 'nature', 'farming'],
  environment: ['rain', 'nature', 'farming'],
  water: ['rain', 'nature', 'health'],
  virtue: ['virtue', 'ethics', 'morality'],
  moral: ['virtue', 'ethics', 'morality'],
  ethics: ['virtue', 'ethics', 'morality'],
  righteous: ['virtue', 'ethics', 'morality'],
  integrity: ['virtue', 'ethics', 'morality'],
  honesty: ['virtue', 'ethics', 'truth'],
  lie: ['truth', 'fraud', 'honesty'],
  lying: ['truth', 'fraud', 'honesty'],
  corrupt: ['virtue', 'ethics', 'governance'],
  family: ['domestic', 'love', 'children'],
  home: ['domestic', 'love', 'family'],
  house: ['domestic', 'love', 'family'],
  wife: ['domestic', 'love', 'marriage'],
  husband: ['domestic', 'love', 'marriage'],
  marriage: ['love', 'domestic', 'marriage'],
  married: ['love', 'domestic', 'marriage'],
  divorce: ['love', 'separation', 'marriage'],
  relationship: ['love', 'friendship', 'domestic'],
  parent: ['domestic', 'children', 'family'],
  parents: ['domestic', 'children', 'family'],
  mother: ['domestic', 'love', 'children'],
  father: ['domestic', 'love', 'children'],
  son: ['children', 'domestic', 'love'],
  daughter: ['children', 'domestic', 'love'],
  children: ['children', 'domestic', 'joy'],
  child: ['children', 'domestic', 'joy'],
  baby: ['children', 'domestic', 'love'],
  parenting: ['children', 'domestic', 'family'],
  birth: ['children', 'domestic', 'family'],
  pregnancy: ['children', 'domestic', 'family'],
  love: ['love', 'joy', 'domestic'],
  affection: ['love', 'joy', 'kindness'],
  romance: ['love', 'joy', 'separation'],
  heartbroken: ['love', 'grief', 'separation'],
  breakup: ['love', 'separation', 'grief'],
  crush: ['love', 'joy', 'separation'],
  unrequited: ['love', 'separation', 'grief'],
  hospitality: ['hospitality', 'generosity', 'kindness'],
  guest: ['hospitality', 'generosity', 'kindness'],
  host: ['hospitality', 'generosity', 'kindness'],
  generous: ['generosity', 'kindness', 'hospitality'],
  generosity: ['generosity', 'kindness', 'hospitality'],
  donate: ['giving', 'generosity', 'kindness'],
  charity: ['giving', 'generosity', 'compassion'],
  share: ['giving', 'generosity', 'kindness'],
  speak: ['speech', 'words', 'eloquence'],
  speech: ['speech', 'words', 'eloquence'],
  words: ['speech', 'words', 'eloquence'],
  language: ['speech', 'words', 'eloquence'],
  communication: ['speech', 'words', 'eloquence'],
  talk: ['speech', 'words', 'eloquence'],
  silence: ['silence', 'wisdom', 'speech'],
  quiet: ['silence', 'wisdom', 'peace'],
  harsh: ['speech', 'anger', 'arrogance'],
  insult: ['speech', 'arrogance', 'anger'],
  abuse: ['speech', 'anger', 'arrogance'],
  gossip: ['speech', 'slander', 'friendship'],
  slander: ['slander', 'speech', 'friendship'],
  rumour: ['slander', 'speech', 'gossip'],
  backbite: ['slander', 'speech', 'friendship'],
  gratitude: ['gratitude', 'thankfulness', 'kindness'],
  grateful: ['gratitude', 'thankfulness', 'kindness'],
  thankful: ['gratitude', 'thankfulness', 'kindness'],
  ungrateful: ['gratitude', 'thankfulness', 'betrayal'],
  thanks: ['gratitude', 'thankfulness', 'kindness'],
  appreciate: ['gratitude', 'thankfulness', 'kindness'],
  fair: ['impartiality', 'justice', 'virtue'],
  fairness: ['impartiality', 'justice', 'virtue'],
  bias: ['impartiality', 'justice', 'virtue'],
  equality: ['impartiality', 'justice', 'virtue'],
  equal: ['impartiality', 'justice', 'virtue'],
  discrimination: ['impartiality', 'justice', 'virtue'],
  selfcontrol: ['self-control', 'patience', 'virtue'],
  discipline: ['self-control', 'virtue', 'action'],
  temptation: ['self-control', 'desire', 'virtue'],
  impulse: ['self-control', 'anger', 'virtue'],
  restraint: ['self-control', 'patience', 'virtue'],
  control: ['self-control', 'patience', 'virtue'],
  conduct: ['virtue', 'ethics', 'action'],
  behaviour: ['virtue', 'ethics', 'action'],
  sin: ['virtue', 'ethics', 'evil'],
  evil: ['virtue', 'ethics', 'evil'],
  wrong: ['virtue', 'ethics', 'wrong'],
  mistake: ['virtue', 'ethics', 'correction'],
  regret: ['virtue', 'ethics', 'grief'],
  guilt: ['shame', 'virtue', 'ethics'],
  shame: ['shame', 'virtue', 'modesty'],
  kill: ['killing', 'compassion', 'virtue'],
  violence: ['violence', 'compassion', 'virtue'],
  nonviolence: ['compassion', 'virtue', 'killing'],
  meat: ['abstaining', 'virtue', 'compassion'],
  vegetarian: ['abstaining', 'virtue', 'compassion'],
  vegan: ['abstaining', 'virtue', 'compassion'],
  animal: ['compassion', 'killing', 'virtue'],
  cruelty: ['cruelty', 'compassion', 'virtue'],
  cruel: ['cruelty', 'compassion', 'virtue'],
  trust: ['friendship', 'truth', 'loyalty'],
};

/**
 * Simple string similarity (Levenshtein-based, normalized)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(len1, len2) / maxLen;
  }

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

/**
 * Map DB row → normalized kural object
 */
function transformKural(row: any) {
  return {
    number: row.Number,
    tamil: `${row.Line1 || ''} ${row.Line2 || ''}`.trim(),
    english: row.Translation || '',
    transliteration: `${row.transliteration1 || ''} ${row.transliteration2 || ''}`.trim(),
    mv: row.mv || '',
    sp: row.sp || '',
    mk: row.mk || '',
    explanation: row.explanation || '',
    couplet: row.couplet || '',
    chapter_tamil: row.chapter_tamil || null,
    chapter_english: row.chapter_english || null,
    themes: row.themes || [],
  };
}

/**
 * Predefined question → kural mapping
 */
async function findPredefinedQuestion(message: string): Promise<number | null> {
  const { data: mappings, error } = await supabase
    .from('question_kural_mappings')
    .select('*')
    .eq('verified', true);

  if (error || !mappings || mappings.length === 0) {
    return null;
  }

  const normalized = message.toLowerCase().trim();
  let bestMatch: { kural: number; score: number; confidence: string } | null = null;

  for (const mapping of mappings) {
    const questions = mapping.questions || [];
    for (const question of questions) {
      const similarity = stringSimilarity(normalized, question);
      const threshold = mapping.confidence_level === 'high' ? 0.73 : 0.75;

      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = {
            kural: mapping.kural_number,
            score: similarity,
            confidence: mapping.confidence_level,
          };
        }
      }
    }

    const questionsTamil = mapping.questions_tamil || [];
    for (const question of questionsTamil) {
      const similarity = stringSimilarity(normalized, question);
      const threshold = mapping.confidence_level === 'high' ? 0.73 : 0.75;

      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = {
            kural: mapping.kural_number,
            score: similarity,
            confidence: mapping.confidence_level,
          };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.73) {
    return bestMatch.kural;
  }

  return null;
}

/**
 * Direct kural number extraction
 */
function extractDirectKuralNumber(message: string): number | null {
  const lower = message.toLowerCase().trim();

  const justNumber = /^(\d{1,4})$/;
  const match1 = lower.match(justNumber);
  if (match1) {
    const num = parseInt(match1[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  const kuralPattern = /(?:kural|குறள்|kuṟaḷ)\s*[#:]?\s*(\d{1,4})/;
  const match2 = lower.match(kuralPattern);
  if (match2) {
    const num = parseInt(match2[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  const giveShowPattern =
    /(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/;
  const match3 = lower.match(giveShowPattern);
  if (match3) {
    const num = parseInt(match3[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  return null;
}

/**
 * Chapter-based kural extraction
 */
function extractChapterKuralQuery(message: string): number | null {
  const lower = message.toLowerCase().trim();

  const enPattern1 =
    /(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|\d+(?:st|nd|rd|th)?)\s+(?:kural|குறள்)\s+(?:of|in)\s+(?:chapter|அதிகாரம்)\s+(\d{1,3})/i;
  const match1 = lower.match(enPattern1);
  if (match1) {
    const position = ORDINALS_EN[match1[1]] || parseInt(match1[1]);
    const chapterNum = parseInt(match1[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  const enPattern2 =
    /(?:chapter|அதிகாரம்)\s+(\d{1,3})(?:'s)?\s+(?:kural|குறள்)?\s*(\d{1,2}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)/i;
  const match2 = lower.match(enPattern2);
  if (match2) {
    const chapterNum = parseInt(match2[1]);
    const position = ORDINALS_EN[match2[2]] || parseInt(match2[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  const taPattern =
    /(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s+(?:குறள்|kural)?\s*(?:அதிகாரத்தின்|அதிகாரம்)?\s+(\d{1,3})/;
  const match3 = message.match(taPattern);
  if (match3) {
    const position = ORDINALS_TA[match3[1]];
    const chapterNum = parseInt(match3[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  const taPattern2 =
    /(?:அதிகாரம்|chapter)\s+(\d{1,3})\s*(?:இன்|ன்|of)?\s*(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s*(?:குறள்)?/;
  const match4 = message.match(taPattern2);
  if (match4) {
    const chapterNum = parseInt(match4[1]);
    const position = ORDINALS_TA[match4[2]];

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  return null;
}

/**
 * Get kural by number from Kurals-new
 */
async function getKuralByNumber(num: number) {
  const { data, error } = await supabase
    .from('Kurals-new')
    .select('*')
    .eq('Number', num)
    .single();

  if (error || !data) return null;
  return transformKural(data);
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    if (SYNONYMS[word]) SYNONYMS[word].forEach((s) => expanded.add(s));
    const stemmed = word.replace(/tion$|ing$|ness$|ment$|ful$|less$|ed$|ly$|er$|s$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach((s) => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

/**
 * Score kural using your actual columns
 */
function scoreKural(kural: any, keywords: string[]): number {
  let score = 0;

  const tamil = `${kural.Line1 || ''} ${kural.Line2 || ''}`.toLowerCase();
  const english = (kural.Translation || '').toLowerCase();
  const transliteration = `${kural.transliteration1 || ''} ${kural.transliteration2 || ''}`.toLowerCase();
  const mv = (kural.mv || '').toLowerCase();
  const sp = (kural.sp || '').toLowerCase();
  const mk = (kural.mk || '').toLowerCase();
  const explanation = (kural.explanation || '').toLowerCase();
  const couplet = (kural.couplet || '').toLowerCase();

  for (const kw of keywords) {
    if (kw.length < 3) continue;
    if (english.includes(kw)) score += 6;
    if (tamil.includes(kw)) score += 6;
    if (transliteration.includes(kw)) score += 5;
    if (couplet.includes(kw)) score += 5;
    if (explanation.includes(kw)) score += 4;
    if (mv.includes(kw)) score += 3;
    if (sp.includes(kw)) score += 3;
    if (mk.includes(kw)) score += 3;
  }

  return score;
}

/**
 * Semantic tie-breaker using all text fields
 */
function semanticScore(kural: any, fullQuestion: string): number {
  let score = 0;
  const questionLower = fullQuestion.toLowerCase();

  const allText = [
    kural.Line1,
    kural.Line2,
    kural.Translation,
    kural.mv,
    kural.sp,
    kural.mk,
    kural.couplet,
    kural.explanation,
    kural.transliteration1,
    kural.transliteration2,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const questionWords = questionLower
    .replace(/[.,!?;:'"()\-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  for (const word of questionWords) {
    if (allText.includes(word)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Find best kural using keyword-based search
 */
async function findBestKural(keywords: string[], fullQuestion: string) {
  const queryString = keywords.join(' ');

  // If you have a tsvector column, adjust this; otherwise you can skip textSearch
  const { data: ftResults } = await supabase
    .from('Kurals-new')
    .select('*')
    .limit(50);

  if (ftResults && ftResults.length > 0) {
    const scored = (ftResults as any[]).map((k) => ({
      kural: k,
      score: scoreKural(k, keywords),
      semanticScore: 0,
    })).sort((a, b) => b.score - a.score);

    const topScore = scored[0].score;
    const topKurals = scored.filter((k) => k.score === topScore);

    if (topKurals.length > 1) {
      const tiebroken = topKurals
        .map((k) => ({
          ...k,
          semanticScore: semanticScore(k.kural, fullQuestion),
        }))
        .sort((a, b) => b.semanticScore - a.semanticScore);

      return transformKural(tiebroken[0].kural);
    }

    return transformKural(scored[0].kural);
  }

  const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
  if (all && all.length > 0) {
    const random = all[Math.floor(Math.random() * all.length)];
    return transformKural(random);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // PRIORITY 1: Direct kural number
    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) {
        return NextResponse.json({ kural, keywords: [`kural-${directNum}`] });
      }
    }

    // PRIORITY 2: Chapter-based query
    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) {
        return NextResponse.json({ kural, keywords: ['chapter-query'] });
      }
    }

    // PRIORITY 3: Predefined question mappings
    const predefinedKuralNum = await findPredefinedQuestion(message);
    if (predefinedKuralNum) {
      const kural = await getKuralByNumber(predefinedKuralNum);
      if (kural) {
        return NextResponse.json({ kural, keywords: ['predefined-match'] });
      }
    }

    // PRIORITY 4: Keyword-based search
    const keywords = extractKeywords(message);
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'Could not understand query. Please try again.' },
        { status: 400 }
      );
    }

    const kural = await findBestKural(keywords, message);
    if (!kural) {
      return NextResponse.json(
        { error: 'Could not find a matching Kural.' },
        { status: 500 }
      );
    }

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
