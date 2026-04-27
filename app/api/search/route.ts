import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Minimal stop words - only removing Kural-specific and command words
const MINIMAL_STOP_WORDS = new Set([
  'kural', 'kuṟaḷ', 'குறள்', 'chapter', 'adhikaram', 'அதிகாரம்',
]);

// Keep original stop words for keyword search fallback only
const KEYWORD_SEARCH_STOP_WORDS = new Set([
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

// ✅ FIXED: Theme keywords are what users type - these are the searchable terms
const THIRUKKURAL_THEMES: Record<string, string[]> = {
  'heartbreak': ['பிரிவு', 'separation', 'pallor', 'பசலை', 'longing', 'pine', 'sorrow', 'grief', 'heartbreak', 'broken heart'],
  'failed_love': ['பிரிவு', 'separation', 'lost', 'pain', 'துக்கம்', 'பசலை', 'sallow', 'failed love', 'love failed'],
  'breakup': ['பிரிவு', 'separation', 'apart', 'left', 'gone', 'நோய்', 'anguish', 'breakup', 'broke up'],
  'missing_lover': ['நினைவு', 'remember', 'absence', 'தனிமை', 'longing', 'yearn', 'embrace', 'miss', 'missing'],
  'unrequited_love': ['காதல்', 'love', 'rejection', 'pain', 'sorrow', 'நோய்', 'unrequited', 'one-sided'],
  'betrayed_love': ['நம்பிக்கை', 'trust', 'betrayal', 'broken', 'deceit', 'வஞ்சம்', 'cheated', 'betrayed'],
  'lost_job': ['தொழில்', 'வேலை', 'unemployment', 'வறுமை', 'poverty', 'struggle', 'hardship', 'job loss', 'fired', 'laid off'],
  'career_failure': ['தோல்வி', 'setback', 'failure', 'perseverance', 'பொறுமை', 'effort', 'career', 'professional'],
  'work_stress': ['வேலை', 'pressure', 'burden', 'தொழில்', 'struggle', 'fatigue', 'stress', 'overwhelmed'],
  'no_job': ['வேலை', 'தொழில்', 'unemployment', 'search', 'opportunity', 'வறுமை', 'jobless', 'unemployed'],
  'business_loss': ['செல்வம்', 'wealth', 'loss', 'தோல்வி', 'bankruptcy', 'வறுமை', 'business', 'financial loss'],
  'parent_conflict': ['பெற்றோர்', 'மரியாதை', 'respect', 'duty', 'கடமை', 'honor', 'அறம்', 'parents', 'family conflict'],
  'father_fight': ['பெற்றோர்', 'அப்பா', 'father', 'மரியாதை', 'respect', 'அறம்', 'dad', 'father argument'],
  'mother_issue': ['பெற்றோர்', 'அம்மா', 'mother', 'மரியாதை', 'care', 'அன்பு', 'mom', 'mother problem'],
  'family_betrayal': ['நட்பு', 'trust', 'நம்பிக்கை', 'broken', 'குடும்பம்', 'relatives', 'family', 'betrayal'],
  'sibling_rivalry': ['குடும்பம்', 'family', 'jealousy', 'பொறாமை', 'conflict', 'sibling', 'brother', 'sister'],
  'anger_control': ['கோபம்', 'சினம்', 'patience', 'பொறுமை', 'calm', 'self-control', 'அடக்கம்', 'anger', 'rage', 'mad'],
  'loneliness': ['தனிமை', 'solitude', 'அன்பு', 'companionship', 'alone', 'isolated', 'lonely', 'isolated'],
  'depression': ['துக்கம்', 'sorrow', 'sadness', 'grief', 'despair', 'hopeless', 'depressed', 'low', 'down'],
  'anxiety': ['அச்சம்', 'பயம்', 'fear', 'worry', 'nervous', 'dread', 'anxious', 'worried', 'panic'],
  'grief': ['துக்கம்', 'sorrow', 'அழுகை', 'loss', 'mourning', 'pain', 'grief', 'bereavement'],
  'jealousy': ['பொறாமை', 'envy', 'resentment', 'covet', 'jealous', 'envious'],
  'pride_ego': ['செருக்கு', 'arrogance', 'ego', 'vanity', 'conceit', 'pride', 'arrogant'],
  'shame': ['நாணம்', 'embarrassment', 'disgrace', 'humiliation', 'shame', 'ashamed'],
  'faith_crisis': ['கடவுள்', 'இறை', 'virtue', 'அறம்', 'doubt', 'belief', 'faith', 'spiritual crisis'],
  'life_purpose': ['அறம்', 'dharma', 'duty', 'கடமை', 'meaning', 'purpose', 'life goal', 'why live'],
  'lost_direction': ['வழி', 'path', 'direction', 'purpose', 'கடமை', 'confused', 'lost', 'no direction'],
  'moral_dilemma': ['அறம்', 'virtue', 'right', 'wrong', 'ethics', 'நீதி', 'moral', 'ethical', 'dilemma'],
  'procrastination': ['சோம்பல்', 'lazy', 'delay', 'postpone', 'effort', 'முயற்சி', 'procrastinate', 'putting off'],
  'failure_feeling': ['தோல்வி', 'failure', 'defeat', 'worthless', 'shame', 'failed', 'defeated'],
  'betrayed_friend': ['நட்பு', 'friendship', 'நம்பிக்கை', 'trust', 'betrayal', 'வஞ்சம்', 'friend betrayed'],
  'trust_broken': ['நம்பிக்கை', 'trust', 'betrayal', 'deceit', 'வஞ்சம்', 'broken', 'trust broken'],
  'insult': ['அவமானம்', 'insult', 'disgrace', 'humiliation', 'shame', 'நாணம்', 'insulted', 'disrespected'],
  'poverty': ['வறுமை', 'poor', 'poverty', 'struggle', 'hardship', 'செல்வம்', 'broke', 'no money'],
  'greed': ['பேராசை', 'greedy', 'avarice', 'covet', 'desire', 'greed', 'greedy'],
  'debt': ['கடன்', 'debt', 'owe', 'burden', 'வறுமை', 'debt', 'owing money'],
  'illness': ['நோய்', 'sick', 'disease', 'pain', 'suffering', 'health', 'ill', 'sick', 'disease'],
  'physical_pain': ['வலி', 'pain', 'ache', 'suffer', 'நோய்', 'hurt', 'ache', 'painful'],
  'death_grief': ['இறப்பு', 'death', 'died', 'மரணம்', 'loss', 'துக்கம்', 'death', 'passed away', 'lost someone'],
  'gossip_rumor': ['புகழ்', 'reputation', 'rumor', 'gossip', 'slander', 'gossip', 'rumor', 'talked about'],
  'public_shame': ['அவமானம்', 'shame', 'disgrace', 'public', 'humiliation', 'public shame', 'embarrassed publicly'],
  'false_accusation': ['பொய்', 'false', 'lie', 'accusation', 'slander', 'falsely accused', 'wrongly blamed'],
  'lying_truth': ['பொய்', 'lie', 'lying', 'false', 'falsehood', 'truth', 'உண்மை', 'honest', 'honesty', 'deceit', 'deceive', 'lie', 'lying', 'truth'],
};

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
  losing: ['loss', 'lost', 'lose', 'missing', 'gone'],
  loss: ['losing', 'lost', 'lose', 'missing', 'gone'],
  people: ['person', 'individuals', 'folks', 'humans', 'மக்கள்'],
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
  lie: ['lying', 'false', 'falsehood', 'dishonest', 'deceit', 'untruth', 'பொய்'],
  lying: ['lie', 'false', 'falsehood', 'dishonest', 'பொய்', 'deceit'],
  honest: ['honesty', 'truth', 'truthful', 'sincere', 'genuine', 'உண்மை'],
  honesty: ['honest', 'truth', 'truthful', 'sincere', 'உண்மை'],
};

// ✅ FIXED: Extract kural number from message
function extractDirectKuralNumber(message: string): number | null {
  const lower = message.toLowerCase().trim();
  const justNumber = /^(\d{1,4})$/;
  const match1 = lower.match(justNumber);
  if (match1) {
    const num = parseInt(match1[1]);
    if (num >= 1 && num <= 1330) return num;
  }
  const kuralPattern = /(?:kural|குறள்|kuṟaḷ)\s*[#:]?\s*(\d{1,4})/i;
  const match2 = lower.match(kuralPattern);
  if (match2) {
    const num = parseInt(match2[1]);
    if (num >= 1 && num <= 1330) return num;
  }
  const giveShowPattern = /(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/i;
  const match3 = lower.match(giveShowPattern);
  if (match3) {
    const num = parseInt(match3[1]);
    if (num >= 1 && num <= 1330) return num;
  }
  return null;
}

// ✅ FIXED: Extract chapter + position query
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

// ✅ IMPROVED: Better similarity calculation with field weights
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[.,!?;:'"()\-]/g, ' ').replace(/\s+/g, ' ');
  const text1 = normalize(str1);
  const text2 = normalize(str2);
  if (text1 === text2) return 100;
  if (text1.includes(text2) || text2.includes(text1)) return 85;

  const words1 = text1.split(/\s+/).filter(w => w.length > 2 && !MINIMAL_STOP_WORDS.has(w));
  const words2 = text2.split(/\s+/).filter(w => w.length > 2 && !MINIMAL_STOP_WORDS.has(w));
  if (words1.length === 0 || words2.length === 0) return 0;

  let score = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      score += 12; // Higher weight for exact matches
    } else {
      for (const w2 of words2) {
        if (w2.includes(word) || word.includes(w2)) {
          score += 6;
          break;
        }
      }
    }
  }

  // Bigram matching for phrase similarity
  const text1Words = text1.split(/\s+/);
  const text2Words = text2.split(/\s+/);
  for (let i = 0; i < text1Words.length - 1; i++) {
    const bigram = `${text1Words[i]} ${text1Words[i + 1]}`;
    if (text2.includes(bigram)) {
      score += 18; // Higher weight for phrase matches
    }
  }

  const maxPossibleScore = words1.length * 12 + (text1Words.length * 18);
  return Math.min(100, (score / maxPossibleScore) * 100);
}

// ✅ NEW: Multi-field similarity for Questionare matching
function calculateMultiFieldSimilarity(query: string, situation: any): number {
  const weights: Record<string, number> = {
    Situation: 1.0,
    Keywords: 0.7,
    Theme: 0.5
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [field, weight] of Object.entries(weights)) {
    if (situation[field] && typeof situation[field] === 'string') {
      const sim = calculateSimilarity(query, situation[field]);
      totalScore += sim * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// ✅ FIXED: Extract keywords with minimal stop words for Questionare
function extractQuestionareKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !MINIMAL_STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));
  }

  return Array.from(expanded);
}

// ✅ IMPROVED: Better Questionare search with lower threshold and multi-field scoring
async function searchQuestionare(message: string) {
  const keywords = extractQuestionareKeywords(message);
  if (keywords.length === 0) return null;

  // Use top 15 keywords for broader matching
  const searchKeywords = keywords.slice(0, 15);

  const { data: situations, error } = await supabase
    .from('Questionare')
    .select('*')
    .or(searchKeywords.map(kw => `Situation.ilike.%${kw}%`).join(','))
    .limit(100); // Increased limit for better recall

  if (error || !situations || situations.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const situation of situations) {
    const score = calculateMultiFieldSimilarity(message, situation);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = situation;
    }
  }

  // Lowered threshold to 30 for better recall, but require at least 1 keyword match
  if (!bestMatch || bestScore < 30) {
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
      score += 5; // Prefer first kural in situation
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
    similarity: bestScore
  };
}

// ✅ FIXED: Match theme KEYWORDS against message, not theme names
function detectThemes(message: string): string[] {
  const messageLower = message.toLowerCase();
  const detectedThemes: string[] = [];

  for (const [theme, keywords] of Object.entries(THIRUKKURAL_THEMES)) {
    // Count how many theme keywords appear in the message
    const matchCount = keywords.filter(kw =>
      messageLower.includes(kw.toLowerCase())
    ).length;

    // If 2+ keywords match OR 1 strong keyword matches, activate theme
    if (matchCount >= 2 || (matchCount === 1 && keywords.slice(0, 3).some(k => messageLower.includes(k.toLowerCase())))) {
      detectedThemes.push(theme);
    }
  }
  return detectedThemes;
}

// ✅ IMPROVED: Prioritize theme keywords over base keywords
function enrichKeywordsWithThemes(baseKeywords: string[], themes: string[]): string[] {
  const themeSpecific = new Set<string>();
  const baseSet = new Set(baseKeywords);

  // Add theme keywords FIRST (higher priority in search)
  for (const theme of themes) {
    const themeKeywords = THIRUKKURAL_THEMES[theme] || [];
    themeKeywords.forEach(kw => themeSpecific.add(kw));
  }

  // Return theme keywords first, then base keywords (deduplicated)
  return [...Array.from(themeSpecific), ...Array.from(baseSet).filter(k => !themeSpecific.has(k))];
}

// ✅ IMPROVED: Better keyword extraction with synonym expansion
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !KEYWORD_SEARCH_STOP_WORDS.has(w));
  const expanded = new Set<string>();

  for (const word of words) {
    expanded.add(word);
    // Add synonyms
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));
    // Add stemmed version for broader matching
    const stemmed = word.replace(/tion$|ing$|ness$|ment$|ful$|less$|ed$|ly$|er$|s$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

// ✅ IMPROVED: Expand query with synonyms before searching
function expandQueryWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>(keywords);

  for (const kw of keywords) {
    if (SYNONYMS[kw]) {
      SYNONYMS[kw].forEach(s => expanded.add(s));
    }
    // Add Tamil equivalents for common English emotional words
    if (/[a-zA-Z]/.test(kw)) {
      const taMap: Record<string, string[]> = {
        'sad': ['துக்கம்', 'வருத்தம்', 'சோகம்'],
        'sadness': ['துக்கம்', 'வருத்தம்'],
        'anger': ['கோபம்', 'சினம்'],
        'angry': ['கோபம்', 'சினம்'],
        'love': ['காதல்', 'அன்பு'],
        'lonely': ['தனிமை', 'தனியாக'],
        'fear': ['பயம்', 'அச்சம்'],
        'happy': ['மகிழ்ச்சி', 'இன்பம்'],
        'pain': ['வலி', 'நோய்', 'துக்கம்'],
        'trust': ['நம்பிக்கை', 'நம்பு'],
        'betrayal': ['வஞ்சம்', 'துரோகம்'],
        'failure': ['தோல்வி', 'தோற்றல்'],
        'success': ['வெற்றி', 'செல்வம்'],
        'poverty': ['வறுமை', 'ஏழ்மை'],
        'wealth': ['செல்வம்', 'பொருள்'],
        'family': ['குடும்பம்', 'உறவு'],
        'friend': ['நட்பு', 'தோழன்'],
      };
      if (taMap[kw]) taMap[kw].forEach(t => expanded.add(t));
    }
  }

  return Array.from(expanded);
}

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
    .filter(w => w.length > 3 && !KEYWORD_SEARCH_STOP_WORDS.has(w));
  for (const word of questionWords) {
    if (allText.includes(word)) {
      score += 1;
    }
  }
  return score;
}

// ✅ IMPROVED: Better kural search with synonym expansion
async function findBestKural(keywords: string[], fullQuestion: string) {
  // Expand keywords with synonyms for better matching
  const expandedKeywords = expandQueryWithSynonyms(keywords);

  const searchResults: Record<string, unknown>[] = [];
  // Search with expanded keywords, limit to top 20 for performance
  for (const kw of expandedKeywords.slice(0, 20)) {
    const { data } = await supabase
      .from('Kurals-new')
      .select('*')
      .or(`Translation.ilike.%${kw}%,explanation.ilike.%${kw}%,Line1.ilike.%${kw}%,Line2.ilike.%${kw}%`)
      .limit(30);
    if (data && data.length > 0) {
      searchResults.push(...data);
    }
  }

  const uniqueResults = Array.from(
    new Map(searchResults.map(k => [k.Number, k])).values()
  );

  if (uniqueResults.length > 0) {
    const scoredByKeywordCount = uniqueResults
      .map(k => ({
        kural: k,
        keywordCount: scoreKuralByKeywordCount(k, expandedKeywords),
        weightedScore: scoreKural(k, expandedKeywords),
        semanticScore: 0
      }))
      .filter(k => k.keywordCount > 0)
      .sort((a, b) => {
        if (b.keywordCount !== a.keywordCount) {
          return b.keywordCount - a.keywordCount;
        }
        return b.weightedScore - a.weightedScore;
      });

    if (scoredByKeywordCount.length === 0) {
      // Fallback: try with original keywords only
      const fallbackResults = uniqueResults
        .map(k => ({
          kural: k,
          keywordCount: scoreKuralByKeywordCount(k, keywords),
          weightedScore: scoreKural(k, keywords)
        }))
        .filter(k => k.keywordCount > 0)
        .sort((a, b) => b.weightedScore - a.weightedScore);

      if (fallbackResults.length > 0) {
        return fallbackResults[0].kural;
      }

      // Last resort: random from first 100
      const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
      if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
      return null;
    }

    const topKeywordCount = scoredByKeywordCount[0].keywordCount;
    const topCandidates = scoredByKeywordCount.filter(k => k.keywordCount === topKeywordCount);

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

  // Fallback: random kural from first 100
  const { data: all } = await supabase.from('Kurals-new').select('*').limit(100);
  if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return null;
}

// ✅ IMPROVED: Better confidence messages
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
  if (keywordCount && keywordCount >= 3) {
    return "Here's a kural that closely relates to your query:";
  } else if (keywordCount && keywordCount >= 2) {
    return "Here's a kural that might resonate:";
  } else {
    return "This kural may resonate with your query:";
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

// ✅ NEW: Get helpful suggestions when search fails
function getSuggestions(message: string): string[] {
  const lower = message.toLowerCase();
  const suggestions: string[] = [];

  // Emotional state suggestions
  if (lower.match(/sad|depress|lonely|alone|grief|sorrow/i)) {
    suggestions.push("Try: 'advice for sadness'", "Try: 'kural about loneliness'");
  }
  if (lower.match(/anger|mad|rage|frustrat/i)) {
    suggestions.push("Try: 'how to control anger'", "Try: 'kural about patience'");
  }
  if (lower.match(/love|heart|breakup|relationship/i)) {
    suggestions.push("Try: 'kural about love'", "Try: 'advice for heartbreak'");
  }
  if (lower.match(/job|work|career|unemploy/i)) {
    suggestions.push("Try: 'kural about perseverance'", "Try: 'advice for job loss'");
  }
  if (lower.match(/family|parent|mother|father/i)) {
    suggestions.push("Try: 'kural about respecting parents'", "Try: 'family harmony advice'");
  }

  // Generic suggestions
  if (suggestions.length === 0) {
    suggestions.push("Try: 'show me kural 55'", "Try: 'advice for life challenges'");
  }

  return suggestions.slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 🔍 Debug logging (remove in production or use env flag)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query debug:', {
        original: message,
        length: message.length
      });
    }

    let source = 'keyword';
    let similarity: number | undefined;
    let keywordCount: number | undefined;

    // 1. Try direct kural number
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

    // 2. Try chapter + position query
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

    // 3. Try Questionare (life situation matching)
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

    // 4. Keyword search with theme enrichment
    const baseKeywords = extractKeywords(message);
    const detectedThemes = detectThemes(message);
    const enrichedKeywords = enrichKeywordsWithThemes(baseKeywords, detectedThemes);

    if (enrichedKeywords.length === 0) {
      return NextResponse.json({
        error: 'Could not understand query. Please try rephrasing.',
        suggestions: getSuggestions(message)
      }, { status: 400 });
    }

    const kural = await findBestKural(enrichedKeywords, message);

    // ✅ IMPROVED: Better fallback strategy
    if (!kural) {
      // Fallback 1: Try theme-based search
      if (detectedThemes.length > 0) {
        const themeKeywords = detectedThemes.flatMap(t => THIRUKKURAL_THEMES[t] || []).slice(0, 10);
        const themeKural = await findBestKural(themeKeywords, message);
        if (themeKural) {
          return NextResponse.json({
            kural: themeKural,
            keywords: themeKeywords.slice(0, 5),
            source: 'theme-fallback',
            confidence: 'low',
            confidenceMessage: `While we couldn't find an exact match, here's a kural about ${detectedThemes[0].replace('_', ' ')} that might help:`,
            detectedThemes
          });
        }
      }

      // Fallback 2: Return error with helpful suggestions
      return NextResponse.json({
        error: "We're still learning! Try rephrasing with words like 'sad', 'anger', 'love', or a kural number.",
        suggestions: getSuggestions(message)
      }, { status: 400 });
    }

    keywordCount = scoreKuralByKeywordCount(kural, enrichedKeywords);
    const displayKeywords = message
      .toLowerCase()
      .replace(/[.,!?;:'"()\-]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !KEYWORD_SEARCH_STOP_WORDS.has(w))
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
      keywordCount,
      detectedThemes
    });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({
      error: 'Server error. Please try again.',
      suggestions: ['Try: "show me kural 1"', 'Try: "advice for sadness"']
    }, { status: 500 });
  }
}