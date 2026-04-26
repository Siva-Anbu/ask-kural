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

// Ordinal number mappings
const ORDINALS_EN: Record<string, number> = {
  'first': 1, '1st': 1, 'second': 2, '2nd': 2, 'third': 3, '3rd': 3,
  'fourth': 4, '4th': 4, 'fifth': 5, '5th': 5, 'sixth': 6, '6th': 6,
  'seventh': 7, '7th': 7, 'eighth': 8, '8th': 8, 'ninth': 9, '9th': 9,
  'tenth': 10, '10th': 10, 'last': 10,
};

const ORDINALS_TA: Record<string, number> = {
  'முதல்': 1, 'முதலாவது': 1, 'ஒன்றாம்': 1, 'ஒன்றாவது': 1,
  'இரண்டாம்': 2, 'இரண்டாவது': 2, 'மூன்றாம்': 3, 'மூன்றாவது': 3,
  'நான்காம்': 4, 'நான்காவது': 4, 'ஐந்தாம்': 5, 'ஐந்தாவது': 5,
  'ஆறாம்': 6, 'ஆறாவது': 6, 'ஏழாம்': 7, 'ஏழாவது': 7,
  'எட்டாம்': 8, 'எட்டாவது': 8, 'ஒன்பதாம்': 9, 'ஒன்பதாவது': 9,
  'பத்தாம்': 10, 'பத்தாவது': 10, 'கடைசி': 10,
};

// Enhanced synonym map with Tamil translations
const SYNONYMS: Record<string, string[]> = {
  fear: ['afraid', 'scared', 'frightened', 'anxiety', 'worry', 'terror', 'dread', 'அச்சம்', 'பயம்'],
  afraid: ['fear', 'scared', 'frightened', 'anxiety', 'terrified', 'பயம்', 'அச்சம்'],
  scared: ['afraid', 'fear', 'frightened', 'anxiety', 'worried', 'பயம்'],
  angry: ['anger', 'mad', 'rage', 'fury', 'irritated', 'furious', 'கோபம்', 'சினம்'],
  anger: ['angry', 'mad', 'rage', 'fury', 'wrath', 'கோபம்', 'சினம்'],
  sad: ['sadness', 'depressed', 'unhappy', 'sorrow', 'grief', 'melancholy', 'துக்கம்', 'வருத்தம்'],
  sadness: ['sad', 'depressed', 'unhappy', 'sorrow', 'mourning', 'துக்கம்'],
  happy: ['happiness', 'joy', 'cheerful', 'delighted', 'glad', 'joyful', 'மகிழ்ச்சி', 'இன்பம்'],
  happiness: ['happy', 'joy', 'cheerful', 'delight', 'bliss', 'மகிழ்ச்சி'],
  love: ['loving', 'affection', 'care', 'devotion', 'adore', 'காதல்', 'அன்பு', 'காமம்'],
  loving: ['love', 'affection', 'care', 'devotion', 'காதல்', 'அன்பு'],
  lonely: ['alone', 'solitude', 'isolation', 'loneliness', 'isolated', 'தனிமை'],
  alone: ['lonely', 'solitude', 'isolation', 'solitary', 'தனிமை'],
  money: ['wealth', 'rich', 'riches', 'prosperity', 'finance', 'fortune', 'செல்வம்', 'பொருள்'],
  wealth: ['money', 'rich', 'riches', 'prosperity', 'fortune', 'செல்வம்'],
  rich: ['wealth', 'money', 'riches', 'prosperity', 'wealthy', 'செல்வம்'],
  friend: ['friendship', 'companion', 'buddy', 'ally', 'comrade', 'நட்பு', 'தோழன்'],
  friendship: ['friend', 'companion', 'buddy', 'ally', 'camaraderie', 'நட்பு'],
  work: ['job', 'career', 'labor', 'effort', 'profession', 'occupation', 'வேலை', 'தொழில்'],
  job: ['work', 'career', 'labor', 'profession', 'employment', 'வேலை'],
  family: ['parents', 'children', 'relatives', 'household', 'kin', 'குடும்பம்'],
  parents: ['family', 'father', 'mother', 'guardian', 'பெற்றோர்'],
  success: ['achievement', 'victory', 'accomplishment', 'win', 'triumph', 'வெற்றி'],
  failure: ['fail', 'defeat', 'loss', 'setback', 'unsuccessful', 'தோல்வி'],
  fail: ['failure', 'defeat', 'loss', 'unsuccessful', 'தோல்வி'],
  failed: ['failure', 'fail', 'defeat', 'loss', 'தோல்வி'],
  god: ['divine', 'virtue', 'faith', 'spiritual', 'lord', 'deity', 'கடவுள்', 'இறை'],
  virtue: ['god', 'righteousness', 'goodness', 'moral', 'integrity', 'அறம்'],
  truth: ['honesty', 'truthfulness', 'sincerity', 'real', 'genuine', 'உண்மை'],
  patience: ['forbearance', 'tolerance', 'endurance', 'perseverance', 'பொறுமை'],
  knowledge: ['wisdom', 'learning', 'education', 'understanding', 'insight', 'அறிவு', 'கல்வி'],
  wisdom: ['knowledge', 'learning', 'intelligence', 'insight', 'sagacity', 'அறிவு'],
  education: ['knowledge', 'learning', 'wisdom', 'study', 'schooling', 'கல்வி'],
  learning: ['knowledge', 'education', 'wisdom', 'study', 'studying', 'கல்வி'],
  trust: ['friendship', 'truth', 'loyalty', 'faith', 'confidence', 'நம்பிக்கை'],
  loyalty: ['trust', 'faithfulness', 'devotion', 'allegiance', 'fidelity', 'உண்மை'],
  respect: ['honor', 'regard', 'esteem', 'reverence', 'admiration', 'மரியாதை'],
  honor: ['respect', 'dignity', 'integrity', 'nobility', 'esteem', 'மரியாதை'],
  kindness: ['compassion', 'mercy', 'generosity', 'benevolence', 'goodwill', 'கருணை'],
  compassion: ['kindness', 'mercy', 'sympathy', 'empathy', 'pity', 'கருணை', 'இரக்கம்'],
  courage: ['bravery', 'valor', 'fearlessness', 'heroism', 'boldness', 'தைரியம்'],
  bravery: ['courage', 'valor', 'fearlessness', 'heroism', 'gallantry', 'தைரியம்'],
  humility: ['modesty', 'humble', 'simplicity', 'unpretentious', 'meekness', 'பணிவு'],
  modesty: ['humility', 'humble', 'simplicity', 'unassuming', 'பணிவு'],
  gratitude: ['thankful', 'appreciation', 'grateful', 'thanks', 'நன்றி'],
  thankful: ['gratitude', 'appreciation', 'grateful', 'appreciative', 'நன்றி'],
  jealousy: ['envy', 'jealous', 'resentment', 'covetousness', 'பொறாமை'],
  envy: ['jealousy', 'jealous', 'covetousness', 'resentment', 'பொறாமை'],
  greed: ['greedy', 'avarice', 'covetousness', 'desire', 'selfishness', 'பேராசை'],
  greedy: ['greed', 'avarice', 'covetousness', 'selfish', 'பேராசை'],
  pride: ['arrogance', 'ego', 'conceit', 'vanity', 'haughtiness', 'செருக்கு'],
  arrogance: ['pride', 'ego', 'conceit', 'haughtiness', 'hubris', 'செருக்கு'],
  prayer: ['god', 'virtue', 'faith', 'worship', 'devotion', 'பிரார்த்தனை'],
};

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

  const giveShowPattern = /(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/;
  const match3 = lower.match(giveShowPattern);
  if (match3) {
    const num = parseInt(match3[1]);
    if (num >= 1 && num <= 1330) return num;
  }

  return null;
}

function extractChapterKuralQuery(message: string): number | null {
  const lower = message.toLowerCase().trim();

  const enPattern1 = /(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|\d+(?:st|nd|rd|th)?)\s+(?:kural|குறள்)\s+(?:of|in)\s+(?:chapter|அதிகாரம்)\s+(\d{1,3})/i;
  const match1 = lower.match(enPattern1);
  if (match1) {
    const position = ORDINALS_EN[match1[1]] || parseInt(match1[1]);
    const chapterNum = parseInt(match1[2]);
    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  const enPattern2 = /(?:chapter|அதிகாரம்)\s+(\d{1,3})(?:'s)?\s+(?:kural|குறள்)?\s*(\d{1,2}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)/i;
  const match2 = lower.match(enPattern2);
  if (match2) {
    const chapterNum = parseInt(match2[1]);
    const position = ORDINALS_EN[match2[2]] || parseInt(match2[2]);
    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

  const taPattern = /(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s+(?:குறள்|kural)?\s*(?:அதிகாரத்தின்|அதிகாரம்)?\s+(\d{1,3})/;
  const match3 = message.match(taPattern);
  if (match3) {
    const position = ORDINALS_TA[match3[1]];
    const chapterNum = parseInt(match3[2]);
    if (chapterNum >= 1 && chapterNum <= 133 && position >= 1 && position <= 10) {
      return (chapterNum - 1) * 10 + position;
    }
  }

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

async function getKuralByNumber(num: number) {
  const { data, error } = await supabase
    .from('Kurals-new')
    .select('*')
    .eq('Number', num)
    .single();
  if (error || !data) return null;
  return data;
}

function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[.,!?;:'"()\-]/g, ' ').replace(/\s+/g, ' ');

  const text1 = normalize(str1);
  const text2 = normalize(str2);

  if (text1 === text2) return 100;
  if (text1.includes(text2) || text2.includes(text1)) return 85;

  const words1 = text1.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const words2 = text2.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  if (words1.length === 0 || words2.length === 0) return 0;

  let score = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      score += 10;
    } else {
      for (const w2 of words2) {
        if (w2.includes(word) || word.includes(w2)) {
          score += 5;
          break;
        }
      }
    }
  }

  const text1Words = text1.split(/\s+/);
  const text2Words = text2.split(/\s+/);
  for (let i = 0; i < text1Words.length - 1; i++) {
    const bigram = `${text1Words[i]} ${text1Words[i + 1]}`;
    if (text2.includes(bigram)) {
      score += 15;
    }
  }

  const maxPossibleScore = words1.length * 10 + (text1Words.length * 15);
  return Math.min(100, (score / maxPossibleScore) * 100);
}

async function searchQuestionare(message: string) {
  const keywords = extractKeywords(message);
  if (keywords.length === 0) return null;

  const { data: situations, error } = await supabase
    .from('Questionare')
    .select('*')
    .ilike('Situation', `%${keywords[0]}%`)
    .limit(30);

  if (error || !situations || situations.length === 0) {
    return null;
  }

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

  if (!bestMatch || bestSimilarity < 50) {
    return null;
  }

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

  const keywordsLower = keywords.map(k => k.toLowerCase());
  let bestKural = null;
  let bestKuralScore = 0;

  for (const k of kurals) {
    let score = 0;
    const meaningLower = (k.meaning || '').toLowerCase();

    for (const keyword of keywordsLower) {
      if (meaningLower.includes(keyword)) {
        score += 10;
      }
    }

    if (k.num === bestMatch.Kural_1) {
      score += 5;
    }

    if (score > bestKuralScore) {
      bestKuralScore = score;
      bestKural = k;
    }
  }

  if (!bestKural || bestKuralScore === 0) {
    bestKural = kurals[0];
  }

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

    const stemmed = word.replace(/tion$|ing$|ness$|ment$|ful$|less$|ed$|ly$|er$|s$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

/**
 * NEW: Multi-keyword scoring - counts how many keywords appear in the kural
 */
function scoreKuralByKeywordCount(kural: Record<string, unknown>, keywords: string[]): number {
  let matchedKeywords = 0;
  const keywordsLower = keywords.map(k => k.toLowerCase());

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

  for (const kw of keywordsLower) {
    if (kw.length < 3) continue;
    if (allText.includes(kw)) {
      matchedKeywords++;
    }
  }

  return matchedKeywords;
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
 * ENHANCED: Find best kural using multi-keyword matching
 */
async function findBestKural(keywords: string[], fullQuestion: string) {
  const searchResults: Record<string, unknown>[] = [];

  // Search in Translation and explanation fields
  for (const kw of keywords.slice(0, 10)) { // Increased from 5 to 10 keywords
    const { data } = await supabase
      .from('Kurals-new')
      .select('*')
      .or(`Translation.ilike.%${kw}%,explanation.ilike.%${kw}%,Line1.ilike.%${kw}%,Line2.ilike.%${kw}%`)
      .limit(50);

    if (data && data.length > 0) {
      searchResults.push(...data);
    }
  }

  // Remove duplicates
  const uniqueResults = Array.from(
    new Map(searchResults.map(k => [k.Number, k])).values()
  );

  if (uniqueResults.length > 0) {
    // NEW: First sort by keyword count (how many keywords matched)
    const scoredByKeywordCount = uniqueResults
      .map(k => ({
        kural: k,
        keywordCount: scoreKuralByKeywordCount(k, keywords),
        weightedScore: scoreKural(k, keywords),
        semanticScore: 0
      }))
      .filter(k => k.keywordCount > 0) // Only keep kurals that matched at least 1 keyword
      .sort((a, b) => {
        // Primary sort: keyword count (more keywords = better)
        if (b.keywordCount !== a.keywordCount) {
          return b.keywordCount - a.keywordCount;
        }
        // Secondary sort: weighted score
        return b.weightedScore - a.weightedScore;
      });

    if (scoredByKeywordCount.length === 0) {
      // Fallback: random kural
      const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
      if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
      return null;
    }

    // Get top candidates (all with same keyword count as the best)
    const topKeywordCount = scoredByKeywordCount[0].keywordCount;
    const topCandidates = scoredByKeywordCount.filter(k => k.keywordCount === topKeywordCount);

    // If multiple kurals matched the same number of keywords, use semantic tiebreaker
    if (topCandidates.length > 1) {
      const tiebroken = topCandidates
        .map(k => ({
          ...k,
          semanticScore: semanticScore(k.kural, fullQuestion)
        }))
        .sort((a, b) => b.semanticScore - a.semanticScore);

      return tiebroken[0].kural;
    }

    return scoredByKeywordCount[0].kural;
  }

  // Fallback
  const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return null;
}

function getConfidenceMessage(source: string, similarity?: number, keywordCount?: number): string {
  if (source === 'direct' || source === 'chapter') {
    return '';
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
  if (keywordCount && keywordCount >= 3) {
    return "Here's a kural that closely relates to your query:";
  } else if (keywordCount && keywordCount >= 2) {
    return "Here's a kural that might resonate:";
  } else {
    return "This may be the kural for your input:";
  }
}

function getConfidenceLevel(source: string, similarity?: number, keywordCount?: number): 'high' | 'medium' | 'low' {
  if (source === 'direct' || source === 'chapter') {
    return 'high';
  }

  if (source === 'questionare' && similarity) {
    if (similarity >= 80) return 'high';
    if (similarity >= 65) return 'medium';
    return 'low';
  }

  if (keywordCount) {
    if (keywordCount >= 3) return 'high';
    if (keywordCount >= 2) return 'medium';
    return 'low';
  }

  return 'low';
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let source = 'keyword';
    let similarity: number | undefined;
    let keywordCount: number | undefined;

    // PRIORITY 1: Direct kural number
    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) {
        source = 'direct';
        return NextResponse.json({
          kural,
          keywords: [`kural-${directNum}`],
          source,
          confidence: 'high',
          confidenceMessage: ''
        });
      }
    }

    // PRIORITY 2: Chapter-based query
    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) {
        source = 'chapter';
        return NextResponse.json({
          kural,
          keywords: ['chapter-query'],
          source,
          confidence: 'high',
          confidenceMessage: ''
        });
      }
    }

    // PRIORITY 3: Questionare
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

    // PRIORITY 4: Keyword-based search with multi-keyword matching
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

    // Calculate how many original keywords matched
    keywordCount = scoreKuralByKeywordCount(kural, keywords);

    const displayKeywords = message
      .toLowerCase()
      .replace(/[.,!?;:'"()\-]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w))
      .slice(0, 5);

    source = 'keyword';
    const confidenceMessage = getConfidenceMessage(source, undefined, keywordCount);
    const confidence = getConfidenceLevel(source, undefined, keywordCount);

    return NextResponse.json({
      kural,
      keywords: displayKeywords,
      source,
      confidence,
      confidenceMessage,
      keywordCount
    });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}