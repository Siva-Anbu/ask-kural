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
  'what','when','where','who','why','how','which','whom','whose','can','will',
  'would','should','could','may','might','must','shall','ought','had','have',
  'has','do','did','does','am','is','are','was','were','be','been','being',
  'about','above','across','after','against','along','among','around','as','at',
  'before','behind','below','beneath','beside','between','beyond','but','by',
  'down','during','except','for','from','in','inside','into','like','near','of',
  'off','on','onto','out','outside','over','past','through','to','under','until',
  'up','upon','with','within','without','according','alongside','amid','amongst',
  'apropos','around','as','aside','at','atop','barring','because','before',
  'behind','below','beneath','beside','besides','between','beyond','but',
  'by','concerning','considering','despite','down','due','during','except',
  'excepting','excluding','following','for','from','given','in','including',
  'inside','into','less','like','minus','near','notwithstanding','of','off',
  'on','onto','opposite','out','outside','over','past','per','plus','prior',
  'regarding','regardless','save','since','than','through','throughout','till',
  'to','toward','towards','under','underneath','unlike','until','unto','up',
  'upon','versus','via','with','within','without','worth'
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

// Comprehensive synonym map - expanded for better coverage
const SYNONYMS: Record<string, string[]> = {
  // General concepts
  'life': ['living', 'existence', 'being'],
  'happiness': ['joy', 'bliss', 'contentment', 'pleasure', 'delight'],
  'sadness': ['sorrow', 'grief', 'unhappiness', 'misery', 'despair'],
  'anger': ['rage', 'fury', 'wrath', 'indignation', 'resentment'],
  'love': ['affection', 'charity', 'compassion', 'devotion', 'fondness'],
  'virtue': ['goodness', 'morality', 'righteousness', 'integrity', 'purity'],
  'wealth': ['riches', 'prosperity', 'affluence', 'fortune', 'money'],
  'poverty': ['destitution', 'indigence', 'penury', 'want'],
  'knowledge': ['wisdom', 'learning', 'understanding', 'insight', 'education'],
  'ignorance': ['unawareness', 'illiteracy', 'naivety'],
  'friendship': ['companionship', 'camaraderie', 'fellowship', 'bond'],
  'enemy': ['foe', 'adversary', 'opponent', 'rival'],
  'justice': ['fairness', 'equity', 'impartiality', 'righteousness'],
  'injustice': ['unfairness', 'wrong', 'inequity'],
  'truth': ['veracity', 'fact', 'reality', 'sincerity'],
  'falsehood': ['lie', 'deception', 'untruth', 'fabrication'],
  'duty': ['obligation', 'responsibility', 'task', 'role'],
  'action': ['deed', 'act', 'conduct', 'behavior'],
  'fate': ['destiny', 'luck', 'fortune', 'providence'],
  'god': ['divine', 'creator', 'almighty', 'lord'],
  'spirituality': ['faith', 'religion', 'devotion'],
  'family': ['kin', 'relatives', 'household'],
  'society': ['community', 'public', 'nation'],
  'king': ['ruler', 'monarch', 'sovereign', 'leader'],
  'governance': ['rule', 'administration', 'leadership'],
  'education': ['learning', 'schooling', 'instruction'],
  'health': ['wellbeing', 'fitness', 'wellness'],
  'disease': ['illness', 'sickness', 'malady'],
  'death': ['demise', 'passing', 'mortality'],
  'birth': ['origin', 'beginning', 'creation'],
  'praise': ['commendation', 'applause', 'acclaim'],
  'blame': ['censure', 'reproach', 'criticism'],
  'patience': ['endurance', 'forbearance', 'tolerance'],
  'courage': ['bravery', 'valor', 'gallantry'],
  'fear': ['dread', 'terror', 'fright', 'anxiety'],
  'peace': ['tranquility', 'calm', 'serenity'],
  'war': ['conflict', 'battle', 'combat'],
  'procrastination': ['delay', 'postponement', 'dawdling'],
  'lonely': ['isolated', 'solitary', 'alone'],
  'failure': ['defeat', 'unsuccess', 'fiasco'],
  'success': ['achievement', 'triumph', 'victory'],
  'work': ['labor', 'employment', 'job', 'occupation'],
  'job': ['employment', 'work', 'occupation'],
  'father': ['dad', 'parent'],
  'mother': ['mom', 'parent'],
  'children': ['kids', 'offspring'],
  'wife': ['spouse', 'partner'],
  'husband': ['spouse', 'partner'],
  'good': ['excellent', 'fine', 'great', 'positive'],
  'bad': ['poor', 'evil', 'negative', 'unpleasant'],
  'true': ['correct', 'accurate', 'real'],
  'false': ['incorrect', 'wrong', 'untrue'],
  'old': ['aged', 'ancient', 'elderly'],
  'new': ['fresh', 'modern', 'recent'],
  'small': ['little', 'tiny', 'miniature'],
  'big': ['large', 'great', 'huge'],
  'strong': ['powerful', 'mighty', 'robust'],
  'weak': ['feeble', 'frail', 'delicate'],
  'wise': ['sagacious', 'prudent', 'intelligent'],
  'foolish': ['silly', 'stupid', 'unwise'],
  'clean': ['pure', 'spotless', 'tidy'],
  'dirty': ['unclean', 'soiled', 'filthy'],
  'rich': ['wealthy', 'affluent', 'prosperous'],
  'poor': ['needy', 'impoverished', 'destitute'],
  'fast': ['quick', 'rapid', 'swift'],
  'slow': ['leisurely', 'unhurried', 'gradual'],
  'hot': ['warm', 'heated', 'scorching'],
  'cold': ['chilly', 'frigid', 'freezing'],
  'light': ['bright', 'luminous', 'radiant'],
  'dark': ['dim', 'gloomy', 'somber'],
  'easy': ['simple', 'effortless', 'uncomplicated'],
  'difficult': ['hard', 'challenging', 'arduous'],
  'happy': ['joyful', 'cheerful', 'merry'],
  'unhappy': ['sad', 'miserable', 'depressed'],
  'calm': ['peaceful', 'tranquil', 'serene'],
  'agitated': ['disturbed', 'troubled', 'restless'],
  'kind': ['benevolent', 'compassionate', 'gentle'],
  'cruel': ['brutal', 'heartless', 'merciless'],
  'honest': ['truthful', 'sincere', 'upright'],
  'dishonest': ['deceitful', 'untruthful', 'corrupt'],
  'patient': ['forbearing', 'tolerant', 'enduring'],
  'impatient': ['restless', 'eager', 'hasty'],
  'brave': ['courageous', 'valiant', 'heroic'],
  'cowardly': ['fearful', 'timid', 'fainthearted'],
  'generous': ['benevolent', 'charitable', 'liberal'],
  'selfish': ['egotistical', 'greedy', 'self-centered'],
  'humble': ['modest', 'unassuming', 'meek'],
  'proud': ['arrogant', 'haughty', 'conceited'],
  'cleanliness': ['hygiene', 'purity', 'tidiness'],
  'dirtiness': ['filth', 'squalor', 'grime'],
  'health': ['well-being', 'fitness', 'vigor'],
  'sickness': ['illness', 'disease', 'ailment'],
  'strength': ['power', 'might', 'force'],
  'weakness': ['frailty', 'debility', 'infirmity'],
  'knowledge': ['understanding', 'wisdom', 'erudition'],
  'ignorance': ['unawareness', 'nescience', 'illiteracy'],
  'truthfulness': ['honesty', 'veracity', 'sincerity'],
  'falsehood': ['deception', 'lie', 'untruth'],
  'diligence': ['industry', 'assiduity', 'perseverance'],
  'laziness': ['idleness', 'indolence', 'sloth'],
  'gratitude': ['thankfulness', 'appreciation', 'indebtedness'],
  'ingratitude': ['unthankfulness', 'unappreciativeness'],
  'forgiveness': ['pardon', 'absolution', 'remission'],
  'revenge': ['vengeance', 'retribution', 'reprisal'],
  'peace': ['tranquility', 'serenity', 'calmness'],
  'conflict': ['strife', 'discord', 'dispute'],
  'unity': ['harmony', 'solidarity', 'cohesion'],
  'division': ['disunity', 'schism', 'fragmentation'],
  'purity': ['innocence', 'chastity', 'virtue'],
  'impurity': ['contamination', 'defilement', 'vice'],
  'patience': ['endurance', 'perseverance', 'fortitude'],
  'impatience': ['restlessness', 'eagerness', 'haste'],
  'self-control': ['restraint', 'temperance', 'discipline'],
  'indulgence': ['excess', 'gratification', 'immoderation'],
  'moderation': ['temperance', 'restraint', 'prudence'],
  'extremism': ['radicalism', 'fanaticism', 'immoderation'],
  'charity': ['benevolence', 'philanthropy', 'generosity'],
  'greed': ['avarice', 'covetousness', 'materialism'],
  'sacrifice': ['offering', 'devotion', 'selflessness'],
  'selfishness': ['egotism', 'self-centeredness', 'narcissism'],
  'courage': ['bravery', 'valor', 'heroism'],
  'cowardice': ['timidity', 'fearfulness', 'pusillanimity'],
  'hope': ['optimism', 'expectation', 'faith'],
  'despair': ['hopelessness', 'dejection', 'gloom'],
  'trust': ['faith', 'confidence', 'reliance'],
  'distrust': ['suspicion', 'doubt', 'mistrust'],
  'respect': ['esteem', 'admiration', 'deference'],
  'disrespect': ['contempt', 'disregard', 'insolence'],
  'humility': ['modesty', 'meekness', 'unpretentiousness'],
  'arrogance': ['haughtiness', 'conceit', 'pride'],
  'simplicity': ['plainness', 'unpretentiousness', 'modesty'],
  'complexity': ['intricacy', 'complication', 'sophistication'],
  'wisdom': ['sagacity', 'prudence', 'discernment'],
  'folly': ['foolishness', 'stupidity', 'absurdity'],
  'discipline': ['self-control', 'training', 'order'],
  'anarchy': ['disorder', 'chaos', 'lawlessness'],
  'dharma': ['righteousness', 'duty', 'virtue'],
  'karma': ['destiny', 'fate', 'consequence'],
  'moksha': ['liberation', 'salvation', 'emancipation'],
  'artha': ['wealth', 'prosperity', 'material_gain'],
  'kama': ['desire', 'pleasure', 'love'],
  'vazhkai': ['life', 'living'], // Tamil for life
  'anbu': ['love', 'affection'], // Tamil for love
  'aram': ['virtue', 'righteousness'], // Tamil for virtue
  'porul': ['wealth', 'material'], // Tamil for wealth
  'inbam': ['happiness', 'pleasure'], // Tamil for happiness
  'thunbam': ['sadness', 'suffering'], // Tamil for sadness
  'kuralin': ['kural'], // related to kural
  'kuralgal': ['kural'], // related to kural
  'thirukkural': ['kural'], // related to kural
  'valluvar': ['kural'], // related to kural
  'திருக்குறள்': ['kural'], // Tamil for Thirukkural
  'வள்ளுவர்': ['kural'], // Tamil for Valluvar
  'அதிகாரம்': ['chapter'], // Tamil for chapter
  'குறள்': ['kural'], // Tamil for Kural
  'வாழ்க்கை': ['life'], // Tamil for life
  'அன்பு': ['love'], // Tamil for love
  'அறம்': ['virtue'], // Tamil for virtue
  'பொருள்': ['wealth'], // Tamil for wealth
  'இன்பம்': ['happiness'], // Tamil for happiness
  'துன்பம்': ['sadness'], // Tamil for sadness
  'கோபம்': ['anger'], // Tamil for anger
  'தோல்வி': ['failure'], // Tamil for failure
  'வெற்றி': ['success'], // Tamil for success
  'தனிமை': ['lonely'], // Tamil for loneliness
  'வேலை': ['job', 'work'], // Tamil for work/job
  'சண்டை': ['fight', 'quarrel'], // Tamil for fight
  'தள்ளிப்போடுகிறேன்': ['procrastinate', 'delay'], // Tamil for procrastinate
  'அப்பா': ['father'], // Tamil for father
  'அம்மா': ['mother'], // Tamil for mother
  'குழந்தைகள்': ['children'], // Tamil for children
  'நட்பு': ['friendship'], // Tamil for friendship
  'கல்வி': ['education'], // Tamil for education
  'அறிவு': ['knowledge', 'wisdom'], // Tamil for knowledge
  'செல்வம்': ['wealth'], // Tamil for wealth
  'வறுமை': ['poverty'], // Tamil for poverty
  'உண்மை': ['truth'], // Tamil for truth
  'பொய்': ['falsehood'], // Tamil for falsehood
  'நீதி': ['justice'], // Tamil for justice
  'அநீதி': ['injustice'], // Tamil for injustice
  'தியாகம்': ['sacrifice'], // Tamil for sacrifice
  'பக்தி': ['devotion', 'faith'], // Tamil for devotion
  'அமைதி': ['peace'], // Tamil for peace
  'போர்': ['war', 'conflict'], // Tamil for war
  'பொறுமை': ['patience'], // Tamil for patience
  'துணிவு': ['courage'], // Tamil for courage
  'பயம்': ['fear'], // Tamil for fear
  'தூய்மை': ['purity', 'cleanliness'], // Tamil for purity
  'மாசு': ['impurity', 'dirtiness'], // Tamil for impurity
  'நம்பிக்கை': ['hope', 'trust'], // Tamil for hope/trust
  'சந்தேகம்': ['doubt', 'suspicion'], // Tamil for doubt
  'மரியாதை': ['respect'], // Tamil for respect
  'அவமதிப்பு': ['disrespect'], // Tamil for disrespect
  'தாழ்மை': ['humility'], // Tamil for humility
  'பெருமை': ['pride', 'arrogance'], // Tamil for pride
  'எளிமை': ['simplicity'], // Tamil for simplicity
  'சிக்கல்': ['complexity'], // Tamil for complexity
  'அறிவுடைமை': ['wisdom'], // Tamil for wisdom
  'அறியாமை': ['ignorance'], // Tamil for ignorance
  'கட்டுப்பாடு': ['self-control', 'discipline'], // Tamil for self-control
  'சுதந்திரம்': ['freedom', 'liberation'], // Tamil for freedom
  'ஒற்றுமை': ['unity'], // Tamil for unity
  'பிரிவினை': ['division'], // Tamil for division
  'நன்றி': ['gratitude'], // Tamil for gratitude
  'மன்னிப்பு': ['forgiveness'], // Tamil for forgiveness
  'பழிவாங்குதல்': ['revenge'], // Tamil for revenge
  'நோய்': ['disease', 'sickness'], // Tamil for disease
  'ஆரோக்கியம்': ['health'], // Tamil for health
  'பிறப்பு': ['birth'], // Tamil for birth
  'இறப்பு': ['death'], // Tamil for death
  'புகழ்': ['fame', 'praise'], // Tamil for fame
  'பழி': ['blame', 'reproach'], // Tamil for blame
  'கடமை': ['duty', 'obligation'], // Tamil for duty
  'செயல்': ['action', 'deed'], // Tamil for action
  'ஊழ்': ['fate', 'destiny'], // Tamil for fate
  'இறைவன்': ['god'], // Tamil for god
  'அறத்துப்பால்': ['virtue'], // Tamil for Book of Virtue
  'பொருட்பால்': ['wealth'], // Tamil for Book of Wealth
  'காமத்துப்பால்': ['love', 'pleasure'], // Tamil for Book of Love
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
    .from('kurals')
    .select('*')
    .eq('number', num)
    .single();
    
  if (error || !data) return null;
  return data;
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ');
  const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of words) {
    expanded.add(word);
    // Add synonyms
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => expanded.add(s));
    
    // Basic stemming for English words
    const stemmed = word
      .replace(/ing$|es$|s$|ed$|er$|ly$|ful$|less$|ment$|tion$/, '');
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      if (SYNONYMS[stemmed]) SYNONYMS[stemmed].forEach(s => expanded.add(s));
    }
  }
  return Array.from(expanded);
}

function scoreKural(kural: Record<string, unknown>, keywords: string[], queryWordCounts: Map<string, number>): number {
  let score = 0;

  const chapterTamil = ((kural.chapter_tamil as string) || '').toLowerCase();
  const chapterEnglish = ((kural.chapter_english as string) || '').toLowerCase();
  const tamil = ((kural.tamil as string) || '').toLowerCase();
  const transliteration = ((kural.transliteration as string) || '').toLowerCase();
  const english = ((kural.english as string) || '').toLowerCase();
  const themes = ((kural.themes as string[]) || []).join(' ').toLowerCase();
  const mv = ((kural.mv as string) || '').toLowerCase();
  const sp = ((kural.sp as string) || '').toLowerCase();
  const mk = ((kural.mk as string) || '').toLowerCase();
  const couplet = ((kural.couplet as string) || '').toLowerCase();
  const explanation = ((kural.explanation as string) || '').toLowerCase();

  for (const kw of keywords) {
    const queryWeight = queryWordCounts.get(kw) || 1; // Give more weight to frequently queried words

    if (kw.length < 3) continue;

    // Boost scores for matches in more important fields
    if (themes.includes(kw)) score += 10 * queryWeight; // High relevance
    if (chapterEnglish.includes(kw)) score += 8 * queryWeight;
    if (chapterTamil.includes(kw)) score += 7 * queryWeight;
    if (english.includes(kw)) score += 6 * queryWeight;
    if (tamil.includes(kw)) score += 6 * queryWeight;
    if (transliteration.includes(kw)) score += 5 * queryWeight;
    if (couplet.includes(kw)) score += 5 * queryWeight;
    if (explanation.includes(kw)) score += 4 * queryWeight;
    if (mv.includes(kw)) score += 3 * queryWeight;
    if (sp.includes(kw)) score += 3 * queryWeight;
    if (mk.includes(kw)) score += 3 * queryWeight;
  }

  return score;
}

// Renamed and refined for better contextual understanding without embeddings
function contextualScore(kural: Record<string, unknown>, keywords: string[]): number {
  let uniqueKeywordMatches = 0;
  let totalKeywordOccurrences = 0;

  const allText = [
    kural.chapter_tamil,
    kural.chapter_english,
    kural.tamil,
    kural.transliteration,
    kural.english,
    ((kural.themes as string[]) || []).join(' '),
    kural.mv,
    kural.sp,
    kural.mk,
    kural.couplet,
    kural.explanation,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const kw of keywords) {
    if (allText.includes(kw)) {
      uniqueKeywordMatches++;
      // Count occurrences for density
      totalKeywordOccurrences += (allText.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length;
    }
  }
  // Combine unique matches and total occurrences for a more robust contextual score
  return uniqueKeywordMatches * 10 + totalKeywordOccurrences;
}

async function findBestKural(keywords: string[], fullQuestion: string) {
  const queryString = keywords.join(' ');

  // Calculate query word counts for dynamic weighting
  const queryWordCounts = new Map<string, number>();
  fullQuestion.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').split(/\s+/).forEach(word => {
    if (word.length > 2 && !STOP_WORDS.has(word)) {
      queryWordCounts.set(word, (queryWordCounts.get(word) || 0) + 1);
    }
  });

  // Fetch candidates from Full-Text Search
  const { data: ftResults } = await supabase
    .from('kurals')
    .select('*')
    .textSearch('search_vector', queryString, { type: 'plain', config: 'english' })
    .limit(50); // Increased limit to get more candidates

  // Fetch candidates from theme overlaps
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(50); // Increased limit

  // Combine results and remove duplicates
  const allCandidates = new Map<number, Record<string, unknown>>();
  if (ftResults) {
    ftResults.forEach(kural => allCandidates.set(kural.number, kural));
  }
  if (themeMatches) {
    themeMatches.forEach(kural => allCandidates.set(kural.number, kural));
  }

  let scoredCandidates = Array.from(allCandidates.values())
    .map(k => ({
      kural: k,
      score: scoreKural(k, keywords, queryWordCounts),
      contextualScore: contextualScore(k, keywords) // Use refined contextual score
    }))
    .sort((a, b) => {
      // Primary sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort by contextual score for tie-breaking
      return b.contextualScore - a.contextualScore;
    });

  if (scoredCandidates.length > 0) {
    return scoredCandidates[0].kural;
  }

  // Fallback: If no relevant kural is found, return a random kural or a default one
  const { data: randomKural } = await supabase
    .from('kurals')
    .select('*')
    .limit(1)
    .order('number', { ascending: false })
    .offset(Math.floor(Math.random() * 1330)); // Get a random kural

  return randomKural ? randomKural[0] : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');

  if (!question) {
    return NextResponse.json({ error: 'Question parameter is required' }, { status: 400 });
  }

  // 1. Check for direct Kural number or chapter/position
  const directKuralNumber = extractDirectKuralNumber(question);
  if (directKuralNumber) {
    const kural = await getKuralByNumber(directKuralNumber);
    if (kural) {
      return NextResponse.json({ kural });
    }
  }

  const chapterKuralNumber = extractChapterKuralQuery(question);
  if (chapterKuralNumber) {
    const kural = await getKuralByNumber(chapterKuralNumber);
    if (kural) {
      return NextResponse.json({ kural });
    }
  }

  // 2. Process for keyword-based search
  const keywords = extractKeywords(question);

  if (keywords.length === 0) {
    // If no meaningful keywords, return a random kural or a default one
    const { data: randomKural } = await supabase
      .from('kurals')
      .select('*')
      .limit(1)
      .order('number', { ascending: false })
      .offset(Math.floor(Math.random() * 1330));
    return NextResponse.json({ kural: randomKural ? randomKural[0] : null });
  }

  const bestKural = await findBestKural(keywords, question);

  if (bestKural) {
    return NextResponse.json({ kural: bestKural });
  } else {
    // Final fallback if findBestKural returns null
    const { data: randomKural } = await supabase
      .from('kurals')
      .select('*')
      .limit(1)
      .order('number', { ascending: false })
      .offset(Math.floor(Math.random() * 1330));
    return NextResponse.json({ kural: randomKural ? randomKural[0] : null });
  }
}
