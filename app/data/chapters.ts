// All 133 Thirukkural chapters — index 0 = Chapter 1
// Chapter number = Math.ceil(kuralNumber / 10)

export const CHAPTERS: { en: string; ta: string }[] = [
  // ── Book 1: Virtue (அறத்துப்பால்) · Chapters 1–38 ──────────────────────
  { en: 'The Praise of God',            ta: 'கடவுள் வாழ்த்து' },        // 1
  { en: 'The Excellence of Rain',       ta: 'வான் சிறப்பு' },           // 2
  { en: 'Greatness of Ascetics',        ta: 'நீத்தார் பெருமை' },        // 3
  { en: 'Assertion of Virtue',          ta: 'அறன் வலியுறுத்தல்' },     // 4
  { en: 'Domestic Life',                ta: 'இல்வாழ்க்கை' },           // 5
  { en: 'The Good Wife',                ta: 'வாழ்க்கைத் துணை நலம்' },  // 6
  { en: 'Sons',                         ta: 'புதல்வரைப் பெறுதல்' },    // 7
  { en: 'Love',                         ta: 'அன்புடைமை' },              // 8
  { en: 'Hospitality',                  ta: 'விருந்தோம்பல்' },          // 9
  { en: 'Pleasant Words',               ta: 'இனியவை கூறல்' },          // 10
  { en: 'Gratitude',                    ta: 'செய்ந்நன்றி அறிதல்' },    // 11
  { en: 'Impartiality',                 ta: 'நடுவு நிலைமை' },          // 12
  { en: 'Self-Restraint',               ta: 'அடக்கமுடைமை' },           // 13
  { en: 'Right Conduct',                ta: 'ஒழுக்கமுடைமை' },          // 14
  { en: "Not Coveting Another's Wife",  ta: 'பிறனில் விழையாமை' },     // 15
  { en: 'Patience',                     ta: 'பொறையுடைமை' },            // 16
  { en: 'Not Envying',                  ta: 'அழுக்காறாமை' },           // 17
  { en: 'Not Coveting',                 ta: 'வெஃகாமை' },               // 18
  { en: 'Not Slandering',               ta: 'புறங்கூறாமை' },           // 19
  { en: 'Against Profitless Talk',      ta: 'பயனில சொல்லாமை' },       // 20
  { en: 'Dreading Sin',                 ta: 'தீவினையஞ்சல்' },          // 21
  { en: 'Benevolence',                  ta: 'ஒப்புரவறிதல்' },          // 22
  { en: 'Charity',                      ta: 'ஈகை' },                    // 23
  { en: 'Fame',                         ta: 'புகழ்' },                  // 24
  { en: 'Compassion',                   ta: 'அருளுடைமை' },             // 25
  { en: 'Abstaining from Flesh',        ta: 'புலால்மறுத்தல்' },        // 26
  { en: 'Penance',                      ta: 'தவம்' },                   // 27
  { en: 'Hypocrisy',                    ta: 'கூடா ஒழுக்கம்' },         // 28
  { en: 'Not Stealing',                 ta: 'கள்ளாமை' },               // 29
  { en: 'Truthfulness',                 ta: 'வாய்மை' },                // 30
  { en: 'Not Being Angry',              ta: 'வெகுளாமை' },              // 31
  { en: 'Not Doing Evil',               ta: 'இன்னா செய்யாமை' },        // 32
  { en: 'Not Killing',                  ta: 'கொல்லாமை' },              // 33
  { en: 'Impermanence',                 ta: 'நிலையாமை' },              // 34
  { en: 'Renunciation',                 ta: 'துறவு' },                  // 35
  { en: 'Knowing the True',             ta: 'மெய்யுணர்தல்' },          // 36
  { en: 'Freedom from Desire',          ta: 'அவா அறுத்தல்' },          // 37
  { en: 'Fate',                         ta: 'ஊழ்' },                    // 38

  // ── Book 2: Wealth (பொருட்பால்) · Chapters 39–108 ───────────────────────
  { en: 'The Virtuous King',            ta: 'இறைமாட்சி' },             // 39
  { en: 'Education',                    ta: 'கல்வி' },                  // 40
  { en: 'Ignorance',                    ta: 'கல்லாமை' },               // 41
  { en: 'Listening',                    ta: 'கேள்வி' },                 // 42
  { en: 'Wisdom',                       ta: 'அறிவுடைமை' },             // 43
  { en: 'Correcting Faults',            ta: 'குற்றங்கடிதல்' },         // 44
  { en: 'Seeking the Great',            ta: 'பெரியாரைத் துணைக்கோடல்' }, // 45
  { en: 'Avoiding the Mean',            ta: 'சிற்றினஞ் சேராமை' },     // 46
  { en: 'Acting After Deliberation',    ta: 'தெரிந்துசெயல்வகை' },     // 47
  { en: "Knowing One's Strength",       ta: 'வலியறிதல்' },             // 48
  { en: 'Knowing the Right Time',       ta: 'காலமறிதல்' },             // 49
  { en: 'Knowing the Right Place',      ta: 'இடனறிதல்' },              // 50
  { en: 'Selection & Trust',            ta: 'தெரிந்துதெளிதல்' },       // 51
  { en: 'Selection & Employment',       ta: 'தெரிந்துவினையாடல்' },     // 52
  { en: 'Cherishing Kinsmen',           ta: 'சுற்றந்தழால்' },          // 53
  { en: 'Not Forgetting',               ta: 'பொச்சாவாமை' },            // 54
  { en: 'Ruling by Justice',            ta: 'செங்கோன்மை' },            // 55
  { en: 'Cruelty',                      ta: 'கொடுங்கோன்மை' },         // 56
  { en: 'Against Terrorism',            ta: 'வெருவந்தசெய்யாமை' },      // 57
  { en: 'Clemency',                     ta: 'கண்ணோட்டம்' },            // 58
  { en: 'Espionage',                    ta: 'ஒற்றாடல்' },              // 59
  { en: 'Diligence',                    ta: 'மடியின்மை' },             // 60
  { en: 'Enterprise',                   ta: 'ஆள்வினையுடைமை' },        // 61
  { en: 'Tenacity',                     ta: 'இடுக்கண் அழியாமை' },     // 62
  { en: 'Courage',                      ta: 'ஊக்கமுடைமை' },           // 63
  { en: 'Ministers',                    ta: 'அமைச்சு' },               // 64
  { en: 'Eloquence',                    ta: 'சொல்வன்மை' },             // 65
  { en: 'Purity of Action',             ta: 'வினைத்தூய்மை' },          // 66
  { en: 'Firmness in Action',           ta: 'வினைத்திட்பம்' },         // 67
  { en: 'Method in Action',             ta: 'வினைசெயல்வகை' },          // 68
  { en: 'Ambassadors',                  ta: 'தூது' },                   // 69
  { en: 'Conduct Before the King',      ta: 'மன்னரைச் சேர்ந்தொழுகல்' }, // 70
  { en: 'Reading Signs',                ta: 'குறிப்பறிதல்' },           // 71
  { en: 'Knowing the Assembly',         ta: 'அவையறிதல்' },             // 72
  { en: 'Fearlessness in Assembly',     ta: 'அவையஞ்சாமை' },           // 73
  { en: 'The Country',                  ta: 'நாடு' },                   // 74
  { en: 'The Fortress',                 ta: 'அரண்' },                   // 75
  { en: 'Acquiring Wealth',             ta: 'பொருள் செயல் வகை' },      // 76
  { en: 'The Army',                     ta: 'படைச்செருக்கு' },          // 77
  { en: 'Military Valour',              ta: 'படை மாட்சி' },             // 78
  { en: 'Friendship',                   ta: 'நட்பு' },                  // 79
  { en: 'Testing Friendship',           ta: 'நட்பாராய்தல்' },           // 80
  { en: 'Old Friendship',               ta: 'பழைமை' },                  // 81
  { en: 'Evil Friendship',              ta: 'தீ நட்பு' },               // 82
  { en: 'Not Associating with the Base',ta: 'கூடா நட்பு' },            // 83
  { en: 'Folly',                        ta: 'பேதைமை' },                 // 84
  { en: 'Ignorant Men',                 ta: 'புல்லறிவாண்மை' },         // 85
  { en: 'Hostility',                    ta: 'இகல்' },                   // 86
  { en: 'Enmity Within',                ta: 'பகைமாட்சி' },              // 87
  { en: 'Knowing the Enemy',            ta: 'பகைத்திறன் தெரிதல்' },    // 88
  { en: 'Internal Enmity',              ta: 'உட்பகை' },                // 89
  { en: 'Not Offending the Great',      ta: 'பெரியாரைப் பிழையாமை' },  // 90
  { en: 'Being Led by Women',           ta: 'பெண்வழிச் சேறல்' },       // 91
  { en: 'Wanton Women',                 ta: 'வரைவின் மகளிர்' },        // 92
  { en: 'Not Drinking Toddy',           ta: 'கள்ளுண்ணாமை' },           // 93
  { en: 'Gambling',                     ta: 'சூது' },                   // 94
  { en: 'Medicine',                     ta: 'மருந்து' },               // 95
  { en: 'Pedigree',                     ta: 'குலன்' },                  // 96
  { en: 'Manly Effort',                 ta: 'மானம்' },                  // 97
  { en: 'Manliness',                    ta: 'பெருமை' },                // 98
  { en: 'Goodness of Character',        ta: 'சான்றாண்மை' },            // 99
  { en: 'Nobility',                     ta: 'குடிமை' },                // 100
  { en: 'Agriculture',                  ta: 'நல்குரவு' },              // 101
  { en: 'Poverty',                      ta: 'இன்மை' },                 // 102
  { en: 'Seeking Help',                 ta: 'இரவு' },                  // 103
  { en: 'Dread of Begging',             ta: 'இரவச்சம்' },              // 104
  { en: 'Poverty and Pride',            ta: 'கயமை' },                  // 105
  { en: 'Meanness',                     ta: 'நன்றியில் செல்வம்' },     // 106
  { en: 'Not Being Base',               ta: 'படிமையுடைமை' },          // 107
  { en: 'Virtue of Birth',              ta: 'குடிசெயல் வகை' },         // 108

  // ── Book 3: Love (காமத்துப்பால்) · Chapters 109–133 ────────────────────
  { en: 'Being Bewitched by Beauty',    ta: 'தகையணங்குறுத்தல்' },      // 109
  { en: 'Recognition of Signs',        ta: 'குறிப்பறிதல்' },           // 110
  { en: 'Union',                        ta: 'புணர்ச்சி மகிழ்தல்' },    // 111
  { en: 'Praising Her Beauty',          ta: 'நலம் புனைந்துரைத்தல்' },  // 112
  { en: 'Declaring the Heart',          ta: 'காதற் சிறப்புரைத்தல்' },  // 113
  { en: 'Hiding the Heart',             ta: 'நாணுத்துறவுரைத்தல்' },    // 114
  { en: 'The Pleasures of Union',       ta: 'அலரறிவுறுத்தல்' },       // 115
  { en: 'Separation',                   ta: 'பிரிவாற்றாமை' },         // 116
  { en: 'Grieving in Separation',       ta: 'படர்மெலிந்திரங்கல்' },   // 117
  { en: 'Eyes',                         ta: 'கண் விதுப்பழிதல்' },      // 118
  { en: 'Pallor',                       ta: 'பசப்புறு பருவரல்' },      // 119
  { en: 'The Pining Heart',             ta: 'தனிமை இடும்பை' },        // 120
  { en: 'Memories',                     ta: 'நினைந்தவர் புலம்பல்' },   // 121
  { en: 'The Dream',                    ta: 'கனவுநிலை உரைத்தல்' },    // 122
  { en: 'At Dusk',                      ta: 'பொழுதுகண்டிரங்கல்' },    // 123
  { en: 'Soliloquy',                    ta: 'உறுப்புநலன் அழிதல்' },    // 124
  { en: 'Wasting Away',                 ta: 'நெஞ்சொடு கிளத்தல்' },    // 125
  { en: 'Longing',                      ta: 'நிறையழிதல்' },            // 126
  { en: 'Passion',                      ta: 'அவர்வயின் விதும்பல்' },   // 127
  { en: 'Complaint',                    ta: 'குறிப்பறிவுறுத்தல்' },    // 128
  { en: 'Longing for the Lover',        ta: 'புணர்ச்சிவிதும்பல்' },    // 129
  { en: 'Fading Away',                  ta: 'நெஞ்சொடுபுலத்தல்' },     // 130
  { en: 'Complaining',                  ta: 'புலவி' },                  // 131
  { en: 'Reviling',                     ta: 'புலவி நுணுக்கம்' },       // 132
  { en: 'The Joys of Love',             ta: 'ஊடலுவகை' },              // 133
];

export function getChapter(kuralNumber: number): { chapter: number; en: string; ta: string } {
  const chapter = Math.ceil(kuralNumber / 10);
  const info = CHAPTERS[chapter - 1] ?? { en: `Chapter ${chapter}`, ta: `அதிகாரம் ${chapter}` };
  return { chapter, ...info };
}
