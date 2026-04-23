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
  'kural','kuṟaḷ','குறள்','chapter','adhikaram','அதிகாரம்','give','show','tell',
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
  // [Previous synonyms remain the same - truncated for brevity]
  god: ['god','virtue','faith'],
  prayer: ['god','virtue','faith'],
  // ... (keep all existing synonyms)
  trust: ['friendship','truth','loyalty'],
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
  
  // Pattern 3: Tamil - "இரண்டாவது அதிகாரத்தின் முதல் குறள்"
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
 * Calculate similarity between two strings (0-100%)
 * Simple word overlap percentage
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:'"()\-]/g, ' ');
  
  const text1 = normalize(str1);
  const text2 = normalize(str2);
  
  // Exact match
  if (text1 === text2) return 100;
  
  const words1 = text1.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const words2 = text2.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      matches++;
    }
  }
  
  // Calculate percentage based on the shorter list
  const percentage = (matches / Math.min(words1.length, words2.length)) * 100;
  return percentage;
}

/**
 * Search the Questionare table for matching situations
 * Returns the best matching kural if found, null otherwise
 */
async function searchQuestionare(message: string) {
  // Fetch all situations from Questionare table
  const { data: situations, error } = await supabase
    .from('Questionare')
    .select('*');
  
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
  const keywords = extractKeywords(message);
  let bestKural = null;
  let bestKuralScore = 0;
  
  for (const k of kurals) {
    let score = 0;
    const meaningLower = (k.meaning || '').toLowerCase();
    
    // Check how many keywords appear in the meaning
    for (const keyword of keywords) {
      if (meaningLower.includes(keyword)) {
        score += 10;
      }
    }
    
    // Also give some base score to the first kural (it's usually most relevant)
    if (k.num === bestMatch.Kural_1) {
      score += 5;
    }
    
    if (score > bestKuralScore) {
      bestKuralScore = score;
      bestKural = k;
    }
  }
  
  // If no kural scored well, just return the first one
  if (!bestKural || bestKuralScore === 0) {
    bestKural = kurals[0];
  }
  
  // Fetch the full kural data from the Kurals-new table
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

  // New table structure - updated column names
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
    
    // Primary matches in translation and explanation
    if (translation.includes(kw)) score += 10;
    if (explanation.includes(kw)) score += 8;
    
    // Tamil text matches
    if (line1.includes(kw)) score += 7;
    if (line2.includes(kw)) score += 7;
    
    // Transliteration matches
    if (transliteration1.includes(kw)) score += 6;
    if (transliteration2.includes(kw)) score += 6;
    
    // Couplet and commentary matches
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

async function findBestKural(keywords: string[], fullQuestion: string) {
  // Since the new table doesn't have search_vector or themes columns,
  // we'll use a simpler search strategy with ilike on Translation and explanation fields
  
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

  // Fallback: return a random kural if no matches found
  const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // PRIORITY 1: Check for direct kural number query
    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) {
        return NextResponse.json({ kural, keywords: [`kural-${directNum}`] });
      }
    }

    // PRIORITY 2: Check for chapter-based query
    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) {
        return NextResponse.json({ kural, keywords: [`chapter-query`] });
      }
    }

    // PRIORITY 3: Check for matching situations in Questionare table
    const questionareResult = await searchQuestionare(message);
    if (questionareResult) {
      return NextResponse.json({ 
        kural: questionareResult.kural, 
        keywords: ['situation-match'],
        matchedSituation: questionareResult.matchedSituation,
        source: 'questionare'
      });
    }

    // PRIORITY 4: Regular keyword-based search
    const keywords = extractKeywords(message);
    if (keywords.length === 0) {
      return NextResponse.json({ error: 'Could not understand query. Please try again.' }, { status: 400 });
    }

    const kural = await findBestKural(keywords, message);
    if (!kural) {
      return NextResponse.json({ error: 'Could not find a matching Kural.' }, { status: 500 });
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
