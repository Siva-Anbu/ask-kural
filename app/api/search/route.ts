import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// Constants (unchanged)
// ---------------------------------------------------------------------------

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
  'kural', 'kuṟa', 'குறள்', 'chapter', 'adhikaram', 'அதிகாரம்', 'give', 'show', 'tell',
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
  // ── LOVE & RELATIONSHIPS ────────────────────────────────────────────────
  'fear_of_loss': ['afraid', 'fear', 'losing', 'lose', 'loss', 'scared', 'worried', 'anxious', 'people I love', 'loved ones', 'attachment', 'பற்று'],
  'heartbreak': ['பிரிவு', 'separation', 'pallor', 'பசலை', 'longing', 'pine', 'sorrow', 'grief', 'heartbreak', 'broken heart', 'heart hurts', 'crying over someone', 'can\'t stop crying'],
  'failed_love': ['பிரிவு', 'separation', 'lost', 'pain', 'துக்கம்', 'பசலை', 'sallow', 'failed love', 'love failed', 'relationship failed'],
  'breakup': ['பிரிவு', 'separation', 'apart', 'left', 'gone', 'நோய்', 'anguish', 'breakup', 'broke up', 'left me', 'walked away', 'abandoned me'],
  'missing_lover': ['நினைவு', 'remember', 'absence', 'தனிமை', 'longing', 'yearn', 'embrace', 'miss', 'missing', 'thinking about them', 'can\'t stop thinking about'],
  'unrequited_love': ['காதல்', 'love', 'rejection', 'pain', 'sorrow', 'நோய்', 'unrequited', 'one-sided', 'they don\'t love me', 'love not returned'],
  'betrayed_love': ['நம்பிக்கை', 'trust', 'betrayal', 'broken', 'deceit', 'வஞ்சம்', 'cheated', 'betrayed', 'cheating partner', 'unfaithful', 'infidelity'],
  'toxic_relationship': ['toxic', 'manipulative', 'controlling', 'abusive', 'bad relationship', 'unhealthy relationship', 'can\'t leave', 'trapped in relationship', 'hurt by partner'],
  'attachment': ['love', 'attachment', 'bond', 'close', 'dear', 'precious', 'cherish', 'holding on', 'let go', 'affection', 'அன்பு', 'can\'t let go', 'too attached'],

  // ── WORK & CAREER ───────────────────────────────────────────────────────
  'lost_job': ['தொழில்', 'வேலை', 'unemployment', 'வறுமை', 'poverty', 'struggle', 'hardship', 'job loss', 'fired', 'laid off', 'lost my job', 'no work'],
  'career_failure': ['தோல்வி', 'setback', 'failure', 'perseverance', 'பொறுமை', 'effort', 'career', 'professional', 'career not going well', 'stuck in career'],
  'work_stress': ['வேலை', 'pressure', 'burden', 'தொழில்', 'struggle', 'fatigue', 'stress', 'overwhelmed', 'burnout', 'burned out', 'drained', 'overworked', 'too much work', 'deadline', 'boss', 'can\'t cope with work', 'exhausted from work'],
  'no_job': ['வேலை', 'தொழில்', 'unemployment', 'search', 'opportunity', 'வறுமை', 'jobless', 'unemployed', 'can\'t find work', 'job hunting'],
  'business_loss': ['செல்வம்', 'wealth', 'loss', 'தோல்வி', 'bankruptcy', 'வறுமை', 'business', 'financial loss', 'business failed', 'company failed'],

  // ── FAMILY ──────────────────────────────────────────────────────────────
  'parent_conflict': ['பெற்றோர்', 'மரியாதை', 'respect', 'duty', 'கடமை', 'honor', 'அறம்', 'parents', 'family conflict', 'fight with parents', 'parents don\'t understand'],
  'father_fight': ['பெற்றோர்', 'அப்பா', 'father', 'மரியாதை', 'respect', 'அறம்', 'dad', 'father argument', 'fight with dad', 'dad doesn\'t understand'],
  'mother_issue': ['பெற்றோர்', 'அம்மா', 'mother', 'மரியாதை', 'care', 'அன்பு', 'mom', 'mother problem', 'fight with mom', 'mom doesn\'t understand'],
  'family_betrayal': ['நட்பு', 'trust', 'நம்பிக்கை', 'broken', 'குடும்பம்', 'relatives', 'family', 'betrayal', 'family let me down', 'relatives hurt me'],
  'sibling_rivalry': ['குடும்பம்', 'family', 'jealousy', 'பொறாமை', 'conflict', 'sibling', 'brother', 'sister', 'sibling fight', 'brother problem', 'sister problem'],
  'homesick': ['homesick', 'miss home', 'miss my family', 'far from home', 'far from family', 'miss my country', 'away from home', 'தாய்நாடு', 'missing homeland', 'living abroad', 'feel like a stranger'],

  // ── EMOTIONS ────────────────────────────────────────────────────────────
  'anger_control': ['கோபம்', 'சினம்', 'patience', 'பொறுமை', 'calm', 'self-control', 'அடக்கம்', 'anger', 'rage', 'mad', 'frustrated', 'frustration', 'irritated', 'annoyed', 'fed up', 'fuming', 'burst out', 'can\'t control temper'],
  'loneliness': ['தனிமை', 'solitude', 'அன்பு', 'companionship', 'alone', 'isolated', 'lonely', 'no one understands', 'no one cares', 'feel invisible', 'nobody listens', 'feel unwanted', 'no friends'],
  'depression': ['துக்கம்', 'sorrow', 'sadness', 'grief', 'despair', 'hopeless', 'depressed', 'low', 'down', 'no hope', 'giving up', 'what\'s the point', 'meaningless', 'pointless', 'feel empty', 'feel nothing', 'numb inside', 'emotionally dead', 'don\'t want to live', 'no reason to go on'],
  'anxiety': ['அச்சம்', 'பயம்', 'fear', 'worry', 'nervous', 'dread', 'anxious', 'worried', 'panic', 'overthinking', 'can\'t stop worrying', 'racing thoughts', 'what if', 'something bad will happen', 'constant worry', 'stressed out'],
  'grief': ['துக்கம்', 'sorrow', 'அழுகை', 'loss', 'mourning', 'pain', 'grief', 'bereavement', 'can\'t stop crying', 'so much pain', 'broken inside'],
  'jealousy': ['பொறாமை', 'envy', 'resentment', 'covet', 'jealous', 'envious', 'why do they have more', 'comparing myself', 'everyone is doing better', 'left behind'],
  'pride_ego': ['செருக்கு', 'arrogance', 'ego', 'vanity', 'conceit', 'pride', 'arrogant', 'too proud', 'show off', 'boastful', 'think I\'m better', 'my ego', 'I am arrogant', 'I have pride'],
  'dealing_with_arrogance': ['செருக்கு', 'பொறுமை', 'arrogant person', 'someone has ego', 'their ego', 'his ego', 'her ego', 'neighbour has ego', 'colleague has ego', 'friend has ego', 'boss has ego', 'dealing with arrogance', 'how to handle arrogance', 'someone is arrogant', 'they are arrogant', 'too much attitude', 'full of themselves', 'so arrogant', 'what to do with arrogant', 'how to deal with proud person', 'neighbour', 'coworker attitude', 'difficult person', 'someone difficult', 'hard to deal with', 'impossible person', 'patience with others', 'tolerance'],
  'shame': ['நாணம்', 'embarrassment', 'disgrace', 'humiliation', 'shame', 'ashamed', 'embarrassed', 'want to disappear', 'can\'t face anyone', 'so humiliated'],
  'regret': ['regret', 'remorse', 'guilty', 'guilt', 'mistake', 'I made a mistake', 'if only', 'should have', 'shouldn\'t have', 'I wish I hadn\'t', 'past mistake', 'wrong decision', 'I regret', 'feel terrible about', 'மனம் வருந்துகிறேன்', 'பிழை'],
  'frustration': ['frustrated', 'frustration', 'irritated', 'annoyed', 'fed up', 'sick of this', 'can\'t take it anymore', 'nothing works', 'why does this keep happening', 'so annoying', 'nothing goes right'],
  'burnout': ['burnout', 'burned out', 'exhausted', 'mentally exhausted', 'emotionally drained', 'drained', 'can\'t cope', 'too much', 'worn out', 'running on empty', 'nothing left to give', 'tired of everything', 'can\'t do this anymore'],
  'self_doubt': ['not good enough', 'self-doubt', 'insecure', 'low confidence', 'worthless', 'inadequate', 'imposter', 'feel like a failure', 'everyone is better than me', 'I\'m useless', 'I\'m not capable', 'don\'t believe in myself', 'no confidence'],
  'disappointment': ['disappointed', 'disappointment', 'let down', 'expected more', 'not what I hoped', 'my expectations were wrong', 'people disappoint me', 'I feel let down', 'so disappointed'],
  'hopelessness': ['no hope', 'hopeless', 'helpless', 'giving up', 'nothing will change', 'what\'s the point', 'no future', 'can\'t see a way out', 'it\'s all pointless', 'nothing matters', 'why bother'],
  'feeling_empty': ['feel empty', 'feel nothing', 'numb', 'hollow inside', 'emotionally numb', 'emptiness', 'no feelings', 'going through the motions', 'don\'t feel anything'],
  'overthinking': ['overthinking', 'can\'t stop thinking', 'mind won\'t stop', 'racing thoughts', 'stuck in my head', 'thinking too much', 'can\'t switch off', 'can\'t sleep because of thoughts', 'obsessing', 'ruminating'],
  'cant_sleep': ['can\'t sleep', 'insomnia', 'sleepless', 'awake at night', 'worrying at night', 'lying awake', 'racing mind at night', 'restless mind', 'mind won\'t let me sleep'],

  // ── SELF & PURPOSE ──────────────────────────────────────────────────────
  'faith_crisis': ['கடவுள்', 'இறை', 'virtue', 'அறம்', 'doubt', 'belief', 'faith', 'spiritual crisis', 'lost faith', 'questioning god', 'why does god let this happen'],
  'life_purpose': ['அறம்', 'dharma', 'duty', 'கடமை', 'meaning', 'purpose', 'life goal', 'why live', 'what am I doing with my life', 'no goals', 'where am I going', 'what\'s my purpose', 'meaning of life', 'why am I here', 'feel purposeless'],
  'lost_direction': ['வழி', 'path', 'direction', 'purpose', 'கடமை', 'confused', 'lost', 'no direction', 'bored', 'boredom', 'idle', 'unmotivated', 'don\'t know what to do', 'confused about life', 'crossroads', 'which way to go', 'feel stuck', 'going nowhere'],
  'moral_dilemma': ['அறம்', 'virtue', 'right', 'wrong', 'ethics', 'நீதி', 'moral', 'ethical', 'dilemma', 'is it right to', 'should I', 'not sure if it\'s right'],
  'procrastination': ['சோம்பல்', 'lazy', 'delay', 'postpone', 'effort', 'முயற்சி', 'procrastinate', 'putting off', 'bored', 'boredom', 'idle', 'idleness', 'restless', 'nothing to do', 'unmotivated', 'uninspired', 'can\'t focus', 'distracted', 'can\'t start', 'keep delaying'],
  'self_improvement': ['become better', 'self-improvement', 'improve myself', 'be a good person', 'want to change', 'better version of myself', 'how to be good', 'grow as a person', 'discipline', 'self-discipline', 'want to be wise'],
  'need_motivation': ['need motivation', 'how to keep going', 'feel like giving up', 'stay strong', 'keep trying', 'how to persevere', 'don\'t want to give up', 'need strength', 'inspire me', 'how to push through'],

  // ── FAILURE & SETBACKS ──────────────────────────────────────────────────
  'failure_feeling': ['தோல்வி', 'failure', 'defeat', 'worthless', 'shame', 'failed', 'defeated', 'I keep failing', 'always fail', 'nothing I do works'],
  'rejection': ['rejected', 'rejection', 'not chosen', 'nobody wants me', 'feel unwanted', 'turned down', 'they said no', 'excluded', 'left out', 'not good enough for them'],
  'unappreciated': ['taken for granted', 'not appreciated', 'no one notices', 'unrecognized', 'my efforts go unnoticed', 'nobody thanks me', 'feel used', 'people use me', 'not valued'],

  // ── RELATIONSHIPS & TRUST ───────────────────────────────────────────────
  'betrayed_friend': ['நட்பு', 'friendship', 'நம்பிக்கை', 'trust', 'betrayal', 'வஞ்சம்', 'friend betrayed', 'friend stabbed me in the back', 'friend hurt me', 'friendship broken'],
  'trust_broken': ['நம்பிக்கை', 'trust', 'betrayal', 'deceit', 'வஞ்சம்', 'broken', 'trust broken', 'can\'t trust anyone', 'everyone lies', 'trust issues'],
  'forgiveness': ['forgive', 'forgiveness', 'can\'t forgive', 'how to forgive', 'letting go of hurt', 'bitterness', 'holding grudge', 'still angry at them', 'move past the hurt', 'மன்னிப்பு'],
  'hatred_revenge': ['hatred', 'hate', 'revenge', 'bitter', 'bitterness', 'enemy', 'want to hurt them', 'vindictive', 'can\'t stand them', 'despise', 'resentment', 'வெறுப்பு'],
  'moving_on': ['move on', 'moving on', 'can\'t move on', 'stuck in the past', 'how to let go', 'can\'t forget', 'fresh start', 'start over', 'leave the past behind', 'heal from the past'],

  // ── SOCIAL & REPUTATION ─────────────────────────────────────────────────
  'insult': ['அவமானம்', 'insult', 'disgrace', 'humiliation', 'shame', 'நாணம்', 'insulted', 'disrespected', 'humiliated', 'belittled', 'mocked', 'ridiculed'],
  'gossip_rumor': ['புகழ்', 'reputation', 'rumor', 'gossip', 'slander', 'talked about', 'people spreading lies about me', 'rumors about me', 'people judging me', 'reputation damaged', 'character assassination'],
  'public_shame': ['அவமானம்', 'shame', 'disgrace', 'public', 'humiliation', 'public shame', 'embarrassed publicly', 'shamed in front of others', 'exposed publicly'],
  'false_accusation': ['பொய்', 'false', 'lie', 'accusation', 'slander', 'falsely accused', 'wrongly blamed', 'blamed for something I didn\'t do', 'wrongly accused'],
  'lying_truth': ['பொய்', 'lie', 'lying', 'false', 'falsehood', 'truth', 'உண்மை', 'honest', 'honesty', 'deceit', 'deceive', 'should I tell the truth', 'is lying wrong'],

  // ── FINANCIAL ───────────────────────────────────────────────────────────
  'poverty': ['வறுமை', 'poor', 'poverty', 'struggle', 'hardship', 'செல்வம்', 'broke', 'no money', 'can\'t afford', 'financial difficulty', 'money problems'],
  'greed': ['பேராசை', 'greedy', 'avarice', 'covet', 'desire', 'greed', 'greedy', 'want more', 'never satisfied', 'always wanting more'],
  'debt': ['கடன்', 'debt', 'owe', 'burden', 'வறுமை', 'owing money', 'can\'t pay back', 'drowning in debt', 'financial burden'],

  // ── HEALTH ──────────────────────────────────────────────────────────────
  'illness': ['நோய்', 'sick', 'disease', 'pain', 'suffering', 'health', 'ill', 'chronic illness', 'health problems', 'dealing with sickness'],
  'physical_pain': ['வலி', 'pain', 'ache', 'suffer', 'நோய்', 'hurt', 'painful', 'body pain', 'chronic pain', 'in pain'],
  'death_grief': ['இறப்பு', 'death', 'died', 'மரணம்', 'loss', 'துக்கம்', 'passed away', 'lost someone', 'someone died', 'death of loved one', 'grieving a loss', 'they\'re gone forever'],
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
  ego: ['pride', 'arrogance', 'conceit', 'vanity', 'haughtiness', 'self', 'செருக்கு', 'யான்', 'எனது'],
  humble: ['humility', 'modesty', 'meekness', 'simplicity', 'பணிவு'],
  prayer: ['god', 'virtue', 'faith', 'worship', 'devotion', 'பிரார்த்தனை'],
  lie: ['lying', 'false', 'falsehood', 'dishonest', 'deceit', 'untruth', 'பொய்'],
  lying: ['lie', 'false', 'falsehood', 'dishonest', 'பொய்', 'deceit'],
  honest: ['honesty', 'truth', 'truthful', 'sincere', 'genuine', 'உண்மை'],
  honesty: ['honest', 'truth', 'truthful', 'sincere', 'உண்மை'],
  // boredom / idleness
  bored: ['boredom', 'idle', 'lazy', 'restless', 'unmotivated', 'uninspired', 'சோம்பல்', 'nothing to do'],
  boredom: ['bored', 'idle', 'lazy', 'restless', 'unmotivated', 'சோம்பல்'],
  idle: ['bored', 'lazy', 'சோம்பல்', 'inaction', 'effort', 'முயற்சி'],
  // regret / guilt
  regret: ['remorse', 'guilt', 'mistake', 'sorry', 'ashamed', 'if only', 'should have', 'wrong decision', 'பிழை'],
  remorse: ['regret', 'guilt', 'sorry', 'ashamed', 'mistake', 'பிழை'],
  guilty: ['guilt', 'regret', 'remorse', 'ashamed', 'sorry', 'wrongdoing'],
  guilt: ['guilty', 'regret', 'remorse', 'ashamed', 'sorry'],
  // frustration
  frustrated: ['frustration', 'irritated', 'annoyed', 'fed up', 'anger', 'கோபம்', 'exasperated'],
  frustration: ['frustrated', 'irritation', 'annoyance', 'anger', 'கோபம்', 'fed up'],
  irritated: ['frustrated', 'annoyed', 'angry', 'fed up', 'கோபம்'],
  annoyed: ['irritated', 'frustrated', 'fed up', 'anger', 'கோபம்'],
  // burnout / exhaustion
  burnout: ['exhausted', 'drained', 'tired', 'worn out', 'overworked', 'fatigue', 'சோர்வு'],
  exhausted: ['burnout', 'drained', 'tired', 'fatigued', 'worn out', 'சோர்வு'],
  drained: ['exhausted', 'burnout', 'tired', 'worn out', 'சோர்வு'],
  overwhelmed: ['burnout', 'stressed', 'too much', 'pressure', 'can\'t cope', 'burden'],
  // self-doubt / insecurity
  insecure: ['self-doubt', 'low confidence', 'worthless', 'not good enough', 'inadequate', 'நம்பிக்கையின்மை'],
  worthless: ['insecure', 'self-doubt', 'failure', 'inadequate', 'not good enough', 'தோல்வி'],
  inadequate: ['insecure', 'worthless', 'not enough', 'self-doubt', 'failure'],
  confidence: ['courage', 'self-belief', 'strength', 'brave', 'தைரியம்', 'willpower'],
  // disappointment
  disappointed: ['disappointment', 'let down', 'expectations', 'sad', 'hurt', 'துக்கம்'],
  disappointment: ['disappointed', 'let down', 'betrayed', 'sadness', 'grief', 'துக்கம்'],
  // hopelessness / helplessness
  hopeless: ['despair', 'helpless', 'giving up', 'no hope', 'depression', 'defeated', 'துக்கம்'],
  helpless: ['hopeless', 'powerless', 'stuck', 'can\'t do anything', 'no control'],
  despair: ['hopeless', 'helpless', 'depression', 'grief', 'giving up', 'tukkam', 'துக்கம்'],
  // emptiness / numbness
  empty: ['numb', 'hollow', 'feel nothing', 'emotionally dead', 'depression', 'lonely', 'தனிமை'],
  numb: ['empty', 'feel nothing', 'emotionally numb', 'hollow', 'depression'],
  hollow: ['empty', 'numb', 'lonely', 'purposeless', 'depression'],
  // overthinking
  overthinking: ['anxiety', 'worry', 'racing thoughts', 'can\'t stop thinking', 'ruminating', 'அச்சம்'],
  ruminating: ['overthinking', 'anxiety', 'worry', 'regret', 'stuck in head'],
  // forgiveness
  forgive: ['forgiveness', 'let go', 'move on', 'healing', 'release anger', 'மன்னிப்பு'],
  forgiveness: ['forgive', 'healing', 'moving on', 'letting go', 'மன்னிப்பு'],
  // hate / bitterness / revenge
  hate: ['hatred', 'bitter', 'revenge', 'anger', 'enemy', 'resent', 'வெறுப்பு', 'கோபம்'],
  hatred: ['hate', 'bitterness', 'revenge', 'resentment', 'enemy', 'வெறுப்பு'],
  bitter: ['bitterness', 'hatred', 'resentment', 'grudge', 'anger', 'forgiveness'],
  bitterness: ['bitter', 'hatred', 'resentment', 'grudge', 'can\'t forgive'],
  revenge: ['hatred', 'anger', 'enemy', 'justice', 'bitterness', 'பகை'],
  // moving on / healing
  healing: ['moving on', 'recovery', 'getting better', 'letting go', 'forgiveness'],
  // rejection
  rejected: ['rejection', 'unwanted', 'excluded', 'not chosen', 'hurt', 'lonely', 'தனிமை'],
  rejection: ['rejected', 'unwanted', 'excluded', 'disappointment', 'pain', 'heartbreak'],
  // unappreciated
  unappreciated: ['taken for granted', 'not noticed', 'ignored', 'lonely', 'feel used'],
  // motivation
  motivation: ['effort', 'perseverance', 'determination', 'strength', 'முயற்சி', 'willpower'],
  motivated: ['inspired', 'determined', 'effort', 'perseverance', 'முயற்சி'],
  inspired: ['motivation', 'purpose', 'meaning', 'goal', 'direction', 'effort'],
  // confusion
  confused: ['lost', 'uncertain', 'no direction', 'don\'t know', 'crossroads', 'வழி'],
  uncertainty: ['confused', 'doubt', 'unsure', 'lost', 'no direction', 'anxiety'],
  // stress
  stressed: ['stress', 'pressure', 'overwhelmed', 'anxiety', 'worry', 'burden', 'அச்சம்'],
  stress: ['stressed', 'pressure', 'anxiety', 'overwhelmed', 'tension', 'worry'],
  // homesick
  homesick: ['miss home', 'miss family', 'far from home', 'lonely', 'தனிமை', 'longing'],
  // toxic / abusive
  toxic: ['manipulative', 'controlling', 'abusive', 'bad relationship', 'harmful'],
  manipulative: ['toxic', 'controlling', 'deceit', 'betrayal', 'வஞ்சம்'],
  // self-improvement
  discipline: ['self-control', 'effort', 'perseverance', 'willpower', 'முயற்சி', 'அடக்கம்'],
  willpower: ['discipline', 'effort', 'strength', 'perseverance', 'முயற்சி'],
  // dealing with others
  neighbour: ['difficult person', 'arrogance', 'patience', 'tolerance', 'பொறுமை', 'அடக்கம்'],
  arrogant: ['ego', 'pride', 'செருக்கு', 'difficult person', 'patience', 'பொறுமை'],
  attitude: ['arrogance', 'ego', 'pride', 'செருக்கு', 'difficult person', 'patience'],
  colleague: ['work', 'coworker', 'difficult person', 'patience', 'பொறுமை'],
  coworker: ['colleague', 'work', 'difficult person', 'patience', 'பொறுமை'],
};

// ---------------------------------------------------------------------------
// Embedding pipeline (cached across warm Node.js invocations)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipeline: any | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEmbeddingPipeline(): Promise<any> {
  if (!_pipeline) {
    const { pipeline } = await import('@xenova/transformers');
    _pipeline = await pipeline('feature-extraction', 'Supabase/gte-small');
  }
  return _pipeline;
}

async function getEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

// ---------------------------------------------------------------------------
// Existing helper functions (unchanged)
// ---------------------------------------------------------------------------

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
  const match1 = lower.match(/^(\d{1,4})$/);
  if (match1) { const num = parseInt(match1[1]); if (num >= 1 && num <= 1330) return num; }
  const match2 = lower.match(/(?:kural|குறள்|kuṟa)\s*[#:]?\s*(\d{1,4})/i);
  if (match2) { const num = parseInt(match2[1]); if (num >= 1 && num <= 1330) return num; }
  const match3 = lower.match(/(?:give|show|tell|get|fetch|find|number|no\.?)\s+(?:me\s+)?(?:kural\s+)?[#:]?\s*(\d{1,4})/i);
  if (match3) { const num = parseInt(match3[1]); if (num >= 1 && num <= 1330) return num; }
  return null;
}

function extractChapterKuralQuery(message: string): number | null {
  const lower = message.toLowerCase().trim();
  const match1 = lower.match(/(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|\d+(?:st|nd|rd|th)?)\s+(?:kural|குறள்)\s+(?:of|in)\s+(?:chapter|அதிகாரம்)\s+(\d{1,3})/i);
  if (match1) { const pos = ORDINALS_EN[match1[1]] || parseInt(match1[1]); const chap = parseInt(match1[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const match2 = lower.match(/(?:chapter|அதிகாரம்)\s+(\d{1,3})(?:'s)?\s+(?:kural|குறள்)?\s*(\d{1,2}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)/i);
  if (match2) { const chap = parseInt(match2[1]); const pos = ORDINALS_EN[match2[2]] || parseInt(match2[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const match3 = message.match(/(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s+(?:குறள்|kural)?\s*(?:அதிகாரத்தின்|அதிகாரம்)?\s+(\d{1,3})/);
  if (match3) { const pos = ORDINALS_TA[match3[1]]; const chap = parseInt(match3[2]); if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  const match4 = message.match(/(?:அதிகாரம்|chapter)\s+(\d{1,3})\s*(?:இன்|ன்|of)?\s*(முதல்|முதலாவது|இரண்டாம்|இரண்டாவது|மூன்றாம்|மூன்றாவது|நான்காம்|நான்காவது|ஐந்தாம்|ஐந்தாவது|ஆறாம்|ஆறாவது|ஏழாம்|ஏழாவது|எட்டாம்|எட்டாவது|ஒன்பதாம்|ஒன்பதாவது|பத்தாம்|பத்தாவது|கடைசி)\s*(?:குறள்)?/);
  if (match4) { const chap = parseInt(match4[1]); const pos = ORDINALS_TA[match4[2]]; if (chap >= 1 && chap <= 133 && pos >= 1 && pos <= 10) return (chap - 1) * 10 + pos; }
  return null;
}

async function getKuralByNumber(num: number) {
  const { data, error } = await supabase.from('Kurals-new').select('*').eq('Number', num).single();
  if (error || !data) return null;
  return data;
}

// ---------------------------------------------------------------------------
// Predefined answers lookup
// ---------------------------------------------------------------------------

const QUESTION_PREFIXES = [
  'what is ', 'what are ', "what's ", 'whats ', 'define ', 'meaning of ',
  'explain ', 'tell me about ', 'about ', 'importance of ', 'describe ',
  'what do you mean by ', 'what does ', 'how is ', 'what exactly is ',
];
const QUESTION_SUFFIXES = [' mean', ' means', ' meaning'];

function stripQuestionWords(s: string): string {
  let stripped = s.replace(/[?!.]+$/, '').trim();
  for (const prefix of QUESTION_PREFIXES) {
    if (stripped.startsWith(prefix)) { stripped = stripped.slice(prefix.length).trim(); break; }
  }
  for (const suffix of QUESTION_SUFFIXES) {
    if (stripped.endsWith(suffix)) stripped = stripped.slice(0, -suffix.length).trim();
  }
  return stripped;
}

async function checkPredefinedAnswer(message: string): Promise<Record<string, unknown>[] | null> {
  const normalized = message.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const stripped = stripQuestionWords(normalized);

  const { data, error } = await supabase.from('predefined_answers').select('*');
  if (error || !data?.length) return null;

  for (const entry of data) {
    for (const phrase of entry.trigger_phrases as string[]) {
      const p = phrase.toLowerCase().trim();
      if (normalized === p || stripped === p) {
        const kurals = await Promise.all((entry.kural_numbers as number[]).map((n: number) => getKuralByNumber(n)));
        return kurals.filter(Boolean) as Record<string, unknown>[];
      }
    }
  }
  return null;
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
  return Array.from(new Set(detectedThemes));
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

// Keyword-based fallback — returns top 3
async function findBestKurals(keywords: string[], fullQuestion: string, queryContext: string): Promise<Record<string, unknown>[]> {
  const expanded = expandQueryWithSynonyms(keywords);
  const searchResults: Record<string, unknown>[] = [];
  for (const kw of expanded.slice(0, 20)) {
    const { data } = await supabase.from('Kurals-new').select('*').or(`Translation.ilike.%${kw}%,explanation.ilike.%${kw}%,Line1.ilike.%${kw}%,Line2.ilike.%${kw}%`).limit(30);
    if (data?.length) searchResults.push(...data);
  }
  const unique = Array.from(new Map(searchResults.map(k => [k.Number, k])).values());
  if (unique.length > 0) {
    const scored = unique
      .map(k => ({ kural: k, kwCount: scoreKuralByKeywordCount(k, expanded), weighted: scoreKural(k, expanded, queryContext), sem: semanticScore(k, fullQuestion) }))
      .filter(k => k.weighted > 0)
      .sort((a, b) => b.weighted - a.weighted || b.sem - a.sem || b.kwCount - a.kwCount);
    if (scored.length > 0) return scored.slice(0, 3).map(s => s.kural);
  }
  const { data: fallback } = await supabase.from('Kurals-new').select('*').limit(100);
  return fallback?.length ? [fallback[Math.floor(Math.random() * fallback.length)]] : [];
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
  if (lower.match(/sad|depress|lonely|alone|grief|sorrow|empty|numb|hopeless/i)) s.push("Try: 'advice for sadness'", "Try: 'kural about loneliness'");
  if (lower.match(/anger|mad|rage|frustrat|irritat|annoyed|fed up/i)) s.push("Try: 'how to control anger'", "Try: 'kural about patience'");
  if (lower.match(/love|heart|breakup|relationship|losing|afraid|miss|missing/i)) s.push("Try: 'kural about love & attachment'", "Try: 'dealing with fear of loss'");
  if (lower.match(/job|work|career|unemploy|burnout|exhausted/i)) s.push("Try: 'kural about perseverance'", "Try: 'advice for job loss'");
  if (lower.match(/family|parent|mother|father|homesick/i)) s.push("Try: 'kural about respecting parents'", "Try: 'family harmony advice'");
  if (lower.match(/regret|guilty|guilt|mistake|should have/i)) s.push("Try: 'kural about past mistakes'", "Try: 'how to move forward from regret'");
  if (lower.match(/bored|idle|lazy|unmotivated|no motivation/i)) s.push("Try: 'kural about laziness and effort'", "Try: 'advice for lack of motivation'");
  if (lower.match(/confus|lost|direction|purpose|meaning/i)) s.push("Try: 'kural about finding purpose'", "Try: 'advice for life direction'");
  if (lower.match(/forgiv|hate|bitter|revenge|enemy/i)) s.push("Try: 'kural about forgiving enemies'", "Try: 'how to let go of hatred'");
  if (lower.match(/trust|betray|cheat|deceiv/i)) s.push("Try: 'kural about betrayal'", "Try: 'kural about trust'");
  return s.length ? s.slice(0, 3) : ["Try: 'show me kural 55'", "Try: 'advice for life challenges'"];
}

// ---------------------------------------------------------------------------
// Semantic search helpers
// ---------------------------------------------------------------------------

const POLITICAL_INDICATORS = [
  'king', 'ruler', 'state', 'army', 'war', 'enemy', 'foe', 'battle',
  'minister', 'government', 'politics', 'kingdom', 'empire',
];

interface QuestionareMatch {
  id: number;
  Situation: string;
  Kural_1: number | null;
  Tamil1_1: string | null;
  Tamil2_1: string | null;
  Meaning_1: string | null;
  Kural_2: number | null;
  Tamil1_2: string | null;
  Tamil2_2: string | null;
  Meaning_2: string | null;
  Kural_3: number | null;
  Tamil1_3: string | null;
  Tamil2_3: string | null;
  Meaning_3: string | null;
  similarity: number;
}

async function semanticSearchQuestionare(
  embedding: number[],
  originalMessage: string
): Promise<{ kurals: Record<string, unknown>[]; matchedSituation: string; similarity: number } | null> {
  const { data, error } = await supabase.rpc('match_questionare', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 3,
  });
  if (error || !data?.length) return null;

  const best = data[0] as QuestionareMatch;

  const candidates: Array<{ num: number; meaning: string | null; isPrimary: boolean }> = [];
  if (best.Kural_1) candidates.push({ num: best.Kural_1, meaning: best.Meaning_1, isPrimary: true });
  if (best.Kural_2) candidates.push({ num: best.Kural_2, meaning: best.Meaning_2, isPrimary: false });
  if (best.Kural_3) candidates.push({ num: best.Kural_3, meaning: best.Meaning_3, isPrimary: false });
  if (!candidates.length) return null;

  // Sort candidates: primary first, then by keyword match score
  const keywords = extractQuestionareKeywords(originalMessage).map(k => k.toLowerCase());
  const scored = candidates.map(c => {
    const meaningLower = (c.meaning ?? '').toLowerCase();
    let score = c.isPrimary ? 5 : 0;
    for (const kw of keywords) { if (meaningLower.includes(kw)) score += 10; }
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  // Fetch all 3 full kurals in parallel
  const fetched = await Promise.all(scored.map(c => getKuralByNumber(c.num)));
  const kurals = fetched.filter(Boolean) as Record<string, unknown>[];
  if (!kurals.length) return null;

  return { kurals, matchedSituation: best.Situation, similarity: Math.round(best.similarity * 100) };
}

interface KuralMatch {
  Number: number;
  Line1: string | null;
  Line2: string | null;
  Translation: string | null;
  mv: string | null;
  sp: string | null;
  mk: string | null;
  explanation: string | null;
  couplet: string | null;
  transliteration1: string | null;
  transliteration2: string | null;
  similarity: number;
}

async function semanticSearchKurals(
  embedding: number[],
  queryContext: string,
  queryKeywords: string[]
): Promise<KuralMatch[] | null> {
  const { data, error } = await supabase.rpc('match_kurals', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 15,
  });
  if (error || !data?.length) return null;

  const results = data as KuralMatch[];
  const expanded = expandQueryWithSynonyms(queryKeywords);

  // Hybrid re-rank: semantic similarity (70%) + keyword presence (30%).
  // Prevents kurals about the *opposite* concept from winning on pure semantic
  // similarity alone (e.g. "ego" → modesty kural instead of pride kural).
  type Rescored = KuralMatch & { hybridScore: number };
  const rescored: Rescored[] = results.map(k => {
    const allText = [k.Translation, k.explanation, k.mv, k.sp, k.mk]
      .filter(Boolean).join(' ').toLowerCase();
    let hits = 0;
    for (const kw of expanded) {
      if (kw.length >= 3 && allText.includes(kw.toLowerCase())) hits++;
    }
    const kwBonus = Math.min(hits / Math.max(expanded.length * 0.25, 2), 1) * 0.3;
    return { ...k, hybridScore: k.similarity * 0.7 + kwBonus };
  });

  const sorted = (ctx: Rescored[]) => ctx.sort((a, b) => b.hybridScore - a.hybridScore);

  if (queryContext === 'emotional') {
    const filtered = rescored.filter(k => {
      const text = [k.Translation, k.explanation].filter(Boolean).join(' ').toLowerCase();
      return POLITICAL_INDICATORS.filter(w => text.includes(w)).length < 2;
    });
    return sorted(filtered.length ? filtered : rescored).slice(0, 3);
  }

  return sorted(rescored).slice(0, 3);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const queryContext = detectQueryContext(message);

    // 1. Direct kural number lookup
    const directNum = extractDirectKuralNumber(message);
    if (directNum) {
      const kural = await getKuralByNumber(directNum);
      if (kural) return NextResponse.json({ kurals: [kural], keywords: [`kural-${directNum}`], source: 'direct', confidence: 'high', confidenceMessage: '' });
    }

    // 2. Chapter-position lookup
    const chapterKuralNum = extractChapterKuralQuery(message);
    if (chapterKuralNum) {
      const kural = await getKuralByNumber(chapterKuralNum);
      if (kural) return NextResponse.json({ kurals: [kural], keywords: ['chapter-query'], source: 'chapter', confidence: 'high', confidenceMessage: '' });
    }

    // 3. Predefined curated answers ("what is love", "what is friendship", etc.)
    const predefinedKurals = await checkPredefinedAnswer(message);
    if (predefinedKurals?.length) {
      return NextResponse.json({ kurals: predefinedKurals, keywords: [], source: 'predefined', confidence: 'high', confidenceMessage: '' });
    }

    // Generate embedding + extract keywords once — reused by steps 3, 4, 5
    const embedding = await getEmbedding(message);
    const baseKeywords = extractKeywords(message);
    const detectedThemes = detectThemes(message);
    const enrichedKeywords = enrichKeywordsWithThemes(baseKeywords, detectedThemes);
    const displayKeywords = message.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').split(/\s+/).filter((w: string) => w.length > 2 && !KEYWORD_SEARCH_STOP_WORDS.has(w)).slice(0, 5);

    // 3. Semantic questionare search
    const questionareResult = await semanticSearchQuestionare(embedding, message);
    if (questionareResult) {
      return NextResponse.json({
        kurals: questionareResult.kurals,
        keywords: ['situation-match'],
        matchedSituation: questionareResult.matchedSituation,
        source: 'questionare',
        similarity: questionareResult.similarity,
        confidence: getConfidenceLevel('questionare', questionareResult.similarity),
        confidenceMessage: getConfidenceMessage('questionare', questionareResult.similarity),
      });
    }

    // 4. Semantic kural search with hybrid re-ranking
    const semanticKurals = await semanticSearchKurals(embedding, queryContext, enrichedKeywords);
    if (semanticKurals?.length) {
      const keywordCount = scoreKuralByKeywordCount(semanticKurals[0] as unknown as Record<string, unknown>, enrichedKeywords);
      return NextResponse.json({
        kurals: semanticKurals,
        keywords: displayKeywords,
        source: 'semantic',
        confidence: getConfidenceLevel('keyword', undefined, keywordCount),
        confidenceMessage: getConfidenceMessage('keyword', undefined, keywordCount),
        keywordCount,
        detectedThemes,
      });
    }

    // 5. Theme keyword fallback
    if (detectedThemes.length > 0) {
      const themeKw = detectedThemes.flatMap(t => THIRUKKURAL_THEMES[t] || []).slice(0, 10);
      const themeKurals = await findBestKurals(themeKw, message, queryContext);
      if (themeKurals.length) {
        return NextResponse.json({
          kurals: themeKurals,
          keywords: themeKw.slice(0, 5),
          source: 'theme-fallback',
          confidence: 'low',
          confidenceMessage: `While we couldn't find an exact match, here's a kural about ${detectedThemes[0].replace('_', ' ')} that might help:`,
          detectedThemes,
        });
      }
    }

    if (enrichedKeywords.length === 0) {
      return NextResponse.json({ error: 'Could not understand query. Please try rephrasing.', suggestions: getSuggestions(message) }, { status: 400 });
    }

    return NextResponse.json({ error: "We're still learning! Try rephrasing with words like 'sad', 'anger', 'love', or a kural number.", suggestions: getSuggestions(message) }, { status: 400 });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.', suggestions: ['Try: "show me kural 1"', 'Try: "advice for sadness"'] }, { status: 500 });
  }
}
