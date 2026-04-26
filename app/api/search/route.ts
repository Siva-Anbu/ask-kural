import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Enhanced Supabase client with service role key fallback
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

// Ordinal number mappings - English and Tamil
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

// Comprehensive synonym map
const SYNONYMS: Record<string, string[]> = {
  fear: ['afraid', 'scared', 'frightened', 'anxiety', 'worry', 'terror', 'dread'],
  afraid: ['fear', 'scared', 'frightened', 'anxiety', 'terrified'],
  scared: ['afraid', 'fear', 'frightened', 'anxiety', 'worried'],
  angry: ['anger', 'mad', 'rage', 'fury', 'irritated', 'furious'],
  anger: ['angry', 'mad', 'rage', 'fury', 'wrath'],
  sad: ['sadness', 'depressed', 'unhappy', 'sorrow', 'grief', 'melancholy'],
  sadness: ['sad', 'depressed', 'unhappy', 'sorrow', 'mourning'],
  happy: ['happiness', 'joy', 'cheerful', 'delighted', 'glad', 'joyful'],
  happiness: ['happy', 'joy', 'cheerful', 'delight', 'bliss'],
  love: ['loving', 'affection', 'care', 'devotion', 'adore'],
  lonely: ['alone', 'solitude', 'isolation', 'loneliness', 'isolated'],
  alone: ['lonely', 'solitude', 'isolation', 'solitary'],
  money: ['wealth', 'rich', 'riches', 'prosperity', 'finance', 'fortune'],
  wealth: ['money', 'rich', 'riches', 'prosperity', 'fortune'],
  rich: ['wealth', 'money', 'riches', 'prosperity', 'wealthy'],
  friend: ['friendship', 'companion', 'buddy', 'ally', 'comrade'],
  friendship: ['friend', 'companion', 'buddy', 'ally', 'camaraderie'],
  work: ['job', 'career', 'labor', 'effort', 'profession', 'occupation'],
  job: ['work', 'career', 'labor', 'profession', 'employment'],
  family: ['parents', 'children', 'relatives', 'household', 'kin'],
  parents: ['family', 'father', 'mother', 'guardian'],
  success: ['achievement', 'victory', 'accomplishment', 'win', 'triumph'],
  failure: ['fail', 'defeat', 'loss', 'setback', 'unsuccessful'],
  fail: ['failure', 'defeat', 'loss', 'unsuccessful'],
  god: ['divine', 'virtue', 'faith', 'spiritual', 'lord', 'deity'],
  virtue: ['god', 'righteousness', 'goodness', 'moral', 'integrity'],
  truth: ['honesty', 'truthfulness', 'sincerity', 'real', 'genuine'],
  patience: ['forbearance', 'tolerance', 'endurance', 'perseverance'],
  knowledge: ['wisdom', 'learning', 'education', 'understanding', 'insight'],
  wisdom: ['knowledge', 'learning', 'intelligence', 'insight', 'sagacity'],
  education: ['knowledge', 'learning', 'wisdom', 'study', 'schooling'],
  learning: ['knowledge', 'education', 'wisdom', 'study', 'studying'],
  trust: ['friendship', 'truth', 'loyalty', 'faith', 'confidence'],
  loyalty: ['trust', 'faithfulness', 'devotion', 'allegiance', 'fidelity'],
  respect: ['honor', 'regard', 'esteem', 'reverence', 'admiration'],
  honor: ['respect', 'dignity', 'integrity', 'nobility', 'esteem'],
  kindness: ['compassion', 'mercy', 'generosity', 'benevolence', 'goodwill'],
  compassion: ['kindness', 'mercy', 'sympathy', 'empathy', 'pity'],
  courage: ['bravery', 'valor', 'fearlessness', 'heroism', 'boldness'],
  bravery: ['courage', 'valor', 'fearlessness', 'heroism', 'gallantry'],
  humility: ['modesty', 'humble', 'simplicity', 'unpretentious', 'meekness'],
  modesty: ['humility', 'humble', 'simplicity', 'unassuming'],
  gratitude: ['thankful', 'appreciation', 'grateful', 'thanks'],
  thankful: ['gratitude', 'appreciation', 'grateful', 'appreciative'],
  jealousy: ['envy', 'jealous', 'resentment', 'covetousness'],
  envy: ['jealousy', 'jealous', 'covetousness', 'resentment'],
  greed: ['greedy', 'avarice', 'covetousness', 'desire', 'selfishness'],
  greedy: ['greed', 'avarice', 'covetousness', 'selfish'],
  pride: ['arrogance', 'ego', 'conceit', 'vanity', 'haughtiness'],
  arrogance: ['pride', 'ego', 'conceit', 'haughtiness', 'hubris'],
  prayer: ['god', 'virtue', 'faith', 'worship', 'devotion'],
};

/**
 * Check if the message is asking for a direct kural by number
 * Supports: "kural 1", "give me kural 500", "show 100", just "25", etc.
 */
function extractDirectKuralNumber(message: string): number | null {
  const lower = message.toLowerCase().trim();

  // Pattern 1: Just a number (1-1330)
  const justNumber = /^(\d{1,4})$/;
  const match1 = lower.match(justNumber);
  if (match1) {
    const num = parseInt(match1[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  // Pattern 2: "kural 123", "குறள் 123", "kuṟaḷ 123"
  const kuralPattern = /(?:kural|குறள்|kuṟaḷ)\s*[#:]?\s*(\d{1,4})/;
  const match2 = lower.match(kuralPattern);
  if (match2) {
    const num = parseInt(match2[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  // Pattern 3: "give me 123", "show 456", "number 789"
  const giveShowPattern = /(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/;
  const match3 = lower.match(giveShowPattern);
  if (match3) {
    const num = parseInt(match3[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  return null;
}

/**
 * Check if message is asking for nth kural of a chapter
 * Examples: "first kural of chapter 2", "third kural of second chapter"
 * Tamil: "இரண்டாவது அதிகாரத்தின் முதல் குறள்"
 */
function extractChapterKuralQuery(message: string): number | null {
  const lower = message.toLowerCase().trim();

  // Pattern 1: "first kural of chapter 5" or "1st kural of chapter 5"
  const enPattern1 = /(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|\d+(?:st|nd|rd|th)?)\s+(?:kural|குறள்)\s+(?:of|in)\s+(?:chapter|அதிகாரம்)\s+(\d{1,3})/i;
  const match1 = lower.match(enPattern1);
  if (match1) {
    const position = ORDINALS_EN[match1[1]] || parseInt(match1[1]);
    const chapterNum = parseInt(match1[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  // Pattern 2: "chapter 5 kural 3" or "chapter 5's 3rd kural"
  const enPattern2 = /(?:chapter|அதிகாரம்)\s+(\d{1,3})(?:'s)?\s+(?:kural|குறள்)?\s*(\d{1,2}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)/i;
  const match2 = lower.match(enPattern2);
  if (match2) {
    const chapterNum = parseInt(match2[1]);
    const position = ORDINALS_EN[match2[2]] || parseInt(match2[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  // Pattern 3: Tamil - "முதல் குறள் அதிகாரம் 5"
  const taPattern = /(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s+(?:குறள்|kural)?\s*(?:அதிகாரத்தின்|அதிகாரம்)?\s+(\d{1,3})/;
  const match3 = message.match(taPattern);
  if (match3) {
    const position = ORDINALS_TA[match3[1]];
    const chapterNum = parseInt(match3[2]);

    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  // Pattern 4: Tamil reverse - "அதிகாரம் 5 இன் முதல் குறள்"
  const taPattern2 = /(?:அதிகாரம்|chapter)\s+(\d{1,3})\s*(?:இன்|ன்|of)?\s*(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s*(?:குறள்)?/;
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
 * Get kural by direct number
 */
async function getKuralByNumber(num: number) {
  const { data, error } = await supabase
    .from('Kurals-new')
    .select('*')
    .eq('Number', num)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * ENHANCED: Calculate similarity between two strings (0-100%)
 * Now includes substring matching and bigram bonuses
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[.,!?;:'"()\-]/g, ' ').replace(/\s+/g, ' ');

  const text1 = normalize(str1);
  const text2 = normalize(str2);

  // Exact match
  if (text1 === text2) return 100;

  // Substring containment bonus
  if (text1.includes(text2) || text2.includes(text1)) return 85;

  const words1 = text1.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const words2 = text2.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (words1.length === 0 || words2.length === 0) return 0;

  let score = 0;

  // Word matching with partial match support
  for (const word of words1) {
    if (words2.includes(word)) {
      score += 10;
    } else {
      // Partial word match bonus
      for (const w2 of words2) {
        if (w2.includes(word) || word.includes(w2)) {
          score += 5;
          break;
        }
      }
    }
  }

  // Bigram matching for phrase detection
  const text1Words = text1.split(/\s+/);
  const text2Words = text2.split(/\s+/);
  for (let i = 0; i < text1Words.length - 1; i++) {
    const bigram = `${text1Words[i]} ${text1Words[i + 1]}`;
    if (text2.includes(bigram)) {
      score += 15;
    }
  }

  // Calculate percentage
  const maxPossibleScore = words1.length * 10 + (text1Words.length * 15);
  return Math.min(100, (score / maxPossibleScore) * 100);
}

/**
 * OPTIMIZED: Search the Questionare table for matching situations
 * Now fetches only top candidates instead of all rows
 */
async function searchQuestionare(message: string) {
  const keywords = extractKeywords(message);
  if (keywords.length === 0) return null;

  // OPTIMIZATION: Fetch only top 30 candidates using first keyword
  const { data: situations, error } = await supabase
    .from('Questionare')
    .select('*')
    .ilike('Situation', `%${keywords[0]}%`)
    .limit(30);

  if (error || !situations || situations.length === 0) {
    return null;
  }

  // Find the best matching situation
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const situation of situations) {
    const situationText = (situation.Situation as string) || '';
    const similarity = calculateSimilarity(message, situationText);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = situation;
    }
  }

  // Require at least 50% similarity to consider it a match
  if (!bestMatch || bestSimilarity < 50) {
    return null;
  }

  // Get all 3 kurals for this situation
  const kurals = [];

  if (bestMatch.Kural_1) {
    kurals.push({
      num: bestMatch.Kural_1,
      tamil1: bestMatch.Tamil1_1,
      tamil2: bestMatch.Tamil2_1,
      meaning: bestMatch.Meaning_1
    });
  }
  if (bestMatch.Kural_2) {
    kurals.push({
      num: bestMatch.Kural_2,
      tamil1: bestMatch.Tamil1_2,
      tamil2: bestMatch.Tamil2_2,
      meaning: bestMatch.Meaning_2
    });
  }
  if (bestMatch.Kural_3) {
    kurals.push({
      num: bestMatch.Kural_3,
      tamil1: bestMatch.Tamil1_3,
      tamil2: bestMatch.Tamil2_3,
      meaning: bestMatch.Meaning_3
    });
  }

  if (kurals.length === 0) {
    return null;
  }

  // Score each kural based on how well its meaning matches the user's message
  const keywordsLower = keywords.map(k => k.toLowerCase());
  let bestKural = null;
  let bestKuralScore = 0;

  for (const k of kurals) {
    let score = 0;
    const meaningLower = (k.meaning || '').toLowerCase();

    // Check how many keywords appear in the meaning
    for (const keyword of keywordsLower) {
      if (meaningLower.includes(keyword)) {
        score += 10;
      }
    }

    // Bonus for first kural (usually most relevant)
    if (k.num === bestMatch.Kural_1) {
      score += 5;
    }

    if (score > bestKuralScore) {
      bestKuralScore = score;
      bestKural = k;
    }
  }

  // If no kural scored well, return the first one
  if (!bestKural || bestKuralScore === 0) {
    bestKural = kurals[0];
  }

  // Fetch the full kural data
  const fullKural = await getKuralByNumber(bestKural.num);

  if (!fullKural) {
    return null;
  }

  return {
    kural: fullKural,
    matchedSituation: bestMatch.Situation,
    similarity: bestSimilarity
  };
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));

    // Stemming
    const stemmed = word
      .replace(/tion$|ing$|ness$|ment$|ful$|less$|ed$|ly$|er$|s$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

function scoreKural(kural: Record<string, unknown>, keywords: string[]): number {
  let score = 0;

  const line1 = ((kural.Line1 as string) || '').toLowerCase();
  const line2 = ((kural.Line2 as string) || '').toLowerCase();
  const translation = ((kural.Translation as string) || '').toLowerCase();
  const transliteration1 = ((kural.transliteration1 as string) || '').toLowerCase();
  const transliteration2 = ((kural.transliteration2 as string) || '').toLowerCase();
  const mv = ((kural.mv as string) || '').toLowerCase();
  const sp = ((kural.sp as string) || '').toLowerCase();
  const mk = ((kural.mk as string) || '').toLowerCase();
  const couplet = ((kural.couplet as string) || '').toLowerCase();
  const explanation = ((kural.explanation as string) || '').toLowerCase();

  for (const kw of keywords) {
    if (kw.length < 3) continue;

    // Weighted scoring by field importance
    if (translation.includes(kw)) score += 10;
    if (explanation.includes(kw)) score += 8;
    if (line1.includes(kw)) score += 7;
    if (line2.includes(kw)) score += 7;
    if (transliteration1.includes(kw)) score += 6;
    if (transliteration2.includes(kw)) score += 6;
    if (couplet.includes(kw)) score += 5;
    if (mv.includes(kw)) score += 4;
    if (sp.includes(kw)) score += 4;
    if (mk.includes(kw)) score += 4;
  }

  return score;
}

function semanticScore(kural: Record<string, unknown>, fullQuestion: string): number {
  let score = 0;
  const questionLower = fullQuestion.toLowerCase();

  const allText = [
    kural.Line1,
    kural.Line2,
    kural.Translation,
    kural.transliteration1,
    kural.transliteration2,
    kural.mv,
    kural.sp,
    kural.mk,
    kural.couplet,
    kural.explanation,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const questionWords = questionLower
    .replace(/[.,!?;:'"()\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  for (const word of questionWords) {
    if (allText.includes(word)) {
      score += 1;
    }
  }

  return score;
}

/**
 * OPTIMIZED: Keyword-based search with better deduplication
 */
async function findBestKural(keywords: string[], fullQuestion: string) {
  const searchResults: Record<string, unknown>[] = [];

  // Search in Translation field
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('Kurals-new')
      .select('*')
      .ilike('Translation', `%${kw}%`)
      .limit(30);

    if (data && data.length > 0) {
      searchResults.push(...data);
    }
  }

  // Search in explanation field
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('Kurals-new')
      .select('*')
      .ilike('explanation', `%${kw}%`)
      .limit(30);

    if (data && data.length > 0) {
      searchResults.push(...data);
    }
  }

  // Remove duplicates based on Number
  const uniqueResults = Array.from(
    new Map(searchResults.map(k => [k.Number, k])).values()
  );

  if (uniqueResults.length > 0) {
    const scored = uniqueResults
      .map(k => ({
        kural: k,
        score: scoreKural(k, keywords),
        semanticScore: 0
      }))
      .sort((a, b) => b.score - a.score);

    const topScore = scored[0].score;
    const topKurals = scored.filter(k => k.score === topScore);

    // Tiebreaker using semantic scoring
    if (topKurals.length > 1) {
      const tiebroken = topKurals
        .map(k => ({
          ...k,
          semanticScore: semanticScore(k.kural, fullQuestion)
        }))
        .sort((a, b) => b.semanticScore - a.semanticScore);

      return tiebroken[0].kural;
    }

    return scored[0].kural;
  }

  // Fallback: return a random kural
  const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return null;
}

/**
 * NEW: Generate confidence message based on match type and quality
 */
function getConfidenceMessage(source: string, similarity?: number): string {
  if (source === 'direct' || source === 'chapter') {
    return ''; // No qualifier needed for exact matches
  }

  if (source === 'questionare') {
    if (similarity && similarity >= 80) {
      return "Here's a kural that closely matches your situation:";
    } else if (similarity && similarity >= 65) {
      return "Here's a kural that might resonate with your situation:";
    } else {
      return "Here's a kural that may offer perspective on your situation:";
    }
  }

  // For keyword-based matches
  return "Here's a kural that might resonate:";
}

/**
 * NEW: Determine confidence level
 */
function getConfidenceLevel(source: string, similarity?: number): 'high' | 'medium' | 'low' {
  if (source === 'direct' || source === 'chapter') {
    return 'high';
  }

  if (source === 'questionare' && similarity) {
    if (similarity >= 80) return 'high';
    if (similarity >= 65) return 'medium';
    return 'low';
  }

  return 'medium';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let source = 'keyword';
    let similarity: number | undefined;

    // PRIORITY 1: Direct kural number query
    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) {
        source = 'direct';
        const confidenceMessage = getConfidenceMessage(source);
        const confidence = getConfidenceLevel(source);

        return NextResponse.json({
          kural,
          keywords: [`kural-${directNum}`],
          source,
          confidence,
          confidenceMessage
        });
      }
    }

    // PRIORITY 2: Chapter-based query
    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) {
        source = 'chapter';
        const confidenceMessage = getConfidenceMessage(source);
        const confidence = getConfidenceLevel(source);

        return NextResponse.json({
          kural,
          keywords: ['chapter-query'],
          source,
          confidence,
          confidenceMessage
        });
      }
    }

    // PRIORITY 3: Questionare table matching
    const questionareResult = await searchQuestionare(message);
    if (questionareResult) {
      source = 'questionare';
      similarity = questionareResult.similarity;
      const confidenceMessage = getConfidenceMessage(source, similarity);
      const confidence = getConfidenceLevel(source, similarity);

      return NextResponse.json({
        kural: questionareResult.kural,
        keywords: ['situation-match'],
        matchedSituation: questionareResult.matchedSituation,
        source,
        similarity,
        confidence,
        confidenceMessage
      });
    }

    // PRIORITY 4: Keyword-based search
    const keywords = extractKeywords(message);
    if (keywords.length === 0) {
      return NextResponse.json({
        error: 'Could not understand query. Please try again.'
      }, { status: 400 });
    }

    const kural = await findBestKural(keywords, message);
    if (!kural) {
      return NextResponse.json({
        error: 'Could not find a matching Kural.'
      }, { status: 500 });
    }

    const displayKeywords = message
      .toLowerCase()
      .replace(/[.,!?;:'"()\-]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w))
      .slice(0, 5);

    source = 'keyword';
    const confidenceMessage = getConfidenceMessage(source);
    const confidence = getConfidenceLevel(source);

    return NextResponse.json({
      kural,
      keywords: displayKeywords,
      source,
      confidence,
      confidenceMessage
    });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}