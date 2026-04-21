import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Keyword → theme mapping. The richer this is, the better the matching.
const KEYWORD_THEME_MAP: Record<string, string> = {
  // Anger
  'angry': 'anger', 'anger': 'anger', 'rage': 'anger', 'furious': 'anger',
  'frustrated': 'anger', 'frustration': 'anger', 'irritated': 'anger',
  'fight': 'anger', 'fighting': 'anger', 'argue': 'anger', 'argument': 'anger',
  'shout': 'anger', 'yell': 'anger', 'temper': 'anger', 'mad': 'anger',

  // Love & relationships
  'love': 'love', 'lover': 'love', 'romance': 'love', 'romantic': 'love',
  'girlfriend': 'love', 'boyfriend': 'love', 'wife': 'love', 'husband': 'love',
  'crush': 'love', 'heartbreak': 'love', 'heartbroken': 'love', 'breakup': 'love',
  'miss': 'love', 'missing': 'love', 'longing': 'love', 'relationship': 'love',
  'dating': 'love', 'marriage': 'love', 'married': 'love', 'partner': 'love',

  // Loneliness
  'lonely': 'loneliness', 'alone': 'loneliness', 'loneliness': 'loneliness',
  'isolated': 'loneliness', 'nobody': 'loneliness', 'no one': 'loneliness',
  'abroad': 'loneliness', 'foreign': 'loneliness', 'homesick': 'loneliness',
  'home': 'loneliness', 'far': 'loneliness',

  // Family
  'father': 'family', 'mother': 'family', 'parents': 'family', 'parent': 'family',
  'family': 'family', 'brother': 'family', 'sister': 'family', 'son': 'family',
  'daughter': 'family', 'children': 'family', 'child': 'family', 'kid': 'family',
  'kids': 'family', 'amma': 'family', 'appa': 'family', 'mom': 'family', 'dad': 'family',

  // Procrastination & laziness
  'procrastinate': 'procrastination', 'procrastinating': 'procrastination',
  'lazy': 'procrastination', 'laziness': 'procrastination', 'delay': 'procrastination',
  'postpone': 'procrastination', 'later': 'procrastination', 'tomorrow': 'procrastination',
  'motivation': 'procrastination', 'motivated': 'procrastination', 'unmotivated': 'procrastination',
  'sleep': 'procrastination', 'sleeping': 'procrastination', 'tired': 'procrastination',

  // Career & work
  'job': 'career', 'work': 'career', 'career': 'career', 'office': 'career',
  'boss': 'career', 'promotion': 'career', 'salary': 'career', 'fired': 'career',
  'unemployed': 'career', 'unemployment': 'career', 'interview': 'career',
  'ambition': 'career', 'goal': 'career', 'goals': 'career', 'success': 'career',
  'successful': 'career', 'failure': 'career', 'fail': 'career', 'failed': 'career',

  // Learning & knowledge
  'learn': 'learning', 'learning': 'learning', 'study': 'learning', 'studying': 'learning',
  'education': 'learning', 'school': 'learning', 'college': 'learning', 'university': 'learning',
  'knowledge': 'learning', 'wisdom': 'learning', 'ignorant': 'learning', 'ignorance': 'learning',
  'read': 'learning', 'reading': 'learning', 'books': 'learning', 'book': 'learning',

  // Gratitude
  'grateful': 'gratitude', 'gratitude': 'gratitude', 'thankful': 'gratitude',
  'thank': 'gratitude', 'thanks': 'gratitude', 'appreciate': 'gratitude',
  'appreciation': 'gratitude', 'blessing': 'gratitude', 'blessed': 'gratitude',

  // Perseverance & strength
  'give up': 'perseverance', 'giving up': 'perseverance', 'quit': 'perseverance',
  'quitting': 'perseverance', 'persist': 'perseverance', 'persistence': 'perseverance',
  'strong': 'perseverance', 'strength': 'perseverance', 'courage': 'perseverance',
  'brave': 'perseverance', 'bravery': 'perseverance', 'resilience': 'perseverance',
  'resilient': 'perseverance', 'struggle': 'perseverance', 'struggling': 'perseverance',
  'hard': 'perseverance', 'difficult': 'perseverance', 'difficulty': 'perseverance',
  'challenge': 'perseverance', 'overcome': 'perseverance',

  // Kindness & compassion
  'kind': 'kindness', 'kindness': 'kindness', 'compassion': 'kindness',
  'compassionate': 'kindness', 'help': 'kindness', 'helping': 'kindness',
  'generous': 'kindness', 'generosity': 'kindness', 'selfish': 'kindness',
  'selfless': 'kindness', 'care': 'kindness', 'caring': 'kindness',

  // Peace & anxiety
  'peace': 'peace', 'peaceful': 'peace', 'anxiety': 'peace', 'anxious': 'peace',
  'stress': 'peace', 'stressed': 'peace', 'worry': 'peace', 'worried': 'peace',
  'fear': 'peace', 'scared': 'peace', 'afraid': 'peace', 'nervous': 'peace',
  'calm': 'peace', 'relax': 'peace', 'relaxed': 'peace', 'tension': 'peace',
};

// Warm intro lines Arul says before showing the Kural — based on theme
const ARUL_INTROS: Record<string, string[]> = {
  anger: [
    "நண்பா, anger is one of the most human feelings. Valluvar thought deeply about this — here is what he said:",
    "When anger rises, Valluvar's words are the best companion. Read this slowly:",
  ],
  love: [
    "The heart has its own wisdom நண்பா. Valluvar understood love better than anyone:",
    "2000 years ago, Valluvar wrote exactly for this moment. Here is his word on love:",
  ],
  loneliness: [
    "Feeling alone is one of the heaviest feelings நண்பா. Valluvar sees you:",
    "Even in loneliness, you are not alone. Valluvar left these words for you:",
  ],
  family: [
    "Family is where our deepest joys and deepest wounds both live நண்பா. Valluvar on this:",
    "Valluvar understood family like few others. Here is his wisdom for you:",
  ],
  procrastination: [
    "நாளைக்கு சொல்லாதே நண்பா — Valluvar had strong words about this:",
    "The hardest step is always the first one. Here is what Valluvar says:",
  ],
  career: [
    "Work and ambition — Valluvar had clear eyes on this நண்பா:",
    "Your career journey is seen by Valluvar too. Here is his wisdom:",
  ],
  learning: [
    "கற்றல் ஒளி நண்பா — Valluvar on the power of learning:",
    "Valluvar held education above almost everything. Here is why:",
  ],
  gratitude: [
    "Gratitude is a strength, not a weakness நண்பா. Valluvar on this:",
    "The grateful heart is the richest heart. Valluvar's words:",
  ],
  perseverance: [
    "Don't give up நண்பா — Valluvar wrote this for exactly this moment:",
    "Struggle is the school of the great. Valluvar knew this well:",
  ],
  kindness: [
    "Kindness is the highest virtue நண்பா. Valluvar's words on this:",
    "The world needs more of what you're thinking about. Valluvar agrees:",
  ],
  peace: [
    "When the mind is restless, Valluvar is the best medicine நண்பா:",
    "Peace begins within நண்பா. Here is Valluvar's path to it:",
  ],
  default: [
    "வள்ளுவர் உங்களுக்காக எழுதினார் நண்பா. Here is his word for you today:",
    "Valluvar wrote for every human heart, across every age. This one is for you:",
    "2000 years ago, Valluvar saw your question coming. Here is his answer:",
  ],
};

// Closing blessings Arul says after the Kural
const ARUL_CLOSINGS: Record<string, string[]> = {
  anger: [
    "சினத்தை வெல்பவனே உண்மையான வீரன். 🙏",
    "கோபம் நெருப்பு — அதை அணைப்பது உன் வலிமை. 🙏",
  ],
  love: [
    "அன்பு உண்மையானது என்றால் அது வழி கண்டுபிடிக்கும். 🙏",
    "காதல் மனதை திறக்கும், வாழ்க்கையை வளமாக்கும். 🙏",
  ],
  loneliness: [
    "தனிமையில் இருந்தாலும் நீ தனியில்லை. 🙏",
    "உன்னோட மனசு உன்னோட கூட இருக்கு — வாழ்க. 🙏",
  ],
  family: [
    "குடும்பத்தை காப்பது கடமை, நேசிப்பது இயல்பு. 🙏",
    "அன்பே குடும்பத்தின் அடிப்படை. 🙏",
  ],
  procrastination: [
    "இன்றே தொடங்கு — நாளை என்பது ஒரு மாயை. 🙏",
    "ஒரு அடி எடுத்து வை — மற்றதை வாழ்க்கை பார்த்துக்கும். 🙏",
  ],
  career: [
    "மேலே பார், உயரே நட — வாழ்க்கை உன்னை தாங்கும். 🙏",
    "உழைப்பு ஒருநாளும் வீணாகாது நண்பா. 🙏",
  ],
  learning: [
    "கற்றல் ஒளி, அறியாமை இருள் — நீ ஒளியை தேர்ந்தெடு. 🙏",
    "கற்றவன் எங்கும் வாழலாம். 🙏",
  ],
  gratitude: [
    "நன்றி சொல்வது பெரியவர்களின் இயல்பு. 🙏",
    "அன்புடன் வாழ்க, நன்றியுடன் திரும்பு. 🙏",
  ],
  perseverance: [
    "விடாமுயற்சி வெற்றியின் தாய். 🙏",
    "தோல்வி ஒரு படி — நில்லாதே, நட. 🙏",
  ],
  kindness: [
    "அன்பே வாழ்க்கையின் விடை. 🙏",
    "கொடுப்பவன் கையே மேலே இருக்கும். 🙏",
  ],
  peace: [
    "மனசு அமைதியாக இருந்தால் எல்லாம் சரியாகும். 🙏",
    "உள்ளே அமைதி இருந்தால் வெளியே எதுவும் தொந்தரவு செய்யாது. 🙏",
  ],
  default: [
    "வாழ்க தமிழ், வாழ்க வள்ளுவம். 🙏",
    "திருக்குறள் உன் வாழ்க்கையின் வழிகாட்டி. 🙏",
    "ஒவ்வொரு குறளும் ஒரு விளக்கு — உன் வாழ்க்கையின் இருளை போக்கும். 🙏",
  ],
};

function detectTheme(query: string): string {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);

  // Score each theme based on keyword matches
  const scores: Record<string, number> = {};
  for (const word of words) {
    // Exact word match
    if (KEYWORD_THEME_MAP[word]) {
      const theme = KEYWORD_THEME_MAP[word];
      scores[theme] = (scores[theme] || 0) + 3;
    }
    // Partial match for longer words
    for (const [keyword, theme] of Object.entries(KEYWORD_THEME_MAP)) {
      if (keyword.length > 4 && lower.includes(keyword)) {
        scores[theme] = (scores[theme] || 0) + 1;
      }
    }
  }

  // Return highest scoring theme
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : 'default';
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function findBestKural(theme: string, query: string) {
  // 1. Try theme array match from Supabase
  const { data: themeMatches } = await supabase
    .from('kurals')
    .select('*')
    .overlaps('themes', [theme])
    .limit(8);

  if (themeMatches && themeMatches.length > 0) {
    return themeMatches[Math.floor(Math.random() * Math.min(themeMatches.length, 4))];
  }

  // 2. Fallback: keyword search in english column
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    const { data } = await supabase
      .from('kurals')
      .select('*')
      .ilike('english', `%${word}%`)
      .limit(3);
    if (data && data.length > 0) return data[0];
  }

  // 3. Final fallback: random kural
  const { data: allKurals } = await supabase.from('kurals').select('*');
  if (allKurals && allKurals.length > 0) {
    return allKurals[Math.floor(Math.random() * allKurals.length)];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const theme = detectTheme(message);
    const kural = await findBestKural(theme, message);

    if (!kural) {
      return NextResponse.json({ error: 'Could not find a Kural' }, { status: 500 });
    }

    const intros = ARUL_INTROS[theme] || ARUL_INTROS.default;
    const closings = ARUL_CLOSINGS[theme] || ARUL_CLOSINGS.default;

    const reply = {
      intro: pick(intros),
      closing: pick(closings),
      theme,
    };

    return NextResponse.json({ kural, reply });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
