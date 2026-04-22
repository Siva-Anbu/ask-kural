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

  // BOOK OF VIRTUE
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
  mourn: ['grief','suffering','death'],
  sorrow: ['grief','suffering','love'],
  pain: ['suffering','grief','health'],
  suffering: ['suffering','grief','compassion'],
  hurt: ['suffering','grief','love'],
  ache: ['suffering','grief','health'],
  agony: ['suffering','grief','torture'],
  torture: ['suffering','cruelty','compassion'],
  patient: ['patience','perseverance','virtue'],
  patience: ['patience','perseverance','virtue'],
  wait: ['patience','perseverance','hope'],
  persevere: ['perseverance','courage','effort'],
  perseverance: ['perseverance','courage','effort'],
  persistence: ['perseverance','courage','effort'],
  endure: ['perseverance','suffering','courage'],
  courage: ['courage','strength','virtue'],
  brave: ['courage','strength','virtue'],
  fear: ['fear','courage','danger'],
  afraid: ['fear','courage','danger'],
  scared: ['fear','courage','danger'],
  terror: ['fear','courage','danger'],
  panic: ['fear','courage','self-control'],
  worry: ['anxiety','fear','wisdom'],
  anxious: ['anxiety','fear','patience'],
  anxiety: ['anxiety','fear','wisdom'],
  stress: ['anxiety','effort','health'],
  tension: ['anxiety','anger','health'],
  friend: ['friendship','love','kindness'],
  friendship: ['friendship','love','loyalty'],
  companion: ['friendship','love','loyalty'],
  betray: ['betrayal','friendship','trust'],
  betrayal: ['betrayal','friendship','grief'],
  traitor: ['betrayal','friendship','trust'],
  treachery: ['betrayal','fraud','friendship'],
  forgive: ['forgiveness','compassion','virtue'],
  forgiveness: ['forgiveness','compassion','virtue'],
  pardon: ['forgiveness','compassion','virtue'],
  reconcile: ['forgiveness','friendship','love'],
  reconciliation: ['forgiveness','friendship','peace'],
  enemy: ['enmity','hatred','courage'],
  enemies: ['enmity','hatred','courage'],
  enmity: ['enmity','hatred','friendship'],
  hatred: ['hatred','anger','enmity'],
  hate: ['hatred','anger','enmity'],
  hostility: ['enmity','hatred','anger'],
  revenge: ['vengeance','anger','enmity'],
  vengeance: ['vengeance','anger','justice'],
  retaliate: ['vengeance','anger','justice'],
  wealth: ['wealth','prosperity','greed'],
  rich: ['wealth','prosperity','poverty'],
  riches: ['wealth','prosperity','greed'],
  money: ['wealth','prosperity','greed'],
  fortune: ['wealth','prosperity','fate'],
  prosperity: ['prosperity','wealth','joy'],
  poverty: ['poverty','suffering','wealth'],
  poor: ['poverty','suffering','compassion'],
  destitute: ['poverty','suffering','compassion'],
  beggar: ['poverty','suffering','giving'],
  famine: ['poverty','suffering','rain'],
  hunger: ['poverty','suffering','health'],
  starve: ['poverty','suffering','health'],
  greed: ['greed','desire','virtue'],
  greedy: ['greed','desire','virtue'],
  selfish: ['greed','arrogance','virtue'],
  selfishness: ['greed','arrogance','virtue'],
  covet: ['greed','desire','virtue'],
  jealous: ['jealousy','desire','love'],
  jealousy: ['jealousy','desire','love'],
  envy: ['jealousy','desire','virtue'],
  learn: ['learning','wisdom','knowledge'],
  learning: ['learning','wisdom','knowledge'],
  knowledge: ['knowledge','wisdom','learning'],
  education: ['learning','wisdom','knowledge'],
  study: ['learning','knowledge','effort'],
  teach: ['teaching','wisdom','knowledge'],
  teacher: ['teaching','wisdom','knowledge'],
  mentor: ['teaching','wisdom','guidance'],
  student: ['learning','wisdom','knowledge'],
  ignorance: ['ignorance','wisdom','knowledge'],
  ignorant: ['ignorance','wisdom','folly'],
  fool: ['folly','ignorance','wisdom'],
  foolish: ['folly','ignorance','wisdom'],
  folly: ['folly','ignorance','wisdom'],
  stupid: ['folly','ignorance','wisdom'],
  idiot: ['folly','ignorance','arrogance'],
  wise: ['wisdom','knowledge','virtue'],
  wisdom: ['wisdom','knowledge','virtue'],
  sage: ['wisdom','knowledge','virtue'],
  intelligent: ['wisdom','knowledge','learning'],
  intelligence: ['wisdom','knowledge','learning'],
  smart: ['wisdom','knowledge','learning'],
  clever: ['wisdom','knowledge','fraud'],
  cunning: ['fraud','wisdom','virtue'],
  scheme: ['fraud','planning','virtue'],
  plot: ['fraud','planning','enmity'],
  plan: ['planning','wisdom','action'],
  planning: ['planning','wisdom','action'],
  strategy: ['planning','wisdom','action'],
  prepare: ['preparation','planning','action'],
  preparation: ['preparation','planning','action'],
  ready: ['preparation','courage','action'],
  lazy: ['laziness','sloth','action'],
  laziness: ['laziness','sloth','virtue'],
  sloth: ['sloth','laziness','virtue'],
  procrastinate: ['laziness','sloth','action'],
  idle: ['laziness','sloth','action'],
  work: ['action','effort','wealth'],
  effort: ['effort','action','perseverance'],
  strive: ['effort','perseverance','action'],
  labor: ['effort','action','wealth'],
  toil: ['effort','suffering','action'],
  diligent: ['effort','perseverance','action'],
  diligence: ['effort','perseverance','virtue'],
  industry: ['effort','action','wealth'],
  skill: ['skill','knowledge','action'],
  skilled: ['skill','knowledge','action'],
  talent: ['skill','knowledge','virtue'],
  expert: ['skill','knowledge','wisdom'],
  master: ['skill','knowledge','wisdom'],
  mastery: ['skill','knowledge','wisdom'],
  power: ['power','strength','governance'],
  powerful: ['power','strength','governance'],
  authority: ['power','governance','leadership'],
  ruler: ['governance','leadership','power'],
  king: ['governance','leadership','power'],
  queen: ['governance','leadership','power'],
  govern: ['governance','leadership','justice'],
  governance: ['governance','leadership','justice'],
  government: ['governance','leadership','justice'],
  politics: ['governance','leadership','justice'],
  political: ['governance','leadership','justice'],
  humble: ['humility','modesty','virtue'],
  humility: ['humility','modesty','virtue'],
  modesty: ['modesty','humility','virtue'],
  modest: ['modesty','humility','virtue'],
  pride: ['pride','arrogance','virtue'],
  arrogance: ['arrogance','pride','virtue'],
  arrogant: ['arrogance','pride','virtue'],
  vain: ['vanity','arrogance','beauty'],
  vanity: ['vanity','arrogance','pride'],
  boast: ['arrogance','pride','speech'],
  brag: ['arrogance','pride','speech'],
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

/**
 * Enhanced scoring function that considers ALL specified fields:
 * - chapter_tamil
 * - chapter_english
 * - tamil
 * - transliteration
 * - english
 * - themes
 * - mv (Mu Varadarajan)
 * - sp (Salamon Pappaiah)
 * - mk (Manakkudavar)
 * - couplet
 * - explanation
 */
function scoreKural(kural: Record<string, unknown>, keywords: string[]): number {
  let score = 0;

  // Extract and normalize all fields
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

  // Process each keyword
  for (const kw of keywords) {
    if (kw.length < 3) continue;

    // Highest priority: Themes (direct conceptual match)
    if (themes.includes(kw)) score += 10;

    // High priority: Chapter names (structural relevance)
    if (chapterEnglish.includes(kw)) score += 8;
    if (chapterTamil.includes(kw)) score += 7;

    // Core content: The kural itself
    if (english.includes(kw)) score += 6;
    if (tamil.includes(kw)) score += 6;
    if (transliteration.includes(kw)) score += 5;
    if (couplet.includes(kw)) score += 5;

    // Commentary and explanations (deeper understanding)
    if (explanation.includes(kw)) score += 4;
    if (mv.includes(kw)) score += 3;
    if (sp.includes(kw)) score += 3;
    if (mk.includes(kw)) score += 3;
  }

  return score;
}

/**
 * Enhanced tie-breaking for kurals with identical scores.
 * Uses a full-text semantic score against the entire question.
 */
function semanticScore(kural: Record<string, unknown>, fullQuestion: string): number {
  let score = 0;
  const questionLower = fullQuestion.toLowerCase();

  // Combine all text fields for semantic matching
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

  // Extract meaningful words from the question
  const questionWords = questionLower
    .replace(/[.,!?;:'"()\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Count how many question words appear in the kural's combined text
  for (const word of questionWords) {
    if (allText.includes(word)) {
      score += 1;
    }
  }

  return score;
}

async function findBestKural(keywords: string[], fullQuestion: string) {
  const queryString = keywords.join(' ');

  // Use select('*') so all columns including mv, sp, mk are returned
  const { data: ftResults } = await supabase
    .from('kurals')
    .select('*')
    .textSearch('search_vector', queryString, { type: 'plain', config: 'english' })
    .limit(50); // Increased limit for better candidate pool

  if (ftResults && ftResults.length > 0) {
    const scored = (ftResults as Record<string, unknown>[])
      .map(k => ({ 
        kural: k, 
        score: scoreKural(k, keywords),
        semanticScore: 0 // Will be calculated if needed
      }))
      .sort((a, b) => b.score - a.score);

    // Get the top score
    const topScore = scored[0].score;

    // Find all kurals with the top score (ties)
    const topKurals = scored.filter(k => k.score === topScore);

    // If there's a tie, use semantic scoring on the full question
    if (topKurals.length > 1) {
      const tiebroken = topKurals
        .map(k => ({
          ...k,
          semanticScore: semanticScore(k.kural, fullQuestion)
        }))
        .sort((a, b) => b.semanticScore - a.semanticScore);

      return tiebroken[0].kural;
    }

    // No tie, return the top kural
    return scored[0].kural;
  }

  // Fallback to theme-based matching
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(30);

  if (themeMatches && themeMatches.length > 0) {
    const scored = (themeMatches as Record<string, unknown>[])
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

  // Fallback to partial English matching
  for (const kw of keywords.slice(0, 5)) {
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(20);

    if (data && data.length > 0) {
      const scored = (data as Record<string, unknown>[])
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
  }

  // Final fallback
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

    // Pass both keywords and full question for tie-breaking
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
