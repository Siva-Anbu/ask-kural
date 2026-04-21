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

// Comprehensive synonym map covering all 133 Thirukkural chapters
const SYNONYMS: Record<string, string[]> = {

  // ── BOOK OF VIRTUE ──────────────────────────────────────────────

  // Ch1: Praise of God / Faith
  god: ['god','virtue','faith'],
  prayer: ['god','virtue','faith'],
  faith: ['god','virtue','faith'],
  worship: ['god','virtue','faith'],
  divine: ['god','virtue','faith'],
  bless: ['god','virtue','faith'],
  blessed: ['god','virtue','blessing'],
  spiritual: ['god','virtue','faith'],
  religion: ['god','virtue','faith'],
  temple: ['god','virtue','faith'],

  // Ch2: Rain / Nature
  rain: ['rain','nature','farming'],
  drought: ['rain','nature','poverty'],
  nature: ['rain','nature','farming'],
  environment: ['rain','nature','farming'],
  water: ['rain','nature','health'],

  // Ch3-4: Virtue / Ethics / Morality
  virtue: ['virtue','ethics','morality'],
  moral: ['virtue','ethics','morality'],
  ethics: ['virtue','ethics','morality'],
  righteous: ['virtue','ethics','morality'],
  integrity: ['virtue','ethics','morality'],
  honest: ['virtue','ethics','truth'],
  honesty: ['virtue','ethics','truth'],
  truth: ['truth','virtue','honesty'],
  truthful: ['truth','virtue','honesty'],
  lie: ['truth','fraud','honesty'],
  lying: ['truth','fraud','honesty'],
  cheat: ['fraud','truth','betrayal'],
  corrupt: ['virtue','ethics','governance'],

  // Ch5-6: Domestic Life / Good Wife / Family
  family: ['domestic','love','children'],
  home: ['domestic','love','family'],
  house: ['domestic','love','family'],
  wife: ['domestic','love','marriage'],
  husband: ['domestic','love','marriage'],
  marriage: ['love','domestic','marriage'],
  married: ['love','domestic','marriage'],
  divorce: ['love','separation','marriage'],
  relationship: ['love','friendship','domestic'],
  parent: ['domestic','children','family'],
  parents: ['domestic','children','family'],
  mother: ['domestic','love','children'],
  father: ['domestic','love','children'],
  son: ['children','domestic','love'],
  daughter: ['children','domestic','love'],

  // Ch7: Children / Parenting
  children: ['children','domestic','joy'],
  child: ['children','domestic','joy'],
  baby: ['children','domestic','love'],
  parenting: ['children','domestic','family'],
  birth: ['children','domestic','family'],
  pregnancy: ['children','domestic','family'],

  // Ch8: Love
  love: ['love','joy','domestic'],
  affection: ['love','joy','kindness'],
  romance: ['love','joy','separation'],
  heartbroken: ['love','grief','separation'],
  breakup: ['love','separation','grief'],
  miss: ['love','separation','loneliness'],
  crush: ['love','joy','separation'],
  unrequited: ['love','separation','grief'],

  // Ch9: Hospitality / Generosity
  hospitality: ['hospitality','generosity','kindness'],
  guest: ['hospitality','generosity','kindness'],
  host: ['hospitality','generosity','kindness'],
  generous: ['generosity','kindness','hospitality'],
  generosity: ['generosity','kindness','hospitality'],
  donate: ['giving','generosity','kindness'],
  charity: ['giving','generosity','compassion'],
  share: ['giving','generosity','kindness'],

  // Ch10: Kind Words / Speech
  speak: ['speech','words','eloquence'],
  speech: ['speech','words','eloquence'],
  words: ['speech','words','eloquence'],
  language: ['speech','words','eloquence'],
  communication: ['speech','words','eloquence'],
  talk: ['speech','words','eloquence'],
  silence: ['silence','wisdom','speech'],
  quiet: ['silence','wisdom','peace'],
  harsh: ['speech','anger','arrogance'],
  insult: ['speech','arrogance','anger'],
  abuse: ['speech','anger','arrogance'],
  gossip: ['speech','slander','friendship'],
  slander: ['slander','speech','friendship'],
  rumour: ['slander','speech','gossip'],
  backbite: ['slander','speech','friendship'],

  // Ch11: Gratitude
  gratitude: ['gratitude','thankfulness','kindness'],
  grateful: ['gratitude','thankfulness','kindness'],
  thankful: ['gratitude','thankfulness','kindness'],
  ungrateful: ['gratitude','thankfulness','betrayal'],
  thanks: ['gratitude','thankfulness','kindness'],

  // Ch12: Impartiality / Fairness
  fair: ['impartiality','justice','virtue'],
  fairness: ['impartiality','justice','virtue'],
  bias: ['impartiality','justice','virtue'],
  equality: ['impartiality','justice','virtue'],
  equal: ['impartiality','justice','virtue'],
  discrimination: ['impartiality','justice','virtue'],

  // Ch13: Self Control
  selfcontrol: ['self-control','patience','virtue'],
  discipline: ['self-control','virtue','action'],
  temptation: ['self-control','desire','virtue'],
  impulse: ['self-control','anger','virtue'],
  restraint: ['self-control','patience','virtue'],
  control: ['self-control','patience','virtue'],

  // Ch14-18: Right Conduct / Not Doing Evil
  conduct: ['virtue','ethics','action'],
  behaviour: ['virtue','ethics','action'],
  sin: ['virtue','ethics','evil'],
  evil: ['virtue','ethics','evil'],
  wrong: ['virtue','ethics','wrong'],
  mistake: ['virtue','ethics','correction'],
  regret: ['virtue','ethics','grief'],
  shame: ['shame','virtue','ethics'],
  guilt: ['shame','virtue','ethics'],

  // Ch17: Not Killing / Compassion / Vegetarianism
  kill: ['killing','compassion','virtue'],
  violence: ['violence','compassion','virtue'],
  nonviolence: ['compassion','virtue','killing'],
  meat: ['abstaining','virtue','compassion'],
  vegetarian: ['abstaining','virtue','compassion'],
  vegan: ['abstaining','virtue','compassion'],
  animal: ['compassion','killing','virtue'],
  cruelty: ['cruelty','compassion','virtue'],
  cruel: ['cruelty','compassion','virtue'],

  // Ch19-20: Not Slandering / Speaking Ill
  criticize: ['slander','speech','arrogance'],
  mock: ['slander','speech','arrogance'],
  ridicule: ['slander','speech','arrogance'],
  humiliate: ['slander','shame','arrogance'],
  bully: ['slander','arrogance','violence'],

  // Ch21: Dread of Evil Deeds
  dread: ['fear','virtue','evil'],
  consequence: ['virtue','ethics','action'],
  karma: ['virtue','ethics','action'],

  // Ch22-23: Giving / Duty to Society
  give: ['giving','generosity','kindness'],
  giving: ['giving','generosity','kindness'],
  social: ['duty','virtue','society'],
  duty: ['duty','virtue','action'],
  responsibility: ['duty','virtue','action'],
  volunteer: ['giving','duty','kindness'],

  // Ch24: Renown / Fame
  fame: ['renown','reputation','virtue'],
  famous: ['renown','reputation','virtue'],
  reputation: ['renown','reputation','virtue'],
  respect: ['renown','reputation','virtue'],
  honour: ['renown','reputation','virtue'],
  honor: ['renown','reputation','virtue'],
  recognition: ['renown','reputation','virtue'],
  legacy: ['renown','reputation','virtue'],

  // Ch25: Compassion
  compassion: ['compassion','kindness','love'],
  empathy: ['compassion','kindness','love'],
  sympathy: ['compassion','kindness','love'],
  mercy: ['compassion','kindness','virtue'],
  pity: ['compassion','kindness','suffering'],

  // Ch27: Penance / Spiritual practice
  penance: ['penance','virtue','spiritual'],
  meditation: ['penance','wisdom','peace'],
  practice: ['penance','virtue','action'],
  fasting: ['penance','virtue','abstaining'],

  // Ch28-29: Fraud / Deception
  fraud: ['fraud','truth','virtue'],
  deceive: ['fraud','truth','betrayal'],
  deception: ['fraud','truth','betrayal'],
  fake: ['fraud','truth','virtue'],
  pretend: ['fraud','truth','virtue'],
  hypocrisy: ['fraud','truth','virtue'],
  hypocrite: ['fraud','truth','virtue'],

  // Ch30: Truth / Veracity
  truth: ['truth','virtue','honesty'],
  truthful: ['truth','virtue','honesty'],
  honest: ['truth','virtue','honesty'],
  promise: ['truth','virtue','honesty'],
  vow: ['truth','virtue','honesty'],

  // Ch31/78: Avoidance of Anger
  angry: ['anger','self-control','virtue'],
  anger: ['anger','self-control','virtue'],
  rage: ['anger','self-control','virtue'],
  furious: ['anger','self-control','virtue'],
  irritated: ['anger','self-control','virtue'],
  temper: ['anger','self-control','virtue'],
  frustrated: ['frustration','anger','effort'],
  frustration: ['anger','effort','self-control'],

  // Ch34: Impermanence / Death
  death: ['impermanence','fate','grief'],
  die: ['impermanence','fate','grief'],
  dead: ['impermanence','fate','grief'],
  loss: ['impermanence','grief','suffering'],
  grief: ['grief','suffering','impermanence'],
  mourn: ['grief','suffering','impermanence'],
  mortality: ['impermanence','fate','virtue'],
  life: ['impermanence','virtue','fate'],
  time: ['impermanence','time','fate'],
  short: ['impermanence','time','fate'],

  // Ch35: Renunciation / Detachment
  renounce: ['renunciation','penance','virtue'],
  detach: ['renunciation','wisdom','peace'],
  attachment: ['renunciation','desire','love'],
  letting: ['renunciation','wisdom','peace'],

  // Ch36: Knowledge of Truth
  truth: ['truth','wisdom','virtue'],
  reality: ['truth','wisdom','virtue'],
  insight: ['wisdom','truth','knowledge'],

  // Ch37: Curbing Desire / Greed
  desire: ['desire','greed','self-control'],
  greed: ['greed','desire','wealth'],
  greedy: ['greed','desire','wealth'],
  lust: ['desire','greed','lust'],
  possessive: ['desire','greed','self-control'],
  jealous: ['jealousy','desire','self-control'],
  jealousy: ['jealousy','desire','self-control'],
  envy: ['jealousy','desire','self-control'],

  // Ch38: Fate / Destiny
  fate: ['fate','impermanence','virtue'],
  destiny: ['fate','impermanence','virtue'],
  luck: ['fate','fortune','virtue'],
  fortune: ['fate','fortune','wealth'],
  unlucky: ['fate','fortune','suffering'],
  accident: ['fate','impermanence','suffering'],
  chance: ['fate','fortune','action'],

  // ── BOOK OF WEALTH ──────────────────────────────────────────────

  // Ch39: Royalty / Governance
  king: ['governance','leadership','royalty'],
  ruler: ['governance','leadership','royalty'],
  govern: ['governance','leadership','royalty'],
  government: ['governance','leadership','justice'],
  politics: ['governance','leadership','justice'],
  politician: ['governance','leadership','justice'],
  election: ['governance','leadership','justice'],
  democracy: ['governance','justice','leadership'],
  minister: ['governance','leadership','royalty'],

  // Ch40-41: Learning / Ignorance
  learn: ['knowledge','education','wisdom'],
  learning: ['knowledge','education','wisdom'],
  education: ['knowledge','education','wisdom'],
  study: ['knowledge','education','wisdom'],
  school: ['knowledge','education','wisdom'],
  university: ['knowledge','education','wisdom'],
  college: ['knowledge','education','wisdom'],
  degree: ['knowledge','education','wisdom'],
  read: ['knowledge','education','wisdom'],
  book: ['knowledge','education','wisdom'],
  ignorant: ['ignorance','knowledge','wisdom'],
  ignorance: ['ignorance','knowledge','wisdom'],
  uneducated: ['ignorance','knowledge','education'],
  stupid: ['ignorance','knowledge','wisdom'],
  foolish: ['foolishness','ignorance','wisdom'],
  fool: ['foolishness','ignorance','wisdom'],

  // Ch42: Listening
  listen: ['listening','wisdom','knowledge'],
  hear: ['listening','wisdom','knowledge'],
  advice: ['listening','wisdom','knowledge'],

  // Ch43: Wisdom
  wisdom: ['wisdom','knowledge','virtue'],
  wise: ['wisdom','knowledge','virtue'],
  smart: ['wisdom','knowledge','education'],
  intelligent: ['wisdom','knowledge','education'],
  clever: ['wisdom','knowledge','education'],
  confused: ['wisdom','knowledge','ignorance'],
  lost: ['wisdom','knowledge','guidance'],
  guidance: ['wisdom','knowledge','leadership'],
  decision: ['wisdom','knowledge','action'],
  handle: ['wisdom','action','leadership'],
  tackle: ['wisdom','action','enemy'],

  // Ch44: Correction of Faults
  fault: ['correction','virtue','wisdom'],
  flaw: ['correction','virtue','wisdom'],
  improve: ['correction','virtue','action'],
  growth: ['correction','virtue','action'],
  feedback: ['correction','wisdom','speech'],
  criticism: ['correction','speech','wisdom'],

  // Ch45: Greatness of Mind
  greatness: ['greatness','virtue','wisdom'],
  noble: ['nobility','virtue','greatness'],
  nobility: ['nobility','virtue','greatness'],
  dignity: ['nobility','virtue','greatness'],

  // Ch46-48: Avoiding Sloth / Firmness / Strength of Action
  lazy: ['laziness','action','sloth'],
  laziness: ['laziness','action','sloth'],
  procrastinate: ['laziness','action','sloth'],
  idle: ['laziness','action','sloth'],
  inactive: ['laziness','action','sloth'],
  sloth: ['laziness','action','sloth'],
  active: ['action','energy','diligence'],
  diligent: ['diligence','action','energy'],
  diligence: ['diligence','action','energy'],
  persistent: ['perseverance','action','energy'],
  persistent: ['perseverance','action','energy'],
  firm: ['firmness','action','perseverance'],

  // Ch49-50: Knowing the Time / Place
  timing: ['time','action','wisdom'],
  opportunity: ['time','action','wisdom'],
  opportun: ['time','action','wisdom'],
  right: ['time','wisdom','virtue'],
  moment: ['time','impermanence','action'],

  // Ch51-55: Selection of Men / Friendship / Bad Friendship
  friend: ['friendship','love','loyalty'],
  friends: ['friendship','love','loyalty'],
  friendship: ['friendship','love','loyalty'],
  loyal: ['friendship','love','loyalty'],
  loyalty: ['friendship','love','loyalty'],
  betrayal: ['betrayal','friendship','truth'],
  betray: ['betrayal','friendship','truth'],
  backstab: ['betrayal','friendship','slander'],
  toxic: ['bad-friendship','anger','betrayal'],
  bad: ['bad-friendship','enemy','virtue'],
  colleague: ['friendship','work','loyalty'],
  team: ['friendship','leadership','action'],
  colleague: ['friendship','work','loyalty'],

  // Ch56: Foolishness
  foolish: ['foolishness','ignorance','wisdom'],
  fool: ['foolishness','ignorance','wisdom'],
  reckless: ['foolishness','action','wisdom'],
  careless: ['foolishness','action','wisdom'],
  naive: ['foolishness','ignorance','wisdom'],

  // Ch57: Enmity
  enemy: ['enmity','wisdom','courage'],
  enemies: ['enmity','wisdom','courage'],
  rival: ['enmity','wisdom','competition'],
  compete: ['enmity','action','competition'],
  competition: ['enmity','action','wisdom'],
  conflict: ['enmity','anger','wisdom'],
  fight: ['enmity','anger','violence'],

  // Ch58-62: Timely Action / Diligence / Energy
  action: ['action','energy','diligence'],
  energy: ['energy','action','perseverance'],
  effort: ['effort','action','energy'],
  hard: ['effort','action','perseverance'],
  hardwork: ['effort','action','perseverance'],
  succeed: ['effort','action','perseverance'],
  success: ['effort','action','perseverance'],
  achieve: ['effort','action','perseverance'],
  goal: ['effort','action','wisdom'],

  // Ch63: Perseverance
  persevere: ['perseverance','effort','strength'],
  perseverance: ['perseverance','effort','strength'],
  persist: ['perseverance','effort','strength'],
  resilience: ['perseverance','strength','courage'],
  resilient: ['perseverance','strength','courage'],
  bounce: ['perseverance','strength','courage'],
  overcome: ['perseverance','courage','strength'],
  survive: ['perseverance','strength','fate'],

  // Ch65-66: Nobility / Perfection
  perfect: ['perfection','virtue','greatness'],
  perfection: ['perfection','virtue','greatness'],
  excellence: ['perfection','virtue','greatness'],

  // Ch71: Eloquence
  eloquent: ['eloquence','speech','wisdom'],
  eloquence: ['eloquence','speech','wisdom'],
  persuade: ['eloquence','speech','wisdom'],
  public: ['eloquence','speech','leadership'],
  debate: ['eloquence','speech','wisdom'],
  presentation: ['eloquence','speech','wisdom'],
  interview: ['eloquence','speech','wisdom'],

  // Ch73: Courage / Not Fearing
  courage: ['courage','strength','perseverance'],
  courageous: ['courage','strength','perseverance'],
  brave: ['courage','strength','perseverance'],
  fear: ['fear','courage','strength'],
  afraid: ['fear','courage','strength'],
  scared: ['fear','courage','strength'],
  coward: ['fear','courage','strength'],
  daring: ['courage','strength','action'],

  // Ch74: Benevolence / Kindness
  kind: ['kindness','compassion','love'],
  kindness: ['kindness','compassion','love'],
  benevolent: ['kindness','compassion','love'],
  caring: ['kindness','compassion','love'],
  warm: ['kindness','compassion','love'],

  // Ch75: Jealousy / Envy
  jealous: ['jealousy','desire','self-control'],
  jealousy: ['jealousy','desire','self-control'],
  envy: ['jealousy','desire','self-control'],
  envious: ['jealousy','desire','self-control'],
  compare: ['jealousy','desire','self-control'],

  // Ch77: Endurance in Trouble
  endure: ['endurance','perseverance','strength'],
  endurance: ['endurance','perseverance','strength'],
  patience: ['patience','endurance','self-control'],
  patient: ['patience','endurance','self-control'],
  impatient: ['patience','self-control','anger'],
  tolerance: ['endurance','patience','self-control'],
  tolerate: ['endurance','patience','self-control'],

  // Ch80: Avoiding Sloth
  sloth: ['laziness','action','sloth'],
  sluggish: ['laziness','action','sloth'],
  unmotivated: ['laziness','action','energy'],
  motivation: ['energy','action','perseverance'],
  motivate: ['energy','action','perseverance'],

  // Ch81: Kindness
  help: ['kindness','compassion','hospitality'],
  helping: ['kindness','compassion','hospitality'],
  support: ['kindness','friendship','compassion'],

  // Ch82: Shame / Modesty
  shame: ['shame','virtue','modesty'],
  modest: ['modesty','virtue','shame'],
  modesty: ['modesty','virtue','shame'],
  humble: ['modesty','virtue','shame'],
  humility: ['modesty','virtue','shame'],
  arrogant: ['arrogance','pride','shame'],
  arrogance: ['arrogance','pride','shame'],
  ego: ['arrogance','pride','shame'],
  pride: ['arrogance','pride','shame'],
  selfish: ['arrogance','selfishness','shame'],
  rude: ['arrogance','anger','shame'],

  // Ch83-84: Wealth / Giving
  wealth: ['wealth','poverty','generosity'],
  rich: ['wealth','giving','generosity'],
  money: ['wealth','giving','poverty'],
  poor: ['poverty','wealth','suffering'],
  poverty: ['poverty','wealth','suffering'],
  debt: ['poverty','wealth','suffering'],
  financial: ['wealth','poverty','action'],
  savings: ['wealth','action','future'],
  invest: ['wealth','action','future'],
  salary: ['wealth','work','action'],
  income: ['wealth','work','action'],
  jobless: ['wealth','effort','poverty'],
  unemployed: ['wealth','effort','poverty'],
  fired: ['effort','perseverance','poverty'],
  job: ['effort','wealth','action'],
  career: ['effort','wealth','action'],
  promotion: ['effort','wealth','action'],
  office: ['effort','wealth','action'],

  // Ch88: Poverty
  starve: ['poverty','suffering','wealth'],
  hungry: ['poverty','suffering','health'],
  homeless: ['poverty','suffering','wealth'],
  struggle: ['poverty','suffering','perseverance'],

  // Ch90-91: Avoiding Alcohol / Gambling
  alcohol: ['alcohol','vice','virtue'],
  drink: ['alcohol','vice','virtue'],
  drunk: ['alcohol','vice','virtue'],
  addiction: ['alcohol','vice','self-control'],
  addicted: ['alcohol','vice','self-control'],
  gambling: ['gambling','vice','virtue'],
  gamble: ['gambling','vice','virtue'],
  bet: ['gambling','vice','virtue'],

  // Ch92: Medicine / Health
  sick: ['health','suffering','medicine'],
  illness: ['health','suffering','medicine'],
  disease: ['health','suffering','medicine'],
  medicine: ['health','medicine','suffering'],
  doctor: ['health','medicine','wisdom'],
  hospital: ['health','medicine','suffering'],
  heal: ['health','medicine','perseverance'],
  healing: ['health','medicine','perseverance'],
  pain: ['suffering','health','grief'],
  painful: ['suffering','health','grief'],
  physical: ['health','body','suffering'],
  body: ['health','body','suffering'],
  recover: ['health','perseverance','medicine'],
  mental: ['health','peace','suffering'],
  depression: ['suffering','peace','health'],
  depressed: ['suffering','peace','health'],
  anxious: ['fear','peace','health'],
  anxiety: ['fear','peace','health'],
  stressed: ['suffering','peace','health'],
  stress: ['suffering','peace','health'],
  overwhelmed: ['suffering','peace','health'],
  burnout: ['effort','laziness','health'],
  exhausted: ['effort','perseverance','health'],
  hurt: ['suffering','grief','love'],
  ache: ['suffering','grief','health'],
  aching: ['suffering','grief','health'],
  sorrow: ['grief','suffering','impermanence'],

  // Ch97: Modesty
  modest: ['modesty','virtue','shame'],
  arrogant: ['arrogance','shame','virtue'],

  // Ch99: Gratitude
  grateful: ['gratitude','thankfulness','kindness'],
  thankful: ['gratitude','thankfulness','kindness'],
  appreciate: ['gratitude','thankfulness','kindness'],
  ungrateful: ['gratitude','betrayal','kindness'],

  // Ch101-108: Good Governance / Justice
  justice: ['justice','governance','virtue'],
  judge: ['justice','governance','wisdom'],
  law: ['justice','governance','virtue'],
  legal: ['justice','governance','virtue'],
  crime: ['justice','virtue','evil'],
  criminal: ['justice','virtue','evil'],
  punishment: ['justice','governance','virtue'],
  corrupt: ['virtue','governance','justice'],

  // Ch109: Forbidden Desire
  forbidden: ['desire','virtue','lust'],
  affair: ['lust','love','betrayal'],
  cheat: ['fraud','betrayal','lust'],

  // ── BOOK OF LOVE ────────────────────────────────────────────────

  // Ch110-113: Recognition / Joy of Union / Beauty / Declaration
  love: ['love','joy','separation'],
  affection: ['love','joy','kindness'],
  romance: ['love','joy','separation'],
  beautiful: ['beauty','love','joy'],
  beauty: ['beauty','love','joy'],
  attraction: ['love','beauty','desire'],
  propose: ['love','declaration','joy'],
  confession: ['love','declaration','truth'],

  // Ch115-120: Separation / Pining / Reunion
  separation: ['separation','love','grief'],
  separated: ['separation','love','grief'],
  apart: ['separation','love','loneliness'],
  miss: ['separation','love','loneliness'],
  missing: ['separation','love','loneliness'],
  long: ['separation','love','yearning'],
  longing: ['yearning','love','separation'],
  reunion: ['reunion','love','joy'],
  reunion: ['reunion','love','joy'],
  united: ['reunion','love','joy'],
  together: ['reunion','love','joy'],

  // Ch116-129: Love Separation themes
  lonely: ['loneliness','love','separation'],
  loneliness: ['loneliness','love','separation'],
  alone: ['loneliness','love','separation'],
  isolated: ['loneliness','friendship','separation'],
  homesick: ['loneliness','separation','home'],
  night: ['night','loneliness','love'],
  dream: ['dreaming','love','hope'],
  dreaming: ['dreaming','love','hope'],
  hope: ['hope','love','joy'],
  hopeful: ['hope','love','joy'],

  // Ch131-133: Sulking / Pleasures / Joy of Love
  happy: ['joy','happiness','love'],
  happiness: ['joy','happiness','love'],
  joyful: ['joy','happiness','love'],
  joy: ['joy','happiness','love'],
  cheerful: ['joy','happiness','love'],
  excited: ['joy','happiness','love'],
  content: ['joy','peace','happiness'],
  peaceful: ['peace','joy','happiness'],
  bliss: ['joy','happiness','peace'],
  smile: ['joy','happiness','love'],
  laugh: ['joy','happiness','love'],
  delighted: ['joy','happiness','love'],
  pleasure: ['joy','happiness','love'],
  sulk: ['sulking','love','anger'],
  pout: ['sulking','love','anger'],
  argument: ['sulking','anger','love'],

  // ── CROSS-CUTTING ───────────────────────────────────────────────

  // Leadership & Guidance
  leader: ['leadership','governance','wisdom'],
  leadership: ['leadership','governance','wisdom'],
  manage: ['leadership','governance','action'],
  manager: ['leadership','governance','action'],
  boss: ['leadership','governance','action'],
  ceo: ['leadership','governance','action'],
  captain: ['leadership','courage','action'],
  inspire: ['leadership','energy','action'],

  // Neighbour / Social
  neighbour: ['friendship','kindness','hospitality'],
  neighbor: ['friendship','kindness','hospitality'],
  society: ['duty','virtue','governance'],
  community: ['duty','virtue','kindness'],
  social: ['duty','virtue','society'],

  // Perseverance & Strength
  strong: ['strength','perseverance','courage'],
  weak: ['strength','perseverance','fate'],
  strength: ['strength','perseverance','courage'],
  obstacle: ['perseverance','courage','action'],
  challenge: ['perseverance','courage','action'],
  difficult: ['perseverance','courage','suffering'],
  hard: ['effort','perseverance','action'],
  failure: ['perseverance','effort','grief'],
  fail: ['perseverance','effort','grief'],

  // Farming / Work
  farm: ['farming','action','effort'],
  farming: ['farming','action','effort'],
  harvest: ['farming','action','wealth'],

  // Misc emotions
  proud: ['pride','arrogance','virtue'],
  bored: ['laziness','action','sloth'],
  annoyed: ['anger','self-control','patience'],
  upset: ['grief','anger','suffering'],
  calm: ['peace','self-control','patience'],
  trust: ['friendship','truth','loyalty'],
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
