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

// Enhanced synonym map with better normalization
const SYNONYMS: Record<string, string[]> = {
  // God / Faith
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
  
  // Nature
  rain: ['rain','nature','farming'],
  drought: ['rain','nature','poverty'],
  nature: ['rain','nature','farming'],
  environment: ['rain','nature','farming'],
  water: ['rain','nature','health'],
  
  // Virtue & Ethics
  virtue: ['virtue','ethics','morality'],
  moral: ['virtue','ethics','morality'],
  ethics: ['virtue','ethics','morality'],
  righteous: ['virtue','ethics','morality'],
  integrity: ['virtue','ethics','morality'],
  honesty: ['virtue','ethics','truth'],
  lie: ['truth','fraud','honesty'],
  lying: ['truth','fraud','honesty'],
  corrupt: ['virtue','ethics','governance'],
  
  // Family
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
  
  // Love
  love: ['love','joy','domestic'],
  affection: ['love','joy','kindness'],
  romance: ['love','joy','separation'],
  heartbroken: ['love','grief','separation'],
  heartbreak: ['love','grief','separation'],
  breakup: ['love','separation','grief'],
  crush: ['love','joy','separation'],
  unrequited: ['love','separation','grief'],
  
  // Hospitality & Generosity
  hospitality: ['hospitality','generosity','kindness'],
  guest: ['hospitality','generosity','kindness'],
  host: ['hospitality','generosity','kindness'],
  generous: ['generosity','kindness','hospitality'],
  generosity: ['generosity','kindness','hospitality'],
  donate: ['giving','generosity','kindness'],
  charity: ['giving','generosity','compassion'],
  share: ['giving','generosity','kindness'],
  
  // Speech
  speak: ['speech','words','eloquence'],
  speaking: ['speech','words','eloquence'],
  speech: ['speech','words','eloquence'],
  words: ['speech','words','eloquence'],
  language: ['speech','words','eloquence'],
  communication: ['speech','words','eloquence'],
  talk: ['speech','words','eloquence'],
  talking: ['speech','words','eloquence'],
  silence: ['silence','wisdom','speech'],
  silent: ['silence','wisdom','speech'],
  quiet: ['silence','wisdom','peace'],
  harsh: ['speech','anger','arrogance'],
  insult: ['speech','arrogance','anger'],
  abuse: ['speech','anger','arrogance'],
  gossip: ['speech','slander','friendship'],
  slander: ['slander','speech','friendship'],
  rumour: ['slander','speech','gossip'],
  rumor: ['slander','speech','gossip'],
  backbite: ['slander','speech','friendship'],
  
  // Gratitude
  gratitude: ['gratitude','thankfulness','kindness'],
  grateful: ['gratitude','thankfulness','kindness'],
  thankful: ['gratitude','thankfulness','kindness'],
  ungrateful: ['gratitude','thankfulness','betrayal'],
  thanks: ['gratitude','thankfulness','kindness'],
  appreciate: ['gratitude','thankfulness','kindness'],
  appreciation: ['gratitude','thankfulness','kindness'],
  
  // Justice & Fairness
  fair: ['impartiality','justice','virtue'],
  fairness: ['impartiality','justice','virtue'],
  bias: ['impartiality','justice','virtue'],
  biased: ['impartiality','justice','virtue'],
  equality: ['impartiality','justice','virtue'],
  equal: ['impartiality','justice','virtue'],
  discrimination: ['impartiality','justice','virtue'],
  
  // Self-Control
  selfcontrol: ['self-control','patience','virtue'],
  discipline: ['self-control','virtue','action'],
  disciplined: ['self-control','virtue','action'],
  temptation: ['self-control','desire','virtue'],
  impulse: ['self-control','anger','virtue'],
  impulsive: ['self-control','anger','virtue'],
  restraint: ['self-control','patience','virtue'],
  control: ['self-control','patience','virtue'],
  controlling: ['self-control','patience','virtue'],
  
  // Conduct
  conduct: ['virtue','ethics','action'],
  behaviour: ['virtue','ethics','action'],
  behavior: ['virtue','ethics','action'],
  sin: ['virtue','ethics','evil'],
  evil: ['virtue','ethics','evil'],
  wrong: ['virtue','ethics','wrong'],
  mistake: ['virtue','ethics','correction'],
  mistakes: ['virtue','ethics','correction'],
  regret: ['virtue','ethics','grief'],
  regretting: ['virtue','ethics','grief'],
  guilt: ['shame','virtue','ethics'],
  guilty: ['shame','virtue','ethics'],
  shame: ['shame','virtue','modesty'],
  ashamed: ['shame','virtue','modesty'],
  
  // Violence & Compassion
  kill: ['killing','compassion','virtue'],
  killing: ['killing','compassion','virtue'],
  violence: ['violence','compassion','virtue'],
  violent: ['violence','compassion','virtue'],
  nonviolence: ['compassion','virtue','killing'],
  meat: ['abstaining','virtue','compassion'],
  vegetarian: ['abstaining','virtue','compassion'],
  vegan: ['abstaining','virtue','compassion'],
  animal: ['compassion','killing','virtue'],
  animals: ['compassion','killing','virtue'],
  cruelty: ['cruelty','compassion','virtue'],
  cruel: ['cruelty','compassion','virtue'],
  
  // Criticism
  criticize: ['slander','speech','arrogance'],
  criticism: ['slander','speech','arrogance'],
  mock: ['slander','speech','arrogance'],
  mocking: ['slander','speech','arrogance'],
  ridicule: ['slander','speech','arrogance'],
  humiliate: ['slander','shame','arrogance'],
  humiliation: ['slander','shame','arrogance'],
  bully: ['slander','arrogance','violence'],
  bullying: ['slander','arrogance','violence'],
  
  // Fear & Consequence
  dread: ['fear','virtue','evil'],
  consequence: ['virtue','ethics','action'],
  consequences: ['virtue','ethics','action'],
  karma: ['virtue','ethics','action'],
  
  // Giving
  give: ['giving','generosity','kindness'],
  giving: ['giving','generosity','kindness'],
  duty: ['duty','virtue','action'],
  responsibility: ['duty','virtue','action'],
  responsibilities: ['duty','virtue','action'],
  responsible: ['duty','virtue','action'],
  volunteer: ['giving','duty','kindness'],
  
  // Fame & Reputation
  fame: ['renown','reputation','virtue'],
  famous: ['renown','reputation','virtue'],
  reputation: ['renown','reputation','virtue'],
  respect: ['renown','reputation','virtue'],
  respectful: ['renown','reputation','virtue'],
  honour: ['renown','reputation','virtue'],
  honor: ['renown','reputation','virtue'],
  recognition: ['renown','reputation','virtue'],
  legacy: ['renown','reputation','virtue'],
  
  // Compassion
  compassion: ['compassion','kindness','love'],
  compassionate: ['compassion','kindness','love'],
  empathy: ['compassion','kindness','love'],
  empathetic: ['compassion','kindness','love'],
  sympathy: ['compassion','kindness','love'],
  sympathetic: ['compassion','kindness','love'],
  mercy: ['compassion','kindness','virtue'],
  merciful: ['compassion','kindness','virtue'],
  pity: ['compassion','kindness','suffering'],
  
  // Penance
  penance: ['penance','virtue','spiritual'],
  meditation: ['penance','wisdom','peace'],
  meditate: ['penance','wisdom','peace'],
  practice: ['penance','virtue','action'],
  practicing: ['penance','virtue','action'],
  fasting: ['penance','virtue','abstaining'],
  
  // Fraud & Deception
  cheat: ['fraud','truth','betrayal'],
  cheating: ['fraud','truth','betrayal'],
  fraud: ['fraud','truth','virtue'],
  deceive: ['fraud','truth','betrayal'],
  deceiving: ['fraud','truth','betrayal'],
  deception: ['fraud','truth','betrayal'],
  fake: ['fraud','truth','virtue'],
  pretend: ['fraud','truth','virtue'],
  pretending: ['fraud','truth','virtue'],
  hypocrisy: ['fraud','truth','virtue'],
  hypocrite: ['fraud','truth','virtue'],
  
  // Truth
  truth: ['truth','virtue','honesty'],
  truthful: ['truth','virtue','honesty'],
  honest: ['truth','virtue','honesty'],
  promise: ['truth','virtue','honesty'],
  promises: ['truth','virtue','honesty'],
  vow: ['truth','virtue','honesty'],
  reality: ['truth','wisdom','virtue'],
  insight: ['wisdom','truth','knowledge'],
  
  // Anger
  angry: ['anger','self-control','virtue'],
  anger: ['anger','self-control','virtue'],
  rage: ['anger','self-control','virtue'],
  furious: ['anger','self-control','virtue'],
  irritated: ['anger','self-control','virtue'],
  irritation: ['anger','self-control','virtue'],
  temper: ['anger','self-control','virtue'],
  frustrated: ['frustration','anger','effort'],
  frustration: ['anger','effort','self-control'],
  frustrating: ['anger','effort','self-control'],
  
  // Death & Impermanence
  death: ['impermanence','fate','grief'],
  die: ['impermanence','fate','grief'],
  dying: ['impermanence','fate','grief'],
  dead: ['impermanence','fate','grief'],
  loss: ['impermanence','grief','suffering'],
  grief: ['grief','suffering','impermanence'],
  grieve: ['grief','suffering','impermanence'],
  grieving: ['grief','suffering','impermanence'],
  mourn: ['grief','suffering','impermanence'],
  mourning: ['grief','suffering','impermanence'],
  mortality: ['impermanence','fate','virtue'],
  life: ['impermanence','virtue','fate'],
  time: ['impermanence','time','fate'],
  
  // Renunciation
  renounce: ['renunciation','penance','virtue'],
  detach: ['renunciation','wisdom','peace'],
  detachment: ['renunciation','wisdom','peace'],
  attachment: ['renunciation','desire','love'],
  letting: ['renunciation','wisdom','peace'],
  
  // Desire & Greed
  desire: ['desire','greed','self-control'],
  greed: ['greed','desire','wealth'],
  greedy: ['greed','desire','wealth'],
  lust: ['desire','greed','lust'],
  lustful: ['desire','greed','lust'],
  possessive: ['desire','greed','self-control'],
  jealous: ['jealousy','desire','self-control'],
  jealousy: ['jealousy','desire','self-control'],
  envy: ['jealousy','desire','self-control'],
  envious: ['jealousy','desire','self-control'],
  compare: ['jealousy','desire','self-control'],
  comparing: ['jealousy','desire','self-control'],
  
  // Fate & Fortune
  fate: ['fate','impermanence','virtue'],
  destiny: ['fate','impermanence','virtue'],
  luck: ['fate','fortune','virtue'],
  lucky: ['fate','fortune','virtue'],
  fortune: ['fate','fortune','wealth'],
  unfortunate: ['fate','fortune','suffering'],
  unlucky: ['fate','fortune','suffering'],
  accident: ['fate','impermanence','suffering'],
  chance: ['fate','fortune','action'],
  
  // Leadership & Governance
  king: ['governance','leadership','royalty'],
  ruler: ['governance','leadership','royalty'],
  govern: ['governance','leadership','royalty'],
  government: ['governance','leadership','justice'],
  politics: ['governance','leadership','justice'],
  political: ['governance','leadership','justice'],
  politician: ['governance','leadership','justice'],
  election: ['governance','leadership','justice'],
  democracy: ['governance','justice','leadership'],
  minister: ['governance','leadership','royalty'],
  leader: ['leadership','governance','wisdom'],
  leadership: ['leadership','governance','wisdom'],
  manage: ['leadership','governance','action'],
  manager: ['leadership','governance','action'],
  managing: ['leadership','governance','action'],
  boss: ['leadership','governance','action'],
  ceo: ['leadership','governance','action'],
  captain: ['leadership','courage','action'],
  
  // Knowledge & Education
  learn: ['knowledge','education','wisdom'],
  learning: ['knowledge','education','wisdom'],
  education: ['knowledge','education','wisdom'],
  study: ['knowledge','education','wisdom'],
  studying: ['knowledge','education','wisdom'],
  school: ['knowledge','education','wisdom'],
  university: ['knowledge','education','wisdom'],
  college: ['knowledge','education','wisdom'],
  degree: ['knowledge','education','wisdom'],
  read: ['knowledge','education','wisdom'],
  reading: ['knowledge','education','wisdom'],
  book: ['knowledge','education','wisdom'],
  books: ['knowledge','education','wisdom'],
  
  // Ignorance & Foolishness
  ignorant: ['ignorance','knowledge','wisdom'],
  ignorance: ['ignorance','knowledge','wisdom'],
  uneducated: ['ignorance','knowledge','education'],
  stupid: ['ignorance','knowledge','wisdom'],
  foolish: ['foolishness','ignorance','wisdom'],
  fool: ['foolishness','ignorance','wisdom'],
  naive: ['foolishness','ignorance','wisdom'],
  reckless: ['foolishness','action','wisdom'],
  careless: ['foolishness','action','wisdom'],
  
  // Listening & Wisdom
  listen: ['listening','wisdom','knowledge'],
  listening: ['listening','wisdom','knowledge'],
  hear: ['listening','wisdom','knowledge'],
  hearing: ['listening','wisdom','knowledge'],
  advice: ['listening','wisdom','knowledge'],
  wisdom: ['wisdom','knowledge','virtue'],
  wise: ['wisdom','knowledge','virtue'],
  smart: ['wisdom','knowledge','education'],
  intelligent: ['wisdom','knowledge','education'],
  intelligence: ['wisdom','knowledge','education'],
  clever: ['wisdom','knowledge','education'],
  confused: ['wisdom','knowledge','ignorance'],
  confusion: ['wisdom','knowledge','ignorance'],
  lost: ['wisdom','knowledge','guidance'],
  guidance: ['wisdom','knowledge','leadership'],
  decision: ['wisdom','knowledge','action'],
  decisions: ['wisdom','knowledge','action'],
  handle: ['wisdom','action','leadership'],
  handling: ['wisdom','action','leadership'],
  tackle: ['wisdom','action','enemy'],
  
  // Correction & Improvement
  fault: ['correction','virtue','wisdom'],
  faults: ['correction','virtue','wisdom'],
  flaw: ['correction','virtue','wisdom'],
  flaws: ['correction','virtue','wisdom'],
  improve: ['correction','virtue','action'],
  improvement: ['correction','virtue','action'],
  improving: ['correction','virtue','action'],
  growth: ['correction','virtue','action'],
  feedback: ['correction','wisdom','speech'],
  criticism: ['correction','speech','wisdom'],
  
  // Greatness & Nobility
  greatness: ['greatness','virtue','wisdom'],
  great: ['greatness','virtue','wisdom'],
  noble: ['nobility','virtue','greatness'],
  nobility: ['nobility','virtue','greatness'],
  dignity: ['nobility','virtue','greatness'],
  
  // Laziness & Sloth
  lazy: ['laziness','action','sloth'],
  laziness: ['laziness','action','sloth'],
  procrastinate: ['laziness','action','sloth'],
  procrastination: ['laziness','action','sloth'],
  procrastinating: ['laziness','action','sloth'],
  idle: ['laziness','action','sloth'],
  inactive: ['laziness','action','sloth'],
  sloth: ['laziness','action','sloth'],
  sluggish: ['laziness','action','sloth'],
  unmotivated: ['laziness','action','energy'],
  
  // Action & Energy
  active: ['action','energy','diligence'],
  diligent: ['diligence','action','energy'],
  diligence: ['diligence','action','energy'],
  persistent: ['perseverance','action','energy'],
  persistence: ['perseverance','action','energy'],
  firm: ['firmness','action','perseverance'],
  firmness: ['firmness','action','perseverance'],
  
  // Timing & Opportunity
  timing: ['time','action','wisdom'],
  opportunity: ['time','action','wisdom'],
  opportunities: ['time','action','wisdom'],
  moment: ['time','impermanence','action'],
  
  // Friendship
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
  colleagues: ['friendship','work','loyalty'],
  team: ['friendship','leadership','action'],
  
  // Enmity
  enemy: ['enmity','wisdom','courage'],
  enemies: ['enmity','wisdom','courage'],
  rival: ['enmity','wisdom','competition'],
  rivals: ['enmity','wisdom','competition'],
  compete: ['enmity','action','competition'],
  competition: ['enmity','action','wisdom'],
  conflict: ['enmity','anger','wisdom'],
  fight: ['enmity','anger','violence'],
  fighting: ['enmity','anger','violence'],
  
  // Effort & Success
  action: ['action','energy','diligence'],
  energy: ['energy','action','perseverance'],
  effort: ['effort','action','energy'],
  efforts: ['effort','action','energy'],
  hardwork: ['effort','action','perseverance'],
  succeed: ['effort','action','perseverance'],
  success: ['effort','action','perseverance'],
  successful: ['effort','action','perseverance'],
  achieve: ['effort','action','perseverance'],
  achievement: ['effort','action','perseverance'],
  goal: ['effort','action','wisdom'],
  goals: ['effort','action','wisdom'],
  motivation: ['energy','action','perseverance'],
  motivate: ['energy','action','perseverance'],
  motivated: ['energy','action','perseverance'],
  inspire: ['energy','leadership','action'],
  inspiration: ['energy','leadership','action'],
  
  // Perseverance
  persevere: ['perseverance','effort','strength'],
  perseverance: ['perseverance','effort','strength'],
  persist: ['perseverance','effort','strength'],
  resilience: ['perseverance','strength','courage'],
  resilient: ['perseverance','strength','courage'],
  overcome: ['perseverance','courage','strength'],
  overcoming: ['perseverance','courage','strength'],
  survive: ['perseverance','strength','fate'],
  survival: ['perseverance','strength','fate'],
  obstacle: ['perseverance','courage','action'],
  obstacles: ['perseverance','courage','action'],
  challenge: ['perseverance','courage','action'],
  challenges: ['perseverance','courage','action'],
  challenging: ['perseverance','courage','action'],
  failure: ['perseverance','effort','grief'],
  fail: ['perseverance','effort','grief'],
  failing: ['perseverance','effort','grief'],
  failed: ['perseverance','effort','grief'],
  
  // Perfection & Excellence
  perfect: ['perfection','virtue','greatness'],
  perfection: ['perfection','virtue','greatness'],
  excellence: ['perfection','virtue','greatness'],
  excellent: ['perfection','virtue','greatness'],
  
  // Eloquence
  eloquent: ['eloquence','speech','wisdom'],
  eloquence: ['eloquence','speech','wisdom'],
  persuade: ['eloquence','speech','wisdom'],
  persuasion: ['eloquence','speech','wisdom'],
  debate: ['eloquence','speech','wisdom'],
  presentation: ['eloquence','speech','wisdom'],
  interview: ['eloquence','speech','wisdom'],
  
  // Courage
  courage: ['courage','strength','perseverance'],
  courageous: ['courage','strength','perseverance'],
  brave: ['courage','strength','perseverance'],
  bravery: ['courage','strength','perseverance'],
  fear: ['fear','courage','strength'],
  afraid: ['fear','courage','strength'],
  scared: ['fear','courage','strength'],
  coward: ['fear','courage','strength'],
  daring: ['courage','strength','action'],
  anxiety: ['fear','peace','health'],
  anxious: ['fear','peace','health'],
  worry: ['fear','peace','health'],
  worried: ['fear','peace','health'],
  worrying: ['fear','peace','health'],
  
  // Kindness
  kind: ['kindness','compassion','love'],
  kindness: ['kindness','compassion','love'],
  benevolent: ['kindness','compassion','love'],
  caring: ['kindness','compassion','love'],
  warm: ['kindness','compassion','love'],
  help: ['kindness','compassion','hospitality'],
  helping: ['kindness','compassion','hospitality'],
  support: ['kindness','friendship','compassion'],
  supporting: ['kindness','friendship','compassion'],
  
  // Endurance & Patience
  endure: ['endurance','perseverance','strength'],
  endurance: ['endurance','perseverance','strength'],
  patience: ['patience','endurance','self-control'],
  patient: ['patience','endurance','self-control'],
  impatient: ['patience','self-control','anger'],
  tolerance: ['endurance','patience','self-control'],
  tolerate: ['endurance','patience','self-control'],
  
  // Modesty & Humility
  modest: ['modesty','virtue','shame'],
  modesty: ['modesty','virtue','shame'],
  humble: ['modesty','virtue','shame'],
  humility: ['modesty','virtue','shame'],
  
  // Arrogance & Pride
  arrogant: ['arrogance','pride','shame'],
  arrogance: ['arrogance','pride','shame'],
  ego: ['arrogance','pride','shame'],
  pride: ['arrogance','pride','shame'],
  proud: ['pride','arrogance','virtue'],
  selfish: ['arrogance','selfishness','shame'],
  selfishness: ['arrogance','selfishness','shame'],
  rude: ['arrogance','anger','shame'],
  
  // Wealth & Poverty
  wealth: ['wealth','poverty','generosity'],
  wealthy: ['wealth','giving','generosity'],
  rich: ['wealth','giving','generosity'],
  money: ['wealth','giving','poverty'],
  poor: ['poverty','wealth','suffering'],
  poverty: ['poverty','wealth','suffering'],
  debt: ['poverty','wealth','suffering'],
  financial: ['wealth','poverty','action'],
  savings: ['wealth','action','future'],
  invest: ['wealth','action','future'],
  investment: ['wealth','action','future'],
  salary: ['wealth','work','action'],
  income: ['wealth','work','action'],
  jobless: ['wealth','effort','poverty'],
  unemployed: ['wealth','effort','poverty'],
  unemployment: ['wealth','effort','poverty'],
  fired: ['effort','perseverance','poverty'],
  job: ['effort','wealth','action'],
  jobs: ['effort','wealth','action'],
  career: ['effort','wealth','action'],
  promotion: ['effort','wealth','action'],
  office: ['effort','wealth','action'],
  starve: ['poverty','suffering','wealth'],
  starving: ['poverty','suffering','wealth'],
  hungry: ['poverty','suffering','health'],
  hunger: ['poverty','suffering','health'],
  homeless: ['poverty','suffering','wealth'],
  struggle: ['poverty','suffering','perseverance'],
  struggling: ['poverty','suffering','perseverance'],
  
  // Vices
  alcohol: ['alcohol','vice','virtue'],
  drink: ['alcohol','vice','virtue'],
  drinking: ['alcohol','vice','virtue'],
  drunk: ['alcohol','vice','virtue'],
  addiction: ['alcohol','vice','self-control'],
  addicted: ['alcohol','vice','self-control'],
  gambling: ['gambling','vice','virtue'],
  gamble: ['gambling','vice','virtue'],
  bet: ['gambling','vice','virtue'],
  betting: ['gambling','vice','virtue'],
  
  // Health
  sick: ['health','suffering','medicine'],
  sickness: ['health','suffering','medicine'],
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
  recovery: ['health','perseverance','medicine'],
  
  // Mental Health
  mental: ['health','peace','suffering'],
  depression: ['suffering','peace','health'],
  depressed: ['suffering','peace','health'],
  stressed: ['suffering','peace','health'],
  stress: ['suffering','peace','health'],
  stressful: ['suffering','peace','health'],
  overwhelmed: ['suffering','peace','health'],
  burnout: ['effort','laziness','health'],
  exhausted: ['effort','perseverance','health'],
  exhaustion: ['effort','perseverance','health'],
  
  // Suffering
  hurt: ['suffering','grief','love'],
  hurting: ['suffering','grief','love'],
  ache: ['suffering','grief','health'],
  aching: ['suffering','grief','health'],
  sorrow: ['grief','suffering','impermanence'],
  sad: ['grief','suffering','love'],
  sadness: ['grief','suffering','love'],
  crying: ['grief','suffering','love'],
  
  // Justice & Law
  justice: ['justice','governance','virtue'],
  judge: ['justice','governance','wisdom'],
  judging: ['justice','governance','wisdom'],
  law: ['justice','governance','virtue'],
  legal: ['justice','governance','virtue'],
  crime: ['justice','virtue','evil'],
  criminal: ['justice','virtue','evil'],
  punishment: ['justice','governance','virtue'],
  
  // Forbidden Love
  forbidden: ['desire','virtue','lust'],
  affair: ['lust','love','betrayal'],
  
  // Beauty & Attraction
  beautiful: ['beauty','love','joy'],
  beauty: ['beauty','love','joy'],
  attraction: ['love','beauty','desire'],
  propose: ['love','declaration','joy'],
  proposal: ['love','declaration','joy'],
  confession: ['love','declaration','truth'],
  
  // Separation & Loneliness
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
  isolation: ['loneliness','friendship','separation'],
  homesick: ['loneliness','separation','home'],
  
  // Time & Dreams
  night: ['night','loneliness','love'],
  dream: ['dreaming','love','hope'],
  dreaming: ['dreaming','love','hope'],
  dreams: ['dreaming','love','hope'],
  
  // Hope & Happiness
  hope: ['hope','love','joy'],
  hopeful: ['hope','love','joy'],
  happy: ['joy','happiness','love'],
  happiness: ['joy','happiness','love'],
  joyful: ['joy','happiness','love'],
  joy: ['joy','happiness','love'],
  cheerful: ['joy','happiness','love'],
  excited: ['joy','happiness','love'],
  excitement: ['joy','happiness','love'],
  content: ['joy','peace','happiness'],
  peaceful: ['peace','joy','happiness'],
  peace: ['peace','joy','happiness'],
  bliss: ['joy','happiness','peace'],
  smile: ['joy','happiness','love'],
  smiling: ['joy','happiness','love'],
  laugh: ['joy','happiness','love'],
  laughing: ['joy','happiness','love'],
  laughter: ['joy','happiness','love'],
  delighted: ['joy','happiness','love'],
  pleasure: ['joy','happiness','love'],
  
  // Sulking
  sulk: ['sulking','love','anger'],
  sulking: ['sulking','love','anger'],
  pout: ['sulking','love','anger'],
  argument: ['sulking','anger','love'],
  arguments: ['sulking','anger','love'],
  
  // Additional
  neighbour: ['friendship','kindness','hospitality'],
  neighbor: ['friendship','kindness','hospitality'],
  society: ['duty','virtue','governance'],
  community: ['duty','virtue','kindness'],
  social: ['duty','virtue','society'],
  strong: ['strength','perseverance','courage'],
  weak: ['strength','perseverance','fate'],
  weakness: ['strength','perseverance','fate'],
  strength: ['strength','perseverance','courage'],
  difficult: ['perseverance','courage','suffering'],
  difficulty: ['perseverance','courage','suffering'],
  hard: ['effort','perseverance','action'],
  farm: ['farming','action','effort'],
  farming: ['farming','action','effort'],
  harvest: ['farming','action','wealth'],
  bored: ['laziness','action','sloth'],
  boredom: ['laziness','action','sloth'],
  annoyed: ['anger','self-control','patience'],
  upset: ['grief','anger','suffering'],
  calm: ['peace','self-control','patience'],
  trust: ['friendship','truth','loyalty'],
  trusting: ['friendship','truth','loyalty'],
};

// Improved stemming with better normalization
function improvedStem(word: string): string {
  // Remove common suffixes for better matching
  return word
    .replace(/ing$/, '')      // running -> run
    .replace(/ed$/, '')        // walked -> walk
    .replace(/s$/, '')         // cats -> cat
    .replace(/es$/, '')        // boxes -> box
    .replace(/ies$/, 'y')      // worries -> worry
    .replace(/ness$/, '')      // sadness -> sad
    .replace(/tion$/, '')      // action -> act
    .replace(/ment$/, '')      // excitement -> excite
    .replace(/ful$/, '')       // hopeful -> hope
    .replace(/less$/, '')      // hopeless -> hope
    .replace(/ly$/, '')        // sadly -> sad
    .replace(/er$/, '')        // stronger -> strong
    .replace(/est$/, '');      // strongest -> strong
}

// Enhanced keyword extraction with better normalization
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = lower.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  
  for (const word of words) {
    // Add original word
    expanded.add(word);
    
    // Add direct synonyms
    if (SYNONYMS[word]) {
      SYNONYMS[word].forEach(s => expanded.add(s));
    }
    
    // Add stemmed version
    const stemmed = improvedStem(word);
    if (stemmed.length > 2 && stemmed !== word) {
      expanded.add(stemmed);
      
      // Add synonyms of stemmed word
      if (SYNONYMS[stemmed]) {
        SYNONYMS[stemmed].forEach(s => expanded.add(s));
      }
    }
  }
  
  return Array.from(expanded);
}

// Enhanced scoring with reason tracking
interface ScoredKural {
  kural: Record<string, unknown>;
  score: number;
  matchReasons: string[];
}

function scoreKuralWithReasons(
  kural: Record<string, unknown>, 
  keywords: string[]
): ScoredKural {
  let score = 0;
  const matchReasons: string[] = [];
  
  const english = ((kural.english as string) || '').toLowerCase();
  const chapter = ((kural.chapter_english as string) || '').toLowerCase();
  const chapterTamil = ((kural.chapter_tamil as string) || '');
  const themes = ((kural.themes as string[]) || []).join(' ').toLowerCase();
  const tamil = ((kural.tamil as string) || '').toLowerCase();

  for (const kw of keywords) {
    if (kw.length < 3) continue;
    
    // Exact chapter name match (highest priority)
    if (chapter === kw) {
      score += 25;
      if (!matchReasons.includes(`Chapter: ${chapter}`)) {
        matchReasons.push(`Chapter: ${chapter}`);
      }
    }
    // Partial chapter match
    else if (chapter.includes(kw)) {
      score += 12;
      if (!matchReasons.includes(`Chapter: ${chapter}`)) {
        matchReasons.push(`Chapter: ${chapter}`);
      }
    }
    
    // Theme match
    if (themes.includes(kw)) {
      score += 10;
      if (!matchReasons.some(r => r.startsWith('Theme:'))) {
        matchReasons.push(`Theme: ${kw}`);
      }
    }
    
    // English meaning match
    if (english.includes(kw)) {
      score += 4;
      if (!matchReasons.some(r => r.startsWith('Meaning:'))) {
        matchReasons.push(`Meaning: matches "${kw}"`);
      }
    }
    
    // Tamil text match (bonus)
    if (tamil.includes(kw)) {
      score += 3;
      if (!matchReasons.some(r => r.startsWith('Tamil text'))) {
        matchReasons.push('Tamil text match');
      }
    }
  }
  
  // Add chapter info if not already in reasons
  if (matchReasons.length > 0 && !matchReasons.some(r => r.startsWith('Chapter:'))) {
    matchReasons.unshift(`Chapter: ${chapter}`);
  }
  
  return { kural, score, matchReasons };
}

// Enhanced ranking with deterministic tie-breaking
async function findBestKural(keywords: string[]) {
  const queryString = keywords.join(' ');
  let candidates: Record<string, unknown>[] = [];

  // Strategy 1: Chapter name matching (increased limit)
  for (const kw of keywords.slice(0, 5)) {
    if (kw.length < 3) continue;
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('chapter_english', `%${kw}%`)
      .limit(30);
    if (data && data.length > 0) candidates.push(...data);
  }

  // Strategy 2: Theme overlap (increased limit)
  const { data: themeData } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', keywords)
    .limit(30);
  if (themeData) candidates.push(...themeData);

  // Strategy 3: Full-text search (increased limit)
  const { data: ftData } = await supabase
    .from('kurals')
    .select('*')
    .textSearch('search_vector', queryString, { type: 'plain', config: 'english' })
    .limit(40);
  if (ftData) candidates.push(...ftData);

  // Strategy 4: ILIKE on English meaning (increased limit)
  for (const kw of keywords.slice(0, 5)) {
    if (kw.length < 3) continue;
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${kw}%`)
      .limit(20);
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
    // Fallback: get random kural
    const { data: all } = await supabase.from('kurals').select('*').limit(100);
    if (all && all.length > 0) {
      const randomKural = all[Math.floor(Math.random() * all.length)];
      return {
        kural: randomKural,
        matchReasons: ['Random selection (no specific match found)']
      };
    }
    return null;
  }

  // Score all candidates with reasons
  const scored = candidates
    .map(k => scoreKuralWithReasons(k, keywords))
    .sort((a, b) => {
      // Primary sort: by score (descending)
      if (b.score !== a.score) return b.score - a.score;
      
      // Deterministic tie-breaking: by kural number (ascending)
      const numA = (a.kural.number as number) || 0;
      const numB = (b.kural.number as number) || 0;
      return numA - numB;
    });

  // Return the top result with reasons
  return {
    kural: scored[0].kural,
    matchReasons: scored[0].matchReasons
  };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const keywords = extractKeywords(message);
    if (keywords.length === 0) {
      return NextResponse.json({ 
        error: 'Could not understand query. Please try again.' 
      }, { status: 400 });
    }

    const result = await findBestKural(keywords);
    if (!result) {
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

    return NextResponse.json({ 
      kural: result.kural, 
      keywords: displayKeywords,
      matchReasons: result.matchReasons
    });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
