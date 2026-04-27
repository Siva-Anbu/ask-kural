import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MINIMAL_STOP_WORDS = new Set([
  'kural', 'kuṟa', 'குறள்', 'chapter', 'adhikaram', 'அதிகாரம்',
]);

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

const THIRUKKURAL_THEMES: Record<string, string[]> = {
  'fear_of_loss': ['afraid', 'fear', 'losing', 'lose', 'loss', 'scared', 'worried', 'anxious', 'people I love', 'loved ones', 'attachment', 'பற்று'],
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
  'loneliness': ['தனிமை', 'solitude', 'அன்பு', 'companionship', 'alone', 'isolated', 'lonely'],
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
  'lying_truth': ['பொய்', 'lie', 'lying', 'false', 'falsehood', 'truth', 'உண்மை', 'honest', 'honesty', 'deceit', 'deceive'],
  'attachment': ['love', 'attachment', 'bond', 'close', 'dear', 'precious', 'cherish', 'holding on', 'let go', 'affection', 'அன்பு'],
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

function detectQueryContext(message: string): 'emotional' | 'political' | 'general' {
  const lower = message.toLowerCase();
  const emotionalWords = ['love', 'losing', 'lose', 'afraid', 'scared', 'worried', 'anxious', 'sad', 'depressed', 'lonely', 'grief', 'missing', 'family', 'friends', 'relationship', 'people I', 'loved ones', 'close to me', 'heart', 'pain'];
  const politicalWords = ['king', 'ruler', 'state', 'army', 'war', 'enemy', 'foe', 'battle', 'minister', 'government', 'politics', 'power', 'kingdom', 'empire', 'foes', 'small states', 'superior foes', 'reconciliation', 'strategy', 'victory', 'defeat'];
  let emotionalScore = 0;
  let politicalScore = 0;
  emotionalWords.forEach(w => { if (lower.includes(w)) emotionalScore += 2; });
  politicalWords.forEach(w => { if (lower.includes(w)) politicalScore += 2; });
  if (emotionalScore > politicalScore && emotionalScore >= 2) return 'emotional';
  if (politicalScore > emotionalScore && politicalScore >= 2) return 'political';
  return 'general';
}

function extractDirectKuralNumber(message: string): number | null {
  const lower = message.toLowerCase().trim();
  const justNumber = /^(\d{1,4})$/;
  const match1 = lower.match(justNumber);
  if (match1) { const num = parseInt(match1[1]); if (num >= 1 && num <= 1330) return num; }
  const kuralPattern = /(?:kural|குறள்|kuṟa)\s*[#:]?\s*(\d{1,4})/i;
  const match2 = lower.match(kuralPattern);
  if (match2) { const num = parseInt(match2[1]); if (num >= 1 && num <= 1330) return num; }
  const giveShowPattern = /(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/i;
  const match3 = lower.match(giveShowPattern);
  if (match3) { const num = parseInt(match3[1]); if (num >= 1 && num <= 1330) return num; }
  return null;
}

function extractChapterKuralQuery(message: string): number | null {
  const lower = message.toLowerCase().trim();
  const enPattern1 = /(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|\d+(?:st|nd|rd|th)?)\s+(?:kural|குறள்)\s+(?:of|in)\s+(?:chapter|அதிகாரம்)\s+(\d{1,3})/i;
  const match1 = lower.match(enPattern1);
  if (match1) { const pos = ORDINALS_EN[match1[1]] || parseInt(match1[1]); const chap = parseInt(match1[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const enPattern2 = /(?:chapter|அதிகாரம்)\s+(\d{1,3})(?:'s)?\s+(?:kural|குறள்)?\s*(\d{1,2}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)/i;
  const match2 = lower.match(enPattern2);
  if (match2) { const chap = parseInt(match2[1]); const pos = ORDINALS_EN[match2[2]] || parseInt(match2[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const taPattern = /(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s+(?:குறள்|kural)?\s*(?:அதிகாரத்தின்|அதிகாரம்)?\s+(\d{1,3})/;
  const match3 = message.match(taPattern);
  if (match3) { const pos = ORDINALS_TA[match3[1]]; const chap = parseInt(match3[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const taPattern2 = /(?:அதிகாரம்|chapter)\s+(\d{1,3})\s*(?:இன்|ன்|of)?\s*(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s*(?:குறள்)?/;
  const match4 = message.match(taPattern2);
  if (match4) { const chap = parseInt(match4[1]); const pos = ORDINALS_TA[match4[2]]; if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  return null;
}

async function getKuralByNumber(num: number) {
  const { data, error } = await supabase.from('Kurals-new').select('*').eq('Number', num).single();
  if (error || !data) return null;
  return data;
}

function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:'"()\-]/g, ' ').replace(/\s+/g, ' ');
  const text1 = normalize(str1);
  const text2 = normalize(str2);
  if (text1 === text2) return 100;
  if (text1.includes(text2) || text2.includes(text1)) return 85;
  const words1 = text1.split(/\s+/).filter(w => w.length > 2 && !MINIMAL_STOP_WORDS.has(w));
  const words2 = text2.split(/\s+/).filter(w => w.length > 2 && !MINIMAL_STOP_WORDS.has(w));
  if (words1.length === 0 || words2.length === 0) return 0;
  let score = 0;
  for (const word of words1) {
    if (words2.includes(word)) score += 12;
    else for (const w2 of words2) { if (w2.includes(word) || word.includes(w2)) { score += 6; break; } }
  }
  const text1Words = text1.split(/\s+/);
  for (let i = 0; i < text1Words.length - 1; i++) {
    const bigram = `${text1Words[i]} ${text1Words[i + 1]}`;
    if (text2.includes(bigram)) score += 18;
  }
  return Math.min(100, (score / (words1.length * 12 + text1Words.length * 18)) * 100);
}

function calculateMultiFieldSimilarity(query: string, situation: any): number {
  const weights: Record<string, number> = { Situation: 1.0, Keywords: 0.7, Theme: 0.5 };
  let totalScore = 0, totalWeight = 0;
  for (const [field, weight] of Object.entries(weights)) {
    if (situation[field] && typeof situation[field] === 'string') {
      totalScore += calculateSimilarity(query, situation[field]) * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

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

async function searchQuestionare(message: string) {
  const keywords = extractQuestionareKeywords(message);
  if (keywords.length === 0) return null;
  const searchKeywords = keywords.slice(0, 15);
  const { data: situations, error } = await supabase.from('Questionare').select('*').or(searchKeywords.map(kw => `Situation.ilike.%${kw}%`).join(',')).limit(100);
  if (error || !situations || situations.length === 0) return null;
  let bestMatch = null, bestScore = 0;
  for (const situation of situations) {
    const score = calculateMultiFieldSimilarity(message, situation);
    if (score > bestScore) { bestScore = score; bestMatch = situation; }
  }
  if (!bestMatch || bestScore < 30) return null;
  const kurals = [];
  if (bestMatch.Kural_1) kurals.push({ num: bestMatch.Kural_1, tamil1: bestMatch.Tamil1_1, tamil2: bestMatch.Tamil2_1, meaning: bestMatch.Meaning_1 });
  if (bestMatch.Kural_2) kurals.push({ num: bestMatch.Kural_2, tamil1: bestMatch.Tamil1_2, tamil2: bestMatch.Tamil2_2, meaning: bestMatch.Meaning_2 });
  if (bestMatch.Kural_3) kurals.push({ num: bestMatch.Kural_3, tamil1: bestMatch.Tamil1_3, tamil2: bestMatch.Tamil2_3, meaning: bestMatch.Meaning_3 });
  if (kurals.length === 0) return null;
  const keywordsLower = keywords.map(k => k.toLowerCase());
  let bestKural = null, bestKuralScore = 0;
  for (const k of kurals) {
    let score = 0;
    const meaningLower = (k.meaning || '').toLowerCase();
    for (const keyword of keywordsLower) { if (meaningLower.includes(keyword)) score += 10; }
    if (k.num === bestMatch.Kural_1) score += 5;
    if (score > bestKuralScore) { bestKuralScore = score; bestKural = k; }
  }
  if (!bestKural || bestKuralScore === 0) bestKural = kurals[0];
  const fullKural = await getKuralByNumber(bestKural.num);
  if (!fullKural) return null;
  return { kural: fullKural, matchedSituation: bestMatch.Situation, similarity: bestScore };
}

function detectThemes(message: string): string[] {
  const messageLower = message.toLowerCase();
  const detectedThemes: string[] = [];
  const emotionalPatterns = [
    { pattern: /afraid.*losing|fear.*losing|scared.*lose|worried.*losing/i, themes: ['fear_of_loss', 'death_grief'] },
    { pattern: /losing.*love|losing.*people|lose.*loved/i, themes: ['fear_of_loss', 'attachment'] },
    { pattern: /miss.*someone|missing.*person|longing/i, themes: ['missing_lover', 'loneliness'] },
    { pattern: /death.*afraid|fear.*death|losing.*family/i, themes: ['death_grief', 'fear_of_loss'] },
  ];
  for (const { pattern, themes } of emotionalPatterns) {
    if (pattern.test(message)) detectedThemes.push(...themes);
  }
  for (const [theme, keywords] of Object.entries(THIRUKKURAL_THEMES)) {
    if (detectedThemes.includes(theme)) continue;
    const matchCount = keywords.filter(kw => messageLower.includes(kw.toLowerCase())).length;
    const isEmotional = ['fear_of_loss', 'death_grief', 'missing_lover', 'attachment', 'loneliness', 'depression', 'anxiety', 'grief', 'heartbreak', 'betrayed_friend'].includes(theme);
    const threshold = isEmotional ? 1 : Math.max(1, Math.floor(keywords.length * 0.3));
    if (matchCount >= threshold) detectedThemes.push(theme);
  }
  return [...new Set(detectedThemes)];
}

function enrichKeywordsWithThemes(baseKeywords: string[], themes: string[]): string[] {
  const themeSpecific = new Set<string>();
  const baseSet = new Set(baseKeywords);
  for (const theme of themes) {
    (THIRUKKURAL_THEMES[theme] || []).forEach(kw => themeSpecific.add(kw));
  }
  return [...Array.from(themeSpecific), ...Array.from(baseSet).filter(k => !themeSpecific.has(k))];
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !KEYWORD_SEARCH_STOP_WORDS.has(w));
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

function expandQueryWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>(keywords);
  for (const kw of keywords) {
    if (SYNONYMS[kw]) SYNONYMS[kw].forEach(s => expanded.add(s));
    if (/[a-zA-Z]/.test(kw)) {
      const taMap: Record<string, string[]> = {
        'sad': ['துக்கம்', 'வருத்தம்', 'சோகம்'], 'sadness': ['துக்கம்', 'வருத்தம்'],
        'anger': ['கோபம்', 'சினம்'], 'angry': ['கோபம்', 'சினம்'],
        'love': ['காதல்', 'அன்பு'], 'lonely': ['தனிமை', 'தனியாக'],
        'fear': ['பயம்', 'அச்சம்'], 'happy': ['மகிழ்ச்சி', 'இன்பம்'],
        'pain': ['வலி', 'நோய்', 'துக்கம்'], 'trust': ['நம்பிக்கை', 'நம்பு'],
        'betrayal': ['வஞ்சம்', 'துரோகம்'], 'failure': ['தோல்வி', 'தோற்றல்'],
        'success': ['வெற்றி', 'செல்வம்'], 'poverty': ['வறுமை', 'ஏழ்மை'],
        'wealth': ['செல்வம்', 'பொருள்'], 'family': ['குடும்பம்', 'உறவு'],
        'friend': ['நட்பு', 'தோழன்'],
      };
      if (taMap[kw]) taMap[kw].forEach(t => expanded.add(t));
    }
  }
  return Array.from(expanded);
}

function scoreKuralByKeywordCount(kural: Record<string, unknown>, keywords: string[]): number {
  let matched = 0;
  const allText = [kural.Line1, kural.Line2, kural.Translation, kural.transliteration1, kural.transliteration2, kural.mv, kural.sp, kural.mk, kural.couplet, kural.explanation].filter(Boolean).join(' ').toLowerCase();
  for (const kw of keywords.map(k => k.toLowerCase())) { if (kw.length >= 3 && allText.includes(kw)) matched++; }
  return matched;
}

function scoreKural(kural: Record<string, unknown>, keywords: string[], queryContext: string): number {
  let score = 0;
  const allText = [kural.Line1, kural.Line2, kural.Translation, kural.explanation].filter(Boolean).join(' ').toLowerCase();
  const politicalIndicators = ['king', 'ruler', 'state', 'army', 'war', 'enemy', 'foe', 'battle', 'minister', 'government', 'politics', 'kingdom', 'empire', 'foes', 'small states', 'superior foes', 'reconciliation', 'strategy', 'victory', 'defeat'];
  let politicalMatch = 0;
  politicalIndicators.forEach(i => { if (allText.includes(i)) politicalMatch++; });
  if (queryContext === 'emotional' && politicalMatch >= 2) return -100;
  if (queryContext === 'emotional' && politicalMatch === 1) score -= 30;
  const emotionalIndicators = ['love', 'friend', 'friendship', 'family', 'heart', 'sorrow', 'grief', 'separation', 'loss', 'attachment', 'bond', 'afraid', 'losing'];
  let emotionalMatch = 0;
  emotionalIndicators.forEach(i => { if (allText.includes(i)) emotionalMatch++; });
  if (queryContext === 'emotional' && emotionalMatch >= 1) score += 40;
  for (const kw of keywords) {
    if (kw.length < 3) continue;
    if (((kural.Translation as string) || '').toLowerCase().includes(kw)) score += 10;
    if (((kural.explanation as string) || '').toLowerCase().includes(kw)) score += 8;
    if (((kural.Line1 as string) || '').toLowerCase().includes(kw)) score += 7;
    if (((kural.Line2 as string) || '').toLowerCase().includes(kw)) score += 7;
  }
  return score;
}

function semanticScore(kural: Record<string, unknown>, fullQuestion: string): number {
  let score = 0;
  const allText = [kural.Line1, kural.Line2, kural.Translation, kural.transliteration1, kural.transliteration2, kural.mv, kural.sp, kural.mk, kural.couplet, kural.explanation].filter(Boolean).join(' ').toLowerCase();
  const qWords = fullQuestion.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !KEYWORD_SEARCH_STOP_WORDS.has(w));
  for (const w of qWords) { if (allText.includes(w)) score++; }
  return score;
}

async function findBestKural(keywords: string[], fullQuestion: string, queryContext: string) {
  const expanded = expandQueryWithSynonyms(keywords);
  const searchResults: Record<string, unknown>[] = [];
  for (const kw of expanded.slice(0, 20)) {
    const { data } = await supabase.from('Kurals-new').select('*').or(`Translation.ilike.%${kw}%,explanation.ilike.%${kw}%,Line1.ilike.%${kw}%,Line2.ilike.%${kw}%`).limit(30);
    if (data?.length) searchResults.push(...data);
  }
  const unique = Array.from(new Map(searchResults.map(k => [k.Number, k])).values());
  if (unique.length > 0) {
    const scored = unique.map(k => ({ kural: k, kwCount: scoreKuralByKeywordCount(k, expanded), weighted: scoreKural(k, expanded, queryContext), sem: 0 }))
      .filter(k => k.weighted > 0)
      .sort((a, b) => b.weighted - a.weighted || b.kwCount - a.kwCount);
    if (scored.length > 0) {
      if (scored[0].weighted > 0) {
        const top = scored.filter(k => k.weighted === scored[0].weighted);
        if (top.length > 1) {
          const tie = top.map(k => ({ ...k, sem: semanticScore(k.kural, fullQuestion) })).sort((a, b) => b.sem - a.sem);
          return tie[0].kural;
        }
        return scored[0].kural;
      }
    }
  }
  const { data: fallback } = await supabase.from('Kurals-new').select('*').limit(100);
  return fallback?.length ? fallback[Math.floor(Math.random() * fallback.length)] : null;
}

function getConfidenceMessage(source: string, similarity?: number, keywordCount?: number): string {
  if (source === 'direct' || source === 'chapter') return '';
  if (source === 'questionare') return similarity && similarity >= 80 ? "Here's a kural that closely matches your situation:" : similarity && similarity >= 65 ? "Here's a kural that might resonate with your situation:" : "Here's a kural that may offer perspective on your situation:";
  return keywordCount && keywordCount >= 3 ? "Here's a kural that closely relates to your query:" : keywordCount && keywordCount >= 2 ? "Here's a kural that might resonate:" : "This kural may resonate with your query:";
}

function getConfidenceLevel(source: string, similarity?: number, keywordCount?: number): 'high' | 'medium' | 'low' {
  if (source === 'direct' || source === 'chapter') return 'high';
  if (source === 'questionare' && similarity) return similarity >= 80 ? 'high' : similarity >= 65 ? 'medium' : 'low';
  return keywordCount && keywordCount >= 3 ? 'high' : keywordCount && keywordCount >= 2 ? 'medium' : 'low';
}

function getSuggestions(message: string): string[] {
  const lower = message.toLowerCase();
  const s: string[] = [];
  if (lower.match(/sad|depress|lonely|alone|grief|sorrow/i)) s.push("Try: 'advice for sadness'", "Try: 'kural about loneliness'");
  if (lower.match(/anger|mad|rage|frustrat/i)) s.push("Try: 'how to control anger'", "Try: 'kural about patience'");
  if (lower.match(/love|heart|breakup|relationship|losing|afraid/i)) s.push("Try: 'kural about love & attachment'", "Try: 'dealing with fear of loss'");
  if (lower.match(/job|work|career|unemploy/i)) s.push("Try: 'kural about perseverance'", "Try: 'advice for job loss'");
  if (lower.match(/family|parent|mother|father/i)) s.push("Try: 'kural about respecting parents'", "Try: 'family harmony advice'");
  return s.length ? s.slice(0, 3) : ["Try: 'show me kural 55'", "Try: 'advice for life challenges'"];
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const queryContext = detectQueryContext(message);
    let source = 'keyword';
    let similarity: number | undefined;
    let keywordCount: number | undefined;

    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) return NextResponse.json({ kural, keywords: [`kural-${directNum}`], source: 'direct', confidence: 'high', confidenceMessage: '' });
    }

    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) return NextResponse.json({ kural, keywords: ['chapter-query'], source: 'chapter', confidence: 'high', confidenceMessage: '' });
    }

    const questionareResult = await searchQuestionare(message);
    if (questionareResult) {
      return NextResponse.json({
        kural: questionareResult.kural, keywords: ['situation-match'], matchedSituation: questionareResult.matchedSituation,
        source: 'questionare', similarity: questionareResult.similarity, confidence: getConfidenceLevel('questionare', questionareResult.similarity),
        confidenceMessage: getConfidenceMessage('questionare', questionareResult.similarity)
      });
    }

    const baseKeywords = extractKeywords(message);
    const detectedThemes = detectThemes(message);
    const enrichedKeywords = enrichKeywordsWithThemes(baseKeywords, detectedThemes);
    if (enrichedKeywords.length === 0) return NextResponse.json({ error: 'Could not understand query. Please try rephrasing.', suggestions: getSuggestions(message) }, { status: 400 });

    const kural = await findBestKural(enrichedKeywords, message, queryContext);
    if (!kural) {
      if (detectedThemes.length > 0) {
        const themeKw = detectedThemes.flatMap(t => THIRUKKURAL_THEMES[t] || []).slice(0, 10);
        const themeKural = await findBestKural(themeKw, message, queryContext);
        if (themeKural) {
          return NextResponse.json({
            kural: themeKural, keywords: themeKw.slice(0, 5), source: 'theme-fallback', confidence: 'low',
            confidenceMessage: `While we couldn't find an exact match, here's a kural about ${detectedThemes[0].replace('_', ' ')} that might help:`, detectedThemes
          });
        }
      }
      return NextResponse.json({ error: "We're still learning! Try rephrasing with words like 'sad', 'anger', 'love', or a kural number.", suggestions: getSuggestions(message) }, { status: 400 });
    }

    keywordCount = scoreKuralByKeywordCount(kural, enrichedKeywords);
    const displayKeywords = message.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').split(/\s+/).filter((w: string) => w.length > 2 && !KEYWORD_SEARCH_STOP_WORDS.has(w)).slice(0, 5);

    return NextResponse.json({
      kural, keywords: displayKeywords, source: 'keyword', confidence: getConfidenceLevel('keyword', undefined, keywordCount),
      confidenceMessage: getConfidenceMessage('keyword', undefined, keywordCount), keywordCount, detectedThemes
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.', suggestions: ['Try: "show me kural 1"', 'Try: "advice for sadness"'] }, { status: 500 });
  }
}