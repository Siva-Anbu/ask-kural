// Run this once to import all 1330 Kurals into Supabase
// Usage: node import-kurals.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Your Supabase credentials
const SUPABASE_URL = 'https://pvoomzexavsgbhtmclbk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b29temV4YXZzZ2JodG1jbGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTQwMzcsImV4cCI6MjA5MTQzMDAzN30.fp_4fIiYQ02qkTQww6sKb_QRoz9_ly_mgf0L2RFhqMA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Theme keyword mapping — assigns themes to each Kural based on chapter
const CHAPTER_THEMES = {
  1: ['god','beginning','creation','purpose'],
  2: ['rain','nature','blessing','sustenance'],
  3: ['ascetic','renunciation','virtue','greatness'],
  4: ['virtue','assertion','strength'],
  5: ['family','household','life'],
  6: ['wife','partner','family','love'],
  7: ['children','family','blessing','parenting'],
  8: ['love','compassion','kindness','heart'],
  9: ['hospitality','generosity','welcome','giving'],
  10: ['speech','kindness','words','communication'],
  11: ['gratitude','kindness','help','appreciation'],
  12: ['impartiality','justice','fairness','virtue'],
  13: ['self control','discipline','virtue','restraint'],
  14: ['conduct','virtue','character','good'],
  15: ['gratitude','ingratitude','betrayal'],
  16: ['virtue','ethics','morality'],
  17: ['evil','karma','consequences','wrong'],
  18: ['punishment','justice','karma'],
  19: ['renunciation','detachment','letting go'],
  20: ['truth','honesty','virtue','integrity'],
  21: ['evil','fear','conscience','deed'],
  22: ['giving','charity','generosity','sharing'],
  23: ['fame','glory','virtue','reputation'],
  24: ['love','compassion','care','kindness'],
  25: ['compassion','kindness','nonviolence','virtue'],
  26: ['penance','ascetic','spirituality','discipline'],
  27: ['deception','fraud','dishonesty','wrong'],
  28: ['desire','passion','love','longing'],
  29: ['theft','wrong','evil','stealing'],
  30: ['truth','honesty','integrity','speech'],
  31: ['anger','self control','emotion','temper'],
  32: ['violence','harm','nonviolence','virtue'],
  33: ['killing','nonviolence','compassion','life'],
  34: ['instability','impermanence','life','change'],
  35: ['renunciation','letting go','detachment'],
  36: ['truth','knowledge','wisdom','reality'],
  37: ['desire','passion','control','discipline'],
  38: ['fate','destiny','karma','life'],
  39: ['royalty','leadership','governance','power'],
  40: ['learning','education','knowledge','study'],
  41: ['ignorance','knowledge','learning','wisdom'],
  42: ['listening','learning','knowledge','wisdom'],
  43: ['wisdom','knowledge','intelligence','mind'],
  44: ['correction','fault','mistake','wisdom'],
  45: ['greatness','virtue','character','nobility'],
  46: ['laziness','procrastination','discipline','action'],
  47: ['perseverance','effort','action','strength'],
  48: ['strength','perseverance','courage','action'],
  49: ['time','opportunity','career','action'],
  50: ['place','strategy','wisdom','planning'],
  51: ['selection','choice','wisdom','decision'],
  52: ['selection','wisdom','decision','choice'],
  53: ['friendship','relationship','loyalty','bond'],
  54: ['friendship','loyalty','relationship','trust'],
  55: ['bad friendship','wrong','relationship','avoid'],
  56: ['foolishness','wisdom','mistake','wrong'],
  57: ['enemy','conflict','wisdom','strategy'],
  58: ['action','work','effort','career'],
  59: ['messenger','communication','speech','diplomacy'],
  60: ['diligence','effort','work','career'],
  61: ['perseverance','effort','ambition','career'],
  62: ['energy','effort','work','strength'],
  63: ['perseverance','determination','ambition','goal'],
  64: ['fate','destiny','karma','life'],
  65: ['action','effort','work','career'],
  66: ['truth','honesty','integrity','virtue'],
  67: ['gratitude','help','friendship','kindness'],
  68: ['love','kindness','compassion','care'],
  69: ['speech','words','communication','wisdom'],
  70: ['speech','truth','words','honesty'],
  71: ['speech','diplomacy','words','wisdom'],
  72: ['speech','community','words','communication'],
  73: ['modesty','humility','virtue','character'],
  74: ['integrity','virtue','character','strength'],
  75: ['jealousy','envy','wrong','emotion'],
  76: ['spying','knowledge','wisdom','intelligence'],
  77: ['energy','action','effort','work'],
  78: ['anger','self control','temper','emotion'],
  79: ['cruelty','kindness','compassion','wrong'],
  80: ['laziness','procrastination','action','discipline'],
  81: ['kindness','compassion','generosity','virtue'],
  82: ['shame','virtue','character','modesty'],
  83: ['wealth','success','career','achievement'],
  84: ['giving','charity','generosity','wealth'],
  85: ['hospitality','generosity','welcome','giving'],
  86: ['praise','reputation','fame','virtue'],
  87: ['farming','work','sustenance','nature'],
  88: ['poverty','wealth','struggle','life'],
  89: ['hospitality','kindness','welcome','giving'],
  90: ['alcohol','vice','wrong','discipline'],
  91: ['gambling','vice','wrong','discipline'],
  92: ['medicine','health','life','balance'],
  93: ['lust','desire','wrong','discipline'],
  94: ['giving','generosity','charity','virtue'],
  95: ['wealth','success','career','achievement'],
  96: ['virtue','character','nobility','greatness'],
  97: ['modesty','humility','virtue','character'],
  98: ['kindness','generosity','giving','virtue'],
  99: ['gratitude','kindness','friendship','virtue'],
  100: ['virtue','character','nobility','ethics'],
  101: ['governance','justice','leadership','power'],
  102: ['cruel leadership','wrong','governance','justice'],
  103: ['leadership','virtue','governance','justice'],
  104: ['governance','justice','leadership','righteousness'],
  105: ['poverty','wealth','justice','governance'],
  106: ['punishment','justice','governance','leadership'],
  107: ['punishment','justice','law','governance'],
  108: ['justice','governance','leadership','righteousness'],
  109: ['love','romance','desire','passion'],
  110: ['love','longing','romance','desire'],
  111: ['union','love','joy','romance'],
  112: ['beauty','love','beloved','romance'],
  113: ['love','longing','missing someone','romance'],
  114: ['separation','longing','missing someone','heartbreak'],
  115: ['love','rumours','longing','romance'],
  116: ['separation','heartbreak','longing','missing someone'],
  117: ['longing','love','missing someone','romance'],
  118: ['eyes','love','longing','beloved'],
  119: ['love','union','joy','romance'],
  120: ['reunion','love','joy','romance'],
  121: ['pouting','love','romance','relationship'],
  122: ['love','joy','romance','union'],
  123: ['night','love','longing','romance'],
  124: ['longing','love','missing someone','separation'],
  125: ['longing','missing someone','love','separation'],
  126: ['separation','longing','love','heartbreak'],
  127: ['longing','missing someone','love','separation'],
  128: ['longing','love','missing someone','romance'],
  129: ['love','longing','missing someone','separation'],
  130: ['union','love','joy','romance'],
  131: ['pouting','love','romance','relationship'],
  132: ['love','romance','relationship','union'],
  133: ['love','union','romance','joy'],
};

async function importKurals() {
  console.log('Reading thirukkural.json...');
  
  let rawData;
  try {
    rawData = JSON.parse(readFileSync('./thirukkural.json', 'utf8'));
  } catch (e) {
    console.error('Could not read thirukkural.json. Make sure it is in the same folder as this script.');
    process.exit(1);
  }

  // The JSON structure from tk120404 has kural array
  const kurals = rawData.kural || rawData;
  console.log(`Found ${kurals.length} kurals in JSON`);

  // Chapter/book data
  const chapters = rawData.detail?.[0]?.chapters?.detail || [];
  const chapterMap = {};
  for (const book of (rawData.detail || [])) {
    for (const section of (book.sections?.detail || [])) {
      for (const ch of (section.chapters?.detail || [])) {
        chapterMap[ch.number] = {
          tamil: ch.name,
          english: ch.transliteration || ch.translation,
          book_tamil: book.name,
          book_english: book.transliteration || book.Translation,
        };
      }
    }
  }

  // Get existing kural numbers to avoid duplicates
  const { data: existing } = await supabase.from('kurals').select('number');
  const existingNums = new Set((existing || []).map(k => k.number));
  console.log(`Already have ${existingNums.size} kurals in database`);

  // Prepare records
  const toInsert = [];
  for (const k of kurals) {
    const num = k.Number;
    if (existingNums.has(num)) continue;

    // Figure out chapter number (1-133)
    const chapterNum = Math.ceil(num / 10);
    const chData = chapterMap[chapterNum] || {};
    const themes = CHAPTER_THEMES[chapterNum] || ['virtue', 'life', 'wisdom'];

    toInsert.push({
      number: num,
      chapter_number: chapterNum,
      chapter_tamil: chData.tamil || `அதிகாரம் ${chapterNum}`,
      chapter_english: chData.english || `Chapter ${chapterNum}`,
      book_tamil: chData.book_tamil || 'திருக்குறள்',
      book_english: chData.book_english || 'Thirukkural',
      tamil: `${k.Line1}\n${k.Line2}`,
      transliteration: `${k.transliteration1}\n${k.transliteration2}`,
      english: k.Translation,
      themes: themes,
    });
  }

  console.log(`Inserting ${toInsert.length} new kurals...`);

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase.from('kurals').insert(batch);
    if (error) {
      console.error(`Error at batch ${i}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✓ Inserted ${inserted}/${toInsert.length}`);
    }
  }

  console.log(`\n✅ Done! ${inserted} new kurals added to Supabase.`);

  // Final count
  const { count } = await supabase.from('kurals').select('*', { count: 'exact', head: true });
  console.log(`Total kurals in database: ${count}`);
}

importKurals().catch(console.error);
