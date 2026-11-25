import type { Lesson } from '../catalog';

// Lesson 0 of every course: the alphabet with a pronunciation hint and an
// example word per letter. Rows are "letter|sound|example|meaning".
// The lesson screen shows them as tappable tiles that read the letter and
// the example aloud. Ids (<course>-start0) are registered in
// supabase/migrations/*_alphabet_lessons.sql.

type AlphabetSpec = {
  name: string;
  intro: string;
  structure: string;
  tip: string;
  rows: string;
  /** Letters with a special sound (kept for reference and future exercises). */
  special: [string, string, string, string];
};

export type AlphabetLetter = { letter: string; sound: string; example: string; meaning?: string };

const specs: Record<string, AlphabetSpec> = {
  de: {
    name: 'German',
    intro: 'German has the 26 letters you know plus ä, ö, ü and ß. Most letters always sound the same, so you can read words the way they are written.',
    structure: 'ä ö ü = umlauts | ß = sharp s | w = v | z = ts | v = f',
    tip: 'Letter groups matter too: ei = "eye", ie = "ee", sch = "sh", ch = soft throaty h.',
    special: ['w', 'z', 'ü', 'ß'],
    rows: `a|a as in "father"|Apfel|apple
ä|e as in "bed"|Äpfel|apples
b|b|Ball|ball
c|ts or k|Café|café
d|d|Dach|roof
e|ay as in "say"|Esel|donkey
f|f|Fisch|fish
g|g as in "go"|Garten|garden
h|h|Haus|house
i|ee as in "see"|Igel|hedgehog
j|y as in "yes"|Jahr|year
k|k|Katze|cat
l|l|Löwe|lion
m|m|Mond|moon
n|n|Nase|nose
o|o as in "more"|Ofen|oven
ö|"er" with rounded lips|Öl|oil
p|p|Pferd|horse
q|kv (always qu)|Qualle|jellyfish
r|throaty r|Rad|wheel
s|z at the start, s at the end|Sonne|sun
ß|sharp ss|Straße|street
t|t|Tisch|table
u|oo as in "moon"|Uhr|clock
ü|"ee" with rounded lips|Tür|door
v|f (mostly)|Vogel|bird
w|v|Wasser|water
x|ks|Xylofon|xylophone
y|like ü|Typ|guy
z|ts|Zebra|zebra`,
  },
  gsw: {
    name: 'Zurich German',
    intro: 'Zurich German uses the German alphabet, but many words sound different from Standard German. The throaty ch is everywhere, and k is often said with a little "kch".',
    structure: 'ch = throaty kh (Chuchi) | k = kch | ä = open, like "cat" | ie, ue, üe = two sounds',
    tip: 'Swiss German has no fixed spelling: people write it the way they speak, so spellings can vary.',
    special: ['ch', 'k', 'ä', 'w'],
    rows: `a|a as in "father"|Aabig|evening
ä|open ä as in "cat"|Ärbet|work
b|soft b|Bueb|boy
c|only in foreign words|Café|café
ch|throaty kh as in "loch"|Chuchi|kitchen
d|soft d|Dorf|village
e|e as in "bed"|Esel|donkey
f|f|Fründ|friend
g|soft g|Gschänk|present
h|h|Huus|house
i|ee|Iis|ice
j|y as in "yes"|Jahr|year
k|kch (throaty)|Kafi|coffee
l|l|Liecht|light
m|m|Muetter|mother
n|n|Nase|nose
o|o as in "more"|Ofe|oven
ö|"er" with rounded lips|Öpfel|apple
p|p|Poscht|post office
q|kw (always qu)|Quartier|neighbourhood
r|rolled or throaty r|Rad|wheel
s|s (sch before t, p)|Sunne|sun
t|t|Tisch|table
u|oo as in "moon"|Uhr|clock
ü|"ee" with rounded lips|Tüür|door
v|f|Vogel|bird
w|v|Wasser|water
x|ks|Xylofon|xylophone
y|like i|Typ|guy
z|ts|Zmorge|breakfast`,
  },
  en: {
    name: 'English',
    intro: 'English has 26 letters. Each letter has a name (A = "ay", B = "bee") that you need for spelling words, for example your name or email address.',
    structure: 'Vowels: a e i o u | Letter names: A "ay" · E "ee" · I "eye" · J "jay" · R "ar" · W "double-u"',
    tip: 'Practise spelling your name out loud: "L-I-S-A". You will need it on the phone and at hotels.',
    special: ['e', 'i', 'w', 'h'],
    rows: `a|name "ay"|apple
b|name "bee"|ball
c|name "see"|cat
d|name "dee"|dog
e|name "ee"|egg
f|name "ef"|fish
g|name "jee"|garden
h|name "aitch"|house
i|name "eye"|island
j|name "jay"|juice
k|name "kay"|key
l|name "el"|lemon
m|name "em"|moon
n|name "en"|nose
o|name "oh"|orange
p|name "pee"|pen
q|name "kyoo"|queen
r|name "ar"|rain
s|name "es"|sun
t|name "tee"|table
u|name "yoo"|umbrella
v|name "vee"|voice
w|name "double-u"|water
x|name "eks"|box
y|name "why"|yellow
z|name "zed" (UK) / "zee" (US)|zebra`,
  },
  es: {
    name: 'Spanish',
    intro: 'Spanish has 27 letters: the 26 you know plus ñ. Spanish is read exactly as it is written, and the five vowels always sound short and clear.',
    structure: 'h = silent | j = strong h | ñ = ny | ll = y | v = like b',
    tip: 'Accents (á, é, í, ó, ú) do not change the letter, they only show which syllable is stressed.',
    special: ['h', 'j', 'ñ', 'z'],
    rows: `a|a as in "father"|agua|water
b|b|bueno|good
c|k, or th/s before e, i|casa|house
d|soft d|dedo|finger
e|e as in "bed"|elefante|elephant
f|f|fuego|fire
g|g, or strong h before e, i|gato|cat
h|silent|hola|hello
i|ee|isla|island
j|strong h|jamón|ham
k|k|kilo|kilo
l|l|luna|moon
m|m|mano|hand
n|n|noche|night
ñ|ny as in "canyon"|niño|child
o|o as in "more"|ojo|eye
p|p|perro|dog
q|k (always que, qui)|queso|cheese
r|tapped r (rr is rolled)|pero|but
s|s|sol|sun
t|t|tomate|tomato
u|oo|uva|grape
v|like b|vaca|cow
w|w|wifi|wifi
x|ks|taxi|taxi
y|y as in "yes"|yo|I
z|th (Spain) or s (Latin America)|zapato|shoe`,
  },
  fr: {
    name: 'French',
    intro: 'French has 26 letters plus accents and ç. Many letters at the end of a word are silent, and some vowels sound very different from English.',
    structure: 'h = silent | j = zh | u = "ee" with rounded lips | ç = s | é = ay · è = eh',
    tip: 'Final consonants are usually silent: petit sounds like "puh-tee". Remember the word CaReFuL: c, r, f and l at the end are often pronounced.',
    special: ['h', 'j', 'u', 'ç'],
    rows: `a|a as in "father"|ami|friend
b|b|bébé|baby
c|k, or s before e, i|café|coffee
ç|s|garçon|boy
d|d|dent|tooth
e|uh (é = ay, è = eh)|été|summer
f|f|feu|fire
g|g, or zh before e, i|gâteau|cake
h|silent|hôtel|hotel
i|ee|île|island
j|zh as in "measure"|jour|day
k|k|kilo|kilo
l|l|lune|moon
m|m|mer|sea
n|n|nuit|night
o|o|orange|orange
p|p|pain|bread
q|k (qu)|quatre|four
r|throaty r|rouge|red
s|s (z between vowels)|soleil|sun
t|t|table|table
u|"ee" with rounded lips|rue|street
v|v|vin|wine
w|v or w|wagon|carriage
x|ks|taxi|taxi
y|ee|yeux|eyes
z|z|zéro|zero`,
  },
  it: {
    name: 'Italian',
    intro: 'The Italian alphabet has 21 letters. J, K, W, X and Y only appear in foreign words. Italian is read the way it is written, and every vowel is pronounced.',
    structure: 'c / g before e, i = ch / j | ch / gh = k / g | h = silent | z = ts or dz',
    tip: 'Double consonants are held longer: pala (shovel) vs. palla (ball).',
    special: ['c', 'h', 'z', 'r'],
    rows: `a|a as in "father"|amico|friend
b|b|bello|beautiful
c|k, or ch before e, i|casa|house
d|d|dente|tooth
e|e as in "bed"|erba|grass
f|f|fiore|flower
g|g, or j before e, i|gelato|ice cream
h|silent (makes c and g hard)|hotel|hotel
i|ee|isola|island
l|l|luna|moon
m|m|mare|sea
n|n|notte|night
o|o|occhio|eye
p|p|pane|bread
q|k (always qu)|quattro|four
r|rolled r|rosso|red
s|s or z|sole|sun
t|t|tavola|table
u|oo|uva|grape
v|v|vino|wine
z|ts or dz|zucchero|sugar`,
  },
  pt: {
    name: 'Portuguese',
    intro: 'Portuguese has 26 letters plus ç and vowels with accents. The tilde (ã, õ) makes a vowel nasal, as if you speak through your nose.',
    structure: 'ã / õ = nasal | ç = s | lh = ly | nh = ny | j = zh | s at the end = sh',
    tip: 'In European Portuguese unstressed vowels are often very short or almost silent.',
    special: ['ã', 'ç', 'j', 'x'],
    rows: `a|a as in "father"|água|water
ã|nasal a|irmã|sister
b|b|bola|ball
c|k, or s before e, i|casa|house
ç|s|coração|heart
d|d|dia|day
e|eh, or almost silent at the end|escola|school
f|f|flor|flower
g|g, or zh before e, i|gato|cat
h|silent|hoje|today
i|ee|ilha|island
j|zh as in "measure"|janela|window
k|k|kiwi|kiwi
l|l|lua|moon
m|m (nasal at the end)|mãe|mother
n|n|noite|night
o|o, or oo at the end|olho|eye
p|p|pão|bread
q|k (qu)|queijo|cheese
r|tapped r, throaty at the start|rua|street
s|s, z between vowels, sh at the end|sol|sun
t|t|tempo|time
u|oo|uva|grape
v|v|vinho|wine
w|w|web|web
x|sh (often)|xícara|cup
y|ee|yoga|yoga
z|z|zero|zero`,
  },
  ru: {
    name: 'Russian',
    intro: 'Russian uses the Cyrillic alphabet with 33 letters. Some look like Latin letters but sound different (Р = r, Н = n, В = v, С = s). Once you know them, Russian is read almost as it is written.',
    structure: 'Look-alikes: В = v · Н = n · Р = r · С = s · У = oo · Х = kh | ъ ь have no sound of their own',
    tip: 'Unstressed о sounds like a: молоко (milk) is said "ma-la-KO".',
    special: ['в', 'р', 'ы', 'х'],
    rows: `а|a as in "father"|арбуз|watermelon
б|b|банк|bank
в|v|вода|water
г|g as in "go"|город|city
д|d|дом|house
е|ye as in "yes"|еда|food
ё|yo as in "yogurt"|ёлка|fir tree
ж|zh as in "measure"|жук|beetle
з|z|зима|winter
и|ee|игра|game
й|short y as in "boy"|йогурт|yogurt
к|k|кот|cat
л|l|лампа|lamp
м|m|мама|mum
н|n|нос|nose
о|o (stressed), a (unstressed)|окно|window
п|p|папа|dad
р|rolled r|рыба|fish
с|s|сок|juice
т|t|торт|cake
у|oo|утро|morning
ф|f|фото|photo
х|kh as in Scottish "loch"|хлеб|bread
ц|ts|цирк|circus
ч|ch as in "chair"|чай|tea
ш|sh|школа|school
щ|soft, long shch|щука|pike
ъ|hard sign (no sound)|подъезд|entrance
ы|deep "i", tongue pulled back|сыр|cheese
ь|soft sign: softens the letter before|соль|salt
э|e as in "bed"|это|this
ю|yu as in "you"|юг|south
я|ya as in "yard"|яблоко|apple`,
  },
  pl: {
    name: 'Polish',
    intro: 'Polish has 32 letters. The extra ones (ą, ć, ę, ł, ń, ó, ś, ź, ż) have their own sounds. Polish is read the way it is written, and the stress is almost always on the second-to-last syllable.',
    structure: 'ł = w | w = v | ą ę = nasal | c = ts | ó = u | sz = sh · cz = ch · rz = ż',
    tip: 'Letter pairs: sz (sh), cz (ch), rz (zh), ch (kh) and dz, dż, dź count as one sound.',
    special: ['ł', 'w', 'c', 'ą'],
    rows: `a|a as in "father"|auto|car
ą|nasal "on"|są|(they) are
b|b|brat|brother
c|ts|córka|daughter
ć|soft ch|ćma|moth
d|d|dom|house
e|e as in "bed"|ekran|screen
ę|nasal "en"|ręka|hand
f|f|foka|seal
g|g as in "go"|góra|mountain
h|h, like a soft kh|herbata|tea
i|ee|igła|needle
j|y as in "yes"|jabłko|apple
k|k|kot|cat
l|l|lato|summer
ł|w as in "water"|łódź|boat
m|m|mama|mum
n|n|noc|night
ń|ny as in "canyon"|koń|horse
o|o|okno|window
ó|oo (same as u)|ogród|garden
p|p|pies|dog
r|rolled r|ryba|fish
s|s|sok|juice
ś|soft sh|śnieg|snow
t|t|tata|dad
u|oo|ucho|ear
w|v|woda|water
y|deep "i" as in "bit"|my|we
z|z|zupa|soup
ź|soft zh|źle|badly
ż|zh as in "measure"|żaba|frog`,
  },
  sh: {
    name: 'Croatian',
    intro: 'Croatian has 30 letters, one for every sound. Read every letter as written – there are no silent letters.',
    structure: 'c = ts | č / ć = hard / soft ch | dž / đ = hard / soft j | lj = ly | nj = ny | š = sh | ž = zh',
    tip: 'dž, lj and nj are single letters: konj (horse) has 3 letters: k-o-nj.',
    special: ['c', 'č', 'ć', 'š'],
    rows: `a|a as in "father"|auto|car
b|b|brat|brother
c|ts|cvijet|flower
č|hard ch as in "church"|čaj|tea
ć|soft ch|kuća|house
d|d|dan|day
dž|hard j as in "jungle"|džep|pocket
đ|soft j|đak|pupil
e|e as in "bed"|evo|here is
f|f|film|film
g|g as in "go"|grad|city
h|kh as in "loch"|hvala|thanks
i|ee|ime|name
j|y as in "yes"|jabuka|apple
k|k|kava|coffee
l|l|lipa|linden tree
lj|ly as in "million"|ljubav|love
m|m|more|sea
n|n|noć|night
nj|ny as in "canyon"|konj|horse
o|o|oko|eye
p|p|pas|dog
r|rolled r|riba|fish
s|s|sir|cheese
š|sh|škola|school
t|t|tata|dad
u|oo|uho|ear
v|v|voda|water
z|z|zima|winter
ž|zh as in "measure"|žena|woman`,
  },
  id: {
    name: 'Indonesian',
    intro: 'Indonesian uses the Latin alphabet with 26 letters and is read exactly as it is written. Two letter pairs, ng and ny, count as single sounds. There are no accents and no silent letters.',
    structure: 'c = ch | j = j as in “jam” | e = “uh” or “e” | ng = as in “sing” | ny = ny as in “canyon” | r = rolled',
    tip: 'Letters like f, q, v, x and z appear mostly in loanwords: foto, visa, zaman.',
    special: ['c', 'e', 'ng', 'ny'],
    rows: `a|a as in "father"|apa|what
b|b|baik|good
c|ch as in "chat"|cari|to look for
d|d|dua|two
e|"uh" or "e" as in "bed"|enam|six
f|f (in loanwords)|foto|photo
g|g as in "go"|gula|sugar
h|h (soft at the end)|hari|day
i|ee|ikan|fish
j|j as in "jam"|jalan|street
k|k (at the end: a short stop)|kopi|coffee
l|l|lima|five
m|m|makan|to eat
n|n|nasi|rice
o|o as in "more"|orang|person
p|p (no puff of air)|pantai|beach
q|k (only in names)|Qatar|Qatar
r|rolled r|rumah|house
s|s|satu|one
t|t (soft)|tiga|three
u|oo|uang|money
v|f (mostly)|visa|visa
w|w|warung|small local eatery
x|ks (rare)|xilofon|xylophone
y|y as in "yes"|saya|I
z|z|zaman|era
ng|ng as in "sing"|ngopi|to have a coffee
ny|ny as in "canyon"|nyaman|comfortable`,
  },
  ga: {
    name: 'Irish',
    intro: 'The traditional Irish alphabet has 18 letters (no j, k, q, v, w, x, y, z except in loanwords). A long-mark called the fada (á, é, í, ó, ú) makes a vowel long.',
    structure: 'á é í ó ú = long vowels | s before e, i = sh | bh / mh = v or w | c = always k',
    tip: 'Consonants are "broad" next to a, o, u and "slender" (softer) next to e, i – that changes how they sound.',
    special: ['á', 'c', 'é', 'í'],
    rows: `a|a as in "cat"|arán|bread
á|aw as in "law"|lá|day
b|b|bó|cow
c|k (always hard)|cat|cat
d|d (softer before e, i)|doras|door
e|e as in "bed"|eala|swan
é|ay as in "day"|mé|me
f|f|fear|man
g|g as in "go"|gort|field
h|h (mostly after other letters)|hata|hat
i|i as in "bit"|im|butter
í|ee|sí|she
l|l|leabhar|book
m|m|madra|dog
n|n|nead|nest
o|o as in "hot"|oíche|night
ó|o as in "go"|ól|drink
p|p|póg|kiss
r|r|rón|seal
s|s, or sh before e, i|salann|salt
t|t|teach|house
u|u as in "put"|uisce|water
ú|oo|cú|hound`,
  },
};

function parseRows(rows: string): AlphabetLetter[] {
  return rows.split('\n').map((line) => {
    const [letter, sound, example, meaning] = line.split('|');
    return { letter, sound, example, meaning: meaning || undefined };
  });
}

/** "dž" → "Dž dž", "a" → "A a". */
export function letterPair(letter: string) {
  return `${letter[0].toLocaleUpperCase()}${letter.slice(1)} ${letter}`;
}

function alphabetLesson(courseId: string, spec: AlphabetSpec): Lesson & { alphabet: AlphabetLetter[] } {
  const letters = parseRows(spec.rows);
  return {
    id: `${courseId}-start0`,
    title: `The ${spec.name} alphabet`,
    rule: spec.intro,
    structure: spec.structure,
    examples: [],
    tip: spec.tip,
    alphabet: letters,
    // Reading only: learners look and listen, then continue to the next lesson.
    ex: [],
  };
}

export const alphabetLessons: Readonly<Record<string, Lesson>> = Object.fromEntries(
  Object.entries(specs).map(([courseId, spec]) => [courseId, alphabetLesson(courseId, spec)]),
);
