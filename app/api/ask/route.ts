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

// Comprehensive synonym map — 481 unique keys, zero duplicates
const SYNONYMS: Record<string, string[]> = {

  // Ch1: God / Faith — do NOT expand to virtue to avoid pollution
  god: ['god','prayer','faith','worship','divine','blessing'],
  prayer: ['god','prayer','faith','worship'],
  faith: ['god','prayer','faith','worship'],
  worship: ['god','prayer','faith','worship'],
  divine: ['god','divine','faith','blessing'],
  bless: ['god','blessing','faith'],
  blessed: ['god','blessing','faith'],
  spiritual: ['god','penance','faith','spiritual'],
  religion: ['god','prayer','faith'],
  temple: ['god','prayer','faith'],
  rain: ['rain','nature','farming'],
  drought: ['rain','nature','poverty'],
  nature: ['rain','nature','farming'],
  environment: ['rain','nature','farming'],
  water: ['rain','nature','health'],
  virtue: ['virtue','ethics','morality'],
  moral: ['virtue','ethics','morality'],
  ethics: ['virtue','ethics','morality'],
  righteous: ['virtue','ethics','morality'],
  integrity: ['virtue','ethics','morality'],
  honesty: ['virtue','ethics','truth'],
  lie: ['truth','fraud','honesty'],
  lying: ['truth','fraud','honesty'],
  corrupt: ['virtue','ethics','governance'],
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
  children: ['children','domestic','joy'],
  child: ['children','domestic','joy'],
  baby: ['children','domestic','love'],
  parenting: ['children','domestic','family'],
  birth: ['children','domestic','family'],
  pregnancy: ['children','domestic','family'],
  love: ['love','joy','domestic'],
  affection: ['love','joy','kindness'],
  romance: ['love','joy','separation'],
  heartbroken: ['love','grief','separation'],
  breakup: ['love','separation','grief'],
  crush: ['love','joy','separation'],
  unrequited: ['love','separation','grief'],
  hospitality: ['hospitality','generosity','kindness'],
  guest: ['hospitality','generosity','kindness'],
  host: ['hospitality','generosity','kindness'],
  generous: ['generosity','kindness','hospitality'],
  generosity: ['generosity','kindness','hospitality'],
  donate: ['giving','generosity','kindness'],
  charity: ['giving','generosity','compassion'],
  share: ['giving','generosity','kindness'],
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
  gratitude: ['gratitude','thankfulness','kindness'],
  grateful: ['gratitude','thankfulness','kindness'],
  thankful: ['gratitude','thankfulness','kindness'],
  ungrateful: ['gratitude','thankfulness','betrayal'],
  thanks: ['gratitude','thankfulness','kindness'],
  appreciate: ['gratitude','thankfulness','kindness'],
  fair: ['impartiality','justice','virtue'],
  fairness: ['impartiality','justice','virtue'],
  bias: ['impartiality','justice','virtue'],
  equality: ['impartiality','justice','virtue'],
  equal: ['impartiality','justice','virtue'],
  discrimination: ['impartiality','justice','virtue'],
  selfcontrol: ['self-control','patience','virtue'],
  discipline: ['self-control','virtue','action'],
  temptation: ['self-control','desire','virtue'],
  impulse: ['self-control','anger','virtue'],
  restraint: ['self-control','patience','virtue'],
  control: ['self-control','patience','virtue'],
  conduct: ['virtue','ethics','action'],
  behaviour: ['virtue','ethics','action'],
  sin: ['virtue','ethics','evil'],
  evil: ['virtue','ethics','evil'],
  wrong: ['virtue','ethics','wrong'],
  mistake: ['virtue','ethics','correction'],
  regret: ['virtue','ethics','grief'],
  guilt: ['shame','virtue','ethics'],
  shame: ['shame','virtue','modesty'],
  kill: ['killing','compassion','virtue'],
  violence: ['violence','compassion','virtue'],
  nonviolence: ['compassion','virtue','killing'],
  meat: ['abstaining','virtue','compassion'],
  vegetarian: ['abstaining','virtue','compassion'],
  vegan: ['abstaining','virtue','compassion'],
  animal: ['compassion','killing','virtue'],
  cruelty: ['cruelty','compassion','virtue'],
  cruel: ['cruelty','compassion','virtue'],
  criticize: ['slander','speech','arrogance'],
  mock: ['slander','speech','arrogance'],
  ridicule: ['slander','speech','arrogance'],
  humiliate: ['slander','shame','arrogance'],
  bully: ['slander','arrogance','violence'],
  dread: ['fear','virtue','evil'],
  consequence: ['virtue','ethics','action'],
  karma: ['virtue','ethics','action'],
  give: ['giving','generosity','kindness'],
  giving: ['giving','generosity','kindness'],
  duty: ['duty','virtue','action'],
  responsibility: ['duty','virtue','action'],
  volunteer: ['giving','duty','kindness'],
  fame: ['renown','reputation','virtue'],
  famous: ['renown','reputation','virtue'],
  reputation: ['renown','reputation','virtue'],
  respect: ['renown','reputation','virtue'],
  honour: ['renown','reputation','virtue'],
  honor: ['renown','reputation','virtue'],
  recognition: ['renown','reputation','virtue'],
  legacy: ['renown','reputation','virtue'],
  compassion: ['compassion','kindness','love'],
  empathy: ['compassion','kindness','love'],
  sympathy: ['compassion','kindness','love'],
  mercy: ['compassion','kindness','virtue'],
  pity: ['compassion','kindness','suffering'],
  penance: ['penance','virtue','spiritual'],
  meditation: ['penance','wisdom','peace'],
  practice: ['penance','virtue','action'],
  fasting: ['penance','virtue','abstaining'],
  cheat: ['fraud','truth','betrayal'],
  fraud: ['fraud','truth','virtue'],
  deceive: ['fraud','truth','betrayal'],
  deception: ['fraud','truth','betrayal'],
  fake: ['fraud','truth','virtue'],
  pretend: ['fraud','truth','virtue'],
  hypocrisy: ['fraud','truth','virtue'],
  hypocrite: ['fraud','truth','virtue'],
  truth: ['truth','virtue','honesty'],
  truthful: ['truth','virtue','honesty'],
  honest: ['truth','virtue','honesty'],
  promise: ['truth','virtue','honesty'],
  vow: ['truth','virtue','honesty'],
  reality: ['truth','wisdom','virtue'],
  insight: ['wisdom','truth','knowledge'],
  angry: ['anger','self-control','virtue'],
  anger: ['anger','self-control','virtue'],
  rage: ['anger','self-control','virtue'],
  furious: ['anger','self-control','virtue'],
  irritated: ['anger','self-control','virtue'],
  temper: ['anger','self-control','virtue'],
  frustrated: ['frustration','anger','effort'],
  frustration: ['anger','effort','self-control'],
  death: ['impermanence','fate','grief'],
  die: ['impermanence','fate','grief'],
  dead: ['impermanence','fate','grief'],
  loss: ['impermanence','grief','suffering'],
  grief: ['grief','suffering','impermanence'],
  mourn: ['grief','suffering','impermanence'],
  mortality: ['impermanence','fate','virtue'],
  life: ['impermanence','virtue','fate'],
  time: ['impermanence','time','fate'],
  renounce: ['renunciation','penance','virtue'],
  detach: ['renunciation','wisdom','peace'],
  attachment: ['renunciation','desire','love'],
  letting: ['renunciation','wisdom','peace'],
  desire: ['desire','greed','self-control'],
  greed: ['greed','desire','wealth'],
  greedy: ['greed','desire','wealth'],
  lust: ['desire','greed','lust'],
  possessive: ['desire','greed','self-control'],
  jealous: ['jealousy','desire','self-control'],
  jealousy: ['jealousy','desire','self-control'],
  envy: ['jealousy','desire','self-control'],
  envious: ['jealousy','desire','self-control'],
  compare: ['jealousy','desire','self-control'],
  fate: ['fate','impermanence','virtue'],
  destiny: ['fate','impermanence','virtue'],
  luck: ['fate','fortune','virtue'],
  fortune: ['fate','fortune','wealth'],
  unlucky: ['fate','fortune','suffering'],
  accident: ['fate','impermanence','suffering'],
  chance: ['fate','fortune','action'],

  // BOOK OF WEALTH
  king: ['governance','leadership','royalty'],
  ruler: ['governance','leadership','royalty'],
  govern: ['governance','leadership','royalty'],
  government: ['governance','leadership','justice'],
  politics: ['governance','leadership','justice'],
  politician: ['governance','leadership','justice'],
  election: ['governance','leadership','justice'],
  democracy: ['governance','justice','leadership'],
  minister: ['governance','leadership','royalty'],
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
  naive: ['foolishness','ignorance','wisdom'],
  reckless: ['foolishness','action','wisdom'],
  careless: ['foolishness','action','wisdom'],
  listen: ['listening','wisdom','knowledge'],
  hear: ['listening','wisdom','knowledge'],
  advice: ['listening','wisdom','knowledge'],
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
  fault: ['correction','virtue','wisdom'],
  flaw: ['correction','virtue','wisdom'],
  improve: ['correction','virtue','action'],
  growth: ['correction','virtue','action'],
  feedback: ['correction','wisdom','speech'],
  criticism: ['correction','speech','wisdom'],
  greatness: ['greatness','virtue','wisdom'],
  noble: ['nobility','virtue','greatness'],
  nobility: ['nobility','virtue','greatness'],
  dignity: ['nobility','virtue','greatness'],
  lazy: ['laziness','action','sloth'],
  laziness: ['laziness','action','sloth'],
  procrastinate: ['laziness','action','sloth'],
  idle: ['laziness','action','sloth'],
  inactive: ['laziness','action','sloth'],
  sloth: ['laziness','action','sloth'],
  sluggish: ['laziness','action','sloth'],
  unmotivated: ['laziness','action','energy'],
  active: ['action','energy','diligence'],
  diligent: ['diligence','action','energy'],
  diligence: ['diligence','action','energy'],
  persistent: ['perseverance','action','energy'],
  firm: ['firmness','action','perseverance'],
  timing: ['time','action','wisdom'],
  opportunity: ['time','action','wisdom'],
  moment: ['time','impermanence','action'],
  friend: ['friendship','love','loyalty'],
  friends: ['friendship','love','loyalty'],
  friendship: ['friendship','love','loyalty'],
  loyal: ['friendship','love','loyalty'],
  loyalty: ['friendship','love','loyalty'],
  betrayal: ['betrayal','friendship','truth'],
  betray: ['betrayal','friendship','truth'],
  betrayed: ['betrayal','friendship','truth'],
  backstab: ['betrayal','friendship','slander'],
  cheating: ['betrayal','friendship','truth'],
  toxic: ['bad-friendship','anger','betrayal'],
  colleague: ['friendship','work','loyalty'],
  team: ['friendship','leadership','action'],
  enemy: ['enmity','wisdom','courage'],
  enemies: ['enmity','wisdom','courage'],
  rival: ['enmity','wisdom','competition'],
  compete: ['enmity','action','competition'],
  competition: ['enmity','action','wisdom'],
  conflict: ['enmity','anger','wisdom'],
  fight: ['enmity','anger','violence'],
  action: ['action','energy','diligence'],
  energy: ['energy','action','perseverance'],
  effort: ['effort','action','energy'],
  hardwork: ['effort','action','perseverance'],
  succeed: ['effort','action','perseverance'],
  success: ['effort','action','perseverance'],
  achieve: ['effort','action','perseverance'],
  goal: ['effort','action','wisdom'],
  motivation: ['energy','action','perseverance'],
  motivate: ['energy','action','perseverance'],
  inspire: ['energy','leadership','action'],
  persevere: ['perseverance','effort','strength'],
  perseverance: ['perseverance','effort','strength'],
  persist: ['perseverance','effort','strength'],
  resilience: ['perseverance','strength','courage'],
  resilient: ['perseverance','strength','courage'],
  overcome: ['perseverance','courage','strength'],
  survive: ['perseverance','strength','fate'],
  obstacle: ['perseverance','courage','action'],
  challenge: ['perseverance','courage','action'],
  failure: ['perseverance','effort','grief'],
  fail: ['perseverance','effort','grief'],
  perfect: ['perfection','virtue','greatness'],
  perfection: ['perfection','virtue','greatness'],
  excellence: ['perfection','virtue','greatness'],
  eloquent: ['eloquence','speech','wisdom'],
  eloquence: ['eloquence','speech','wisdom'],
  persuade: ['eloquence','speech','wisdom'],
  debate: ['eloquence','speech','wisdom'],
  presentation: ['eloquence','speech','wisdom'],
  interview: ['eloquence','speech','wisdom'],
  courage: ['courage','strength','perseverance'],
  courageous: ['courage','strength','perseverance'],
  brave: ['courage','strength','perseverance'],
  fear: ['fear','courage','strength'],
  afraid: ['fear','courage','strength'],
  scared: ['fear','courage','strength'],
  coward: ['fear','courage','strength'],
  daring: ['courage','strength','action'],
  anxiety: ['fear','peace','health'],
  anxious: ['fear','peace','health'],
  worry: ['fear','peace','health'],
  worried: ['fear','peace','health'],
  kind: ['kindness','compassion','love'],
  kindness: ['kindness','compassion','love'],
  benevolent: ['kindness','compassion','love'],
  caring: ['kindness','compassion','love'],
  warm: ['kindness','compassion','love'],
  help: ['kindness','compassion','hospitality'],
  support: ['kindness','friendship','compassion'],
  endure: ['endurance','perseverance','strength'],
  endurance: ['endurance','perseverance','strength'],
  patience: ['patience','endurance','self-control'],
  patient: ['patience','endurance','self-control'],
  impatient: ['patience','self-control','anger'],
  tolerance: ['endurance','patience','self-control'],
  tolerate: ['endurance','patience','self-control'],
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
  starve: ['poverty','suffering','wealth'],
  hungry: ['poverty','suffering','health'],
  homeless: ['poverty','suffering','wealth'],
  struggle: ['poverty','suffering','perseverance'],
  alcohol: ['alcohol','vice','virtue'],
  drink: ['alcohol','vice','virtue'],
  drunk: ['alcohol','vice','virtue'],
  addiction: ['alcohol','vice','self-control'],
  addicted: ['alcohol','vice','self-control'],
  gambling: ['gambling','vice','virtue'],
  gamble: ['gambling','vice','virtue'],
  bet: ['gambling','vice','virtue'],
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
  stressed: ['suffering','peace','health'],
  stress: ['suffering','peace','health'],
  overwhelmed: ['suffering','peace','health'],
  burnout: ['effort','laziness','health'],
  exhausted: ['effort','perseverance','health'],
  hurt: ['suffering','grief','love'],
  ache: ['suffering','grief','health'],
  aching: ['suffering','grief','health'],
  sorrow: ['grief','suffering','impermanence'],
  sad: ['grief','suffering','love'],
  crying: ['grief','suffering','love'],
  justice: ['justice','governance','virtue'],
  judge: ['justice','governance','wisdom'],
  law: ['justice','governance','virtue'],
  legal: ['justice','governance','virtue'],
  crime: ['justice','virtue','evil'],
  criminal: ['justice','virtue','evil'],
  punishment: ['justice','governance','virtue'],
  forbidden: ['desire','virtue','lust'],
  affair: ['lust','love','betrayal'],

  // BOOK OF LOVE
  beautiful: ['beauty','love','joy'],
  beauty: ['beauty','love','joy'],
  attraction: ['love','beauty','desire'],
  propose: ['love','declaration','joy'],
  confession: ['love','declaration','truth'],
  separation: ['separation','love','grief'],
  separated: ['separation','love','grief'],
  apart: ['separation','love','loneliness'],
  miss: ['separation','love','loneliness'],
  missing: ['separation','love','loneliness'],
  longing: ['yearning','love','separation'],
  reunion: ['reunion','love','joy'],
  united: ['reunion','love','joy'],
  together: ['reunion','love','joy'],
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

  // CROSS-CUTTING
  leader: ['leadership','governance','wisdom'],
  leadership: ['leadership','governance','wisdom'],
  manage: ['leadership','governance','action'],
  manager: ['leadership','governance','action'],
  boss: ['leadership','governance','action'],
  ceo: ['leadership','governance','action'],
  captain: ['leadership','courage','action'],
  neighbour: ['friendship','kindness','hospitality'],
  neighbor: ['friendship','kindness','hospitality'],
  society: ['duty','virtue','governance'],
  community: ['duty','virtue','kindness'],
  social: ['duty','virtue','society'],
  strong: ['strength','perseverance','courage'],
  weak: ['strength','perseverance','fate'],
  strength: ['strength','perseverance','courage'],
  difficult: ['perseverance','courage','suffering'],
  hard: ['effort','perseverance','action'],
  farm: ['farming','action','effort'],
  farming: ['farming','action','effort'],
  harvest: ['farming','action','wealth'],
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
  const english  = ((kural.english as string) || '').toLowerCase();
  const chapter  = ((kural.chapter_english as string) || '').toLowerCase();
  const themes   = ((kural.themes as string[]) || []).join(' ').toLowerCase();

  for (const kw of keywords) {
    if (kw.length < 3) continue;
    if (chapter === kw)        score += 20; // exact chapter name
    if (chapter.includes(kw))  score += 10; // partial chapter match
    if (themes.includes(kw))   score += 8;  // theme match — boosted
    if (english.includes(kw))  score += 3;  // english text match
  }
  return score;
}

async function findBestKural(keywords: string[]) {
  const queryString = keywords.join(' ');
  let candidates: Record<string, unknown>[] = [];

  // Strategy 1: chapter_english exact/partial match — most precise
  for (const kw of keywords) {
    if (kw.length < 3) continue;
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('chapter_english', `%${kw}%`)
      .limit(20);
    if (data && data.length > 0) candidates.push(...data);
  }

  // Strategy 2: themes overlap
  const { data: themeData } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(20);
  if (themeData) candidates.push(...themeData);

  // Strategy 3: full-text search
  const { data: ftData } = await supabase
    .from('kurals')
    .select('*')
    .textSearch('search_vector', queryString, { type: 'plain', config: 'english' })
    .limit(20);
  if (ftData) candidates.push(...ftData);

  // Strategy 4: ILIKE on english meaning
  for (const kw of keywords.slice(0, 3)) {
    if (kw.length < 3) continue;
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(10);
    if (data) candidates.push(...data);
  }

  // Deduplicate by number
  const seen = new Set<number>();
  candidates = candidates.filter(k => {
    const n = k.number as number;
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });

  if (candidates.length === 0) {
    // Final fallback: random
    const { data: all } = await supabase.from('kurals').select('*').limit(100);
    if (all && all.length > 0) return all[Math.floor(Math.random() * all.length)];
    return null;
  }

  // Score all candidates
  const scored = candidates
    .map(k => ({ kural: k, score: scoreKural(k, keywords) }))
    .sort((a, b) => b.score - a.score);

  // Randomise only among tied top scorers
  const topScore = scored[0].score;
  const tied = scored.filter(s => s.score === topScore);
  return tied[Math.floor(Math.random() * tied.length)].kural;
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
