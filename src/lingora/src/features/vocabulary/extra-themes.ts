// Additional vocabulary themes (added Nov 2026). Irish is intentionally not extended.
// Each theme lists 20 target-language entries in the same order as the English
// meanings below. Write "target=meaning" to override a meaning for one language.

type Example = { text: string; translation?: string; focus: number; review: number };
export type ExtraTheme = { title: string; words: string[][]; examples: Example[] };

const meanings = {
  first: ['yes', 'no', 'please', 'thank you', 'hello', 'goodbye', 'sorry / excuse me', 'help', 'what', 'who',
    'where', 'when', 'why', 'how', 'this', 'here', 'there', 'good', 'bad', 'okay'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'twenty', 'hundred', 'thousand', 'half', 'a lot / many', 'a little / few', 'more', 'less', 'all / everything', 'nothing'],
  family: ['mother', 'father', 'parents', 'brother', 'sister', 'son', 'daughter', 'child', 'grandmother', 'grandfather',
    'husband', 'wife', 'friend (male)', 'friend (female)', 'family', 'man', 'woman', 'boy', 'girl', 'neighbour'],
  food: ['bread', 'cheese', 'milk', 'egg', 'meat', 'fish', 'chicken', 'potato', 'rice', 'vegetables',
    'fruit', 'apple', 'tomato', 'salt', 'sugar', 'butter', 'soup', 'breakfast', 'lunch', 'dinner'],
  travel: ['train', 'bus', 'tram', 'car', 'bicycle', 'plane', 'ticket', 'station', 'airport', 'stop',
    'platform', 'timetable', 'delay', 'suitcase', 'hotel', 'map', 'left', 'right', 'straight on', 'to travel'],
  money: ['money', 'bank', 'account', 'card', 'cash', 'coin', 'banknote', 'price', 'bill / invoice', 'receipt',
    'to pay', 'to save', 'to spend', 'to borrow', 'to lend', 'cheap', 'expensive', 'discount', 'salary', 'debt'],
  emergencies: ['Help!', 'emergency', 'police', 'fire brigade', 'ambulance', 'hospital', 'pharmacy', 'accident', 'fire', 'thief',
    'to steal', 'injured', 'pain', 'danger', 'Watch out!', 'insurance', 'embassy', 'to call', 'lost', 'passport'],
  celebrations: ['party', 'birthday', 'wedding', 'Christmas', 'Easter', 'New Year', 'public holiday', 'present', 'cake', 'candle',
    'guest', 'to invite', 'to celebrate', 'Congratulations!', 'Happy birthday!', 'Cheers!', 'fireworks', 'to dance', 'music', 'tradition'],
  media: ['news', 'newspaper', 'article', 'journalist', 'radio', 'television', 'programme', 'series', 'film', 'advertisement',
    'internet', 'social media', 'headline', 'interview', 'report', 'to publish', 'to watch', 'to listen', 'source', 'opinion'],
  environment: ['environment', 'climate', 'climate change', 'pollution', 'recycling', 'rubbish', 'plastic', 'energy', 'solar power', 'forest',
    'river', 'ocean', 'air', 'to protect', 'to save (energy)', 'sustainable', 'organic', 'public transport', 'heat', 'flood'],
} as const;

type Key = keyof typeof meanings;

const titles: Record<Key, string> = {
  first: 'First words',
  numbers: 'Numbers and quantities',
  family: 'Family and people',
  food: 'Food',
  travel: 'Travel and transport',
  money: 'Money and banking',
  emergencies: 'Emergencies and services',
  celebrations: 'Celebrations and holidays',
  media: 'Media and news',
  environment: 'Environment',
};

function theme(key: Key, targets: string, example: [string, string?]): ExtraTheme {
  const english = meanings[key];
  const words = targets.split(' | ').map((entry, index) => {
    const [target, meaning] = entry.split('=');
    return [target.trim(), (meaning ?? english[index]).trim()];
  });
  const text = example[0].toLowerCase();
  const focus = words.filter(([word]) => text.includes(word.toLowerCase().replace(/^(der|die|das|el|la|los|las|le|les|l’|il|lo|i|gli|the) /, ''))).length;
  return {
    title: titles[key],
    words,
    examples: [{ text: example[0], ...(example[1] ? { translation: example[1] } : {}), focus, review: 0 }],
  };
}

const english = (key: Key, example: string) => theme(key, meanings[key].join(' | '), [example]);

export const extraThemes: Readonly<Partial<Record<string, ExtraTheme[]>>> = {
  en: [
    english('money', 'I paid by card because I had no cash. The price was high, so I asked for a discount and kept the receipt.'),
    english('emergencies', 'There was an accident near the station. Someone called the police and an ambulance took the injured man to hospital.'),
    english('celebrations', 'We celebrated my birthday with a cake, twenty candles and lots of music. Every guest brought a present.'),
    english('media', 'I read the news on the internet every morning, but I always check the source of an article before I share it.'),
    english('environment', 'Our town wants to protect the forest and the river. More people now use public transport and recycling bins.'),
  ],

  de: [
    theme('money', 'das Geld | die Bank | das Konto | die Karte | das Bargeld | die Münze | der Geldschein | der Preis | die Rechnung | die Quittung | bezahlen | sparen | ausgeben | (sich) leihen | verleihen | billig | teuer | der Rabatt | das Gehalt | die Schulden',
      ['Ich habe mit Karte bezahlt, weil ich kein Bargeld hatte. Der Preis war hoch, aber es gab einen Rabatt.', 'I paid by card because I had no cash. The price was high, but there was a discount.']),
    theme('emergencies', 'Hilfe! | der Notfall | die Polizei | die Feuerwehr | der Krankenwagen | das Krankenhaus | die Apotheke | der Unfall | das Feuer | der Dieb | stehlen | verletzt | der Schmerz | die Gefahr | Achtung! | die Versicherung | die Botschaft | anrufen | verloren | der Reisepass',
      ['Nach dem Unfall hat jemand die Polizei angerufen. Der Krankenwagen hat den verletzten Mann ins Krankenhaus gebracht.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'das Fest | der Geburtstag | die Hochzeit | Weihnachten | Ostern | Neujahr | der Feiertag | das Geschenk | der Kuchen | die Kerze | der Gast | einladen | feiern | Herzlichen Glückwunsch! | Alles Gute zum Geburtstag! | Prost! | das Feuerwerk | tanzen | die Musik | die Tradition',
      ['Zum Geburtstag haben wir alle Freunde eingeladen. Es gab Kuchen, Musik und jeder Gast brachte ein Geschenk.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'die Nachrichten | die Zeitung | der Artikel | der Journalist | das Radio | das Fernsehen | die Sendung | die Serie | der Film | die Werbung | das Internet | die sozialen Medien | die Schlagzeile | das Interview | der Bericht | veröffentlichen | schauen | zuhören | die Quelle | die Meinung',
      ['Ich lese die Nachrichten im Internet. Vor dem Teilen prüfe ich immer die Quelle eines Artikels.', 'I read the news on the internet. Before sharing, I always check the source of an article.']),
    theme('environment', 'die Umwelt | das Klima | der Klimawandel | die Verschmutzung | das Recycling | der Müll | das Plastik | die Energie | die Solarenergie | der Wald | der Fluss | das Meer | die Luft | schützen | sparen | nachhaltig | bio | der öffentliche Verkehr | die Hitze | die Überschwemmung',
      ['Unsere Stadt will den Wald und den Fluss schützen. Viele Leute sparen Energie und trennen ihren Müll.', 'Our town wants to protect the forest and the river. Many people save energy and sort their rubbish.']),
  ],

  es: [
    theme('money', 'el dinero | el banco | la cuenta | la tarjeta | el efectivo | la moneda | el billete | el precio | la factura | el recibo | pagar | ahorrar | gastar | pedir prestado | prestar | barato | caro | el descuento | el sueldo | la deuda',
      ['Pagué con tarjeta porque no tenía efectivo. El precio era alto, pero me hicieron un descuento.', 'I paid by card because I had no cash. The price was high, but they gave me a discount.']),
    theme('emergencies', '¡Socorro! | la emergencia | la policía | los bomberos | la ambulancia | el hospital | la farmacia | el accidente | el incendio | el ladrón | robar | herido | el dolor | el peligro | ¡Cuidado! | el seguro | la embajada | llamar | perdido | el pasaporte',
      ['Después del accidente alguien llamó a la policía. La ambulancia llevó al hombre herido al hospital.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'la fiesta | el cumpleaños | la boda | la Navidad | la Pascua | el Año Nuevo | el día festivo | el regalo | la tarta | la vela | el invitado | invitar | celebrar | ¡Enhorabuena! | ¡Feliz cumpleaños! | ¡Salud! | los fuegos artificiales | bailar | la música | la tradición',
      ['Para mi cumpleaños invitamos a todos los amigos. Hubo tarta y música, y cada invitado trajo un regalo.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'las noticias | el periódico | el artículo | el periodista | la radio | la televisión | el programa | la serie | la película | el anuncio | internet | las redes sociales | el titular | la entrevista | el reportaje | publicar | ver | escuchar | la fuente | la opinión',
      ['Leo las noticias en internet. Antes de compartir un artículo, siempre miro la fuente.', 'I read the news on the internet. Before sharing an article, I always look at the source.']),
    theme('environment', 'el medio ambiente | el clima | el cambio climático | la contaminación | el reciclaje | la basura | el plástico | la energía | la energía solar | el bosque | el río | el océano | el aire | proteger | ahorrar | sostenible | ecológico | el transporte público | el calor | la inundación',
      ['Nuestra ciudad quiere proteger el bosque y el río. Mucha gente usa el transporte público y separa la basura.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  fr: [
    theme('money', 'l’argent | la banque | le compte | la carte | les espèces | la pièce | le billet | le prix | la facture | le reçu | payer | économiser | dépenser | emprunter | prêter | bon marché | cher | la réduction | le salaire | la dette',
      ['J’ai payé par carte parce que je n’avais pas d’espèces. Le prix était élevé, mais j’ai eu une réduction.', 'I paid by card because I had no cash. The price was high, but I got a discount.']),
    theme('emergencies', 'Au secours ! | l’urgence | la police | les pompiers | l’ambulance | l’hôpital | la pharmacie | l’accident | l’incendie | le voleur | voler | blessé | la douleur | le danger | Attention ! | l’assurance | l’ambassade | appeler | perdu | le passeport',
      ['Après l’accident, quelqu’un a appelé la police. L’ambulance a emmené l’homme blessé à l’hôpital.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'la fête | l’anniversaire | le mariage | Noël | Pâques | le Nouvel An | le jour férié | le cadeau | le gâteau | la bougie | l’invité | inviter | fêter | Félicitations ! | Joyeux anniversaire ! | Santé ! | le feu d’artifice | danser | la musique | la tradition',
      ['Pour mon anniversaire, nous avons invité tous nos amis. Il y avait un gâteau, de la musique et chaque invité a apporté un cadeau.', 'For my birthday we invited all our friends. There was a cake and music, and every guest brought a present.']),
    theme('media', 'les informations | le journal | l’article | le journaliste | la radio | la télévision | l’émission | la série | le film | la publicité | internet | les réseaux sociaux | le titre | l’interview | le reportage | publier | regarder | écouter | la source | l’opinion',
      ['Je lis les informations sur internet. Avant de partager un article, je vérifie toujours la source.', 'I read the news on the internet. Before sharing an article, I always check the source.']),
    theme('environment', 'l’environnement | le climat | le changement climatique | la pollution | le recyclage | les déchets | le plastique | l’énergie | l’énergie solaire | la forêt | la rivière | l’océan | l’air | protéger | économiser | durable | bio | les transports en commun | la chaleur | l’inondation',
      ['Notre ville veut protéger la forêt et la rivière. Beaucoup de gens prennent les transports en commun et trient leurs déchets.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  it: [
    theme('money', 'i soldi | la banca | il conto | la carta | i contanti | la moneta | la banconota | il prezzo | la fattura | lo scontrino | pagare | risparmiare | spendere | prendere in prestito | prestare | economico | caro | lo sconto | lo stipendio | il debito',
      ['Ho pagato con la carta perché non avevo contanti. Il prezzo era alto, ma mi hanno fatto uno sconto.', 'I paid by card because I had no cash. The price was high, but they gave me a discount.']),
    theme('emergencies', 'Aiuto! | l’emergenza | la polizia | i vigili del fuoco | l’ambulanza | l’ospedale | la farmacia | l’incidente | l’incendio | il ladro | rubare | ferito | il dolore | il pericolo | Attenzione! | l’assicurazione | l’ambasciata | chiamare | perso | il passaporto',
      ['Dopo l’incidente qualcuno ha chiamato la polizia. L’ambulanza ha portato l’uomo ferito in ospedale.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'la festa | il compleanno | il matrimonio | Natale | Pasqua | Capodanno | il giorno festivo | il regalo | la torta | la candela | l’ospite | invitare | festeggiare | Congratulazioni! | Buon compleanno! | Salute! | i fuochi d’artificio | ballare | la musica | la tradizione',
      ['Per il mio compleanno abbiamo invitato tutti gli amici. C’erano la torta e la musica, e ogni ospite ha portato un regalo.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'le notizie | il giornale | l’articolo | il giornalista | la radio | la televisione | il programma | la serie | il film | la pubblicità | internet | i social | il titolo | l’intervista | il servizio | pubblicare | guardare | ascoltare | la fonte | l’opinione',
      ['Leggo le notizie su internet. Prima di condividere un articolo, controllo sempre la fonte.', 'I read the news on the internet. Before sharing an article, I always check the source.']),
    theme('environment', 'l’ambiente | il clima | il cambiamento climatico | l’inquinamento | il riciclaggio | i rifiuti | la plastica | l’energia | l’energia solare | il bosco | il fiume | l’oceano | l’aria | proteggere | risparmiare | sostenibile | biologico | i mezzi pubblici | il caldo | l’alluvione',
      ['La nostra città vuole proteggere il bosco e il fiume. Molte persone usano i mezzi pubblici e fanno la raccolta dei rifiuti.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  ru: [
    theme('money', 'деньги | банк | счёт | карта | наличные | монета | купюра | цена | квитанция | чек | платить | копить | тратить | брать в долг | одалживать | дешёвый | дорогой | скидка | зарплата | долг',
      ['Я заплатил картой, потому что у меня не было наличных. Цена была высокая, но мне дали скидку.', 'I paid by card because I had no cash. The price was high, but they gave me a discount.']),
    theme('emergencies', 'Помогите! | экстренный случай | полиция | пожарные | скорая помощь | больница | аптека | авария | пожар | вор | украсть | раненый | боль | опасность | Осторожно! | страховка | посольство | звонить | потерянный | паспорт',
      ['После аварии кто-то позвонил в полицию. Скорая помощь отвезла раненого мужчину в больницу.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'вечеринка | день рождения | свадьба | Рождество | Пасха | Новый год | праздник | подарок | торт | свеча | гость | приглашать | праздновать | Поздравляю! | С днём рождения! | За здоровье! | салют | танцевать | музыка | традиция',
      ['На день рождения мы пригласили всех друзей. Был торт, музыка, и каждый гость принёс подарок.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'новости | газета | статья | журналист | радио | телевидение | передача | сериал | фильм | реклама | интернет | социальные сети | заголовок | интервью | репортаж | публиковать | смотреть | слушать | источник | мнение',
      ['Я читаю новости в интернете. Прежде чем поделиться статьёй, я всегда проверяю источник.', 'I read the news on the internet. Before sharing an article, I always check the source.']),
    theme('environment', 'окружающая среда | климат | изменение климата | загрязнение | переработка | мусор | пластик | энергия | солнечная энергия | лес | река | океан | воздух | защищать | экономить | устойчивый | экологичный | общественный транспорт | жара | наводнение',
      ['Наш город хочет защищать лес и реку. Многие люди ездят на общественном транспорте и сортируют мусор.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  pl: [
    theme('first', 'tak | nie | proszę | dziękuję | cześć | do widzenia | przepraszam | pomoc | co | kto | gdzie | kiedy | dlaczego | jak | to | tutaj | tam | dobry | zły | dobrze=okay / fine',
      ['Przepraszam, gdzie jest dworzec? – Tam, prosto. – Dziękuję!', 'Excuse me, where is the station? – Over there, straight on. – Thank you!']),
    theme('numbers', 'jeden | dwa | trzy | cztery | pięć | sześć | siedem | osiem | dziewięć | dziesięć | dwadzieścia | sto | tysiąc | pół | dużo | mało | więcej | mniej | wszystko | nic',
      ['Poproszę dwa bilety i pół kilo jabłek. Ile to kosztuje? – Dwadzieścia złotych.', 'Two tickets and half a kilo of apples, please. How much is it? – Twenty zloty.']),
    theme('family', 'matka | ojciec | rodzice | brat | siostra | syn | córka | dziecko | babcia | dziadek | mąż | żona | przyjaciel | przyjaciółka | rodzina | mężczyzna | kobieta | chłopiec | dziewczynka | sąsiad',
      ['Moja rodzina jest duża: mam dwóch braci i siostrę. Babcia i dziadek mieszkają na wsi.', 'My family is big: I have two brothers and a sister. Grandma and grandpa live in the countryside.']),
    theme('food', 'chleb | ser | mleko | jajko | mięso | ryba | kurczak | ziemniak | ryż | warzywa | owoce | jabłko | pomidor | sól | cukier | masło | zupa | śniadanie | obiad | kolacja',
      ['Na śniadanie jem chleb z masłem i serem. Na obiad często jest zupa i kurczak z ziemniakami.', 'For breakfast I eat bread with butter and cheese. For lunch there is often soup and chicken with potatoes.']),
    theme('travel', 'pociąg | autobus | tramwaj | samochód | rower | samolot | bilet | dworzec | lotnisko | przystanek | peron | rozkład jazdy | opóźnienie | walizka | hotel | mapa | w lewo | w prawo | prosto | podróżować',
      ['Pociąg do Krakowa ma opóźnienie. Kupiłem bilet i czekam na peronie z walizką.', 'The train to Kraków is delayed. I bought a ticket and I am waiting on the platform with my suitcase.']),
    theme('money', 'pieniądze | bank | konto | karta | gotówka | moneta | banknot | cena | rachunek | paragon | płacić | oszczędzać | wydawać | pożyczać od kogoś=to borrow | pożyczać komuś=to lend | tani | drogi | zniżka | pensja | dług',
      ['Zapłaciłem kartą, bo nie miałem gotówki. Cena była wysoka, ale dostałem zniżkę.', 'I paid by card because I had no cash. The price was high, but I got a discount.']),
    theme('emergencies', 'Pomocy! | nagły wypadek | policja | straż pożarna | karetka | szpital | apteka | wypadek | pożar | złodziej | ukraść | ranny | ból | niebezpieczeństwo | Uwaga! | ubezpieczenie | ambasada | dzwonić | zgubiony | paszport',
      ['Po wypadku ktoś zadzwonił na policję. Karetka zabrała rannego mężczyznę do szpitala.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'impreza | urodziny | ślub | Boże Narodzenie | Wielkanoc | Nowy Rok | święto | prezent | tort | świeczka | gość | zapraszać | świętować | Gratulacje! | Wszystkiego najlepszego! | Na zdrowie! | fajerwerki | tańczyć | muzyka | tradycja',
      ['Na urodziny zaprosiliśmy wszystkich przyjaciół. Był tort i muzyka, a każdy gość przyniósł prezent.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'wiadomości | gazeta | artykuł | dziennikarz | radio | telewizja | program | serial | film | reklama | internet | media społecznościowe | nagłówek | wywiad | reportaż | publikować | oglądać | słuchać | źródło | opinia',
      ['Czytam wiadomości w internecie. Zanim udostępnię artykuł, zawsze sprawdzam źródło.', 'I read the news on the internet. Before I share an article, I always check the source.']),
    theme('environment', 'środowisko | klimat | zmiana klimatu | zanieczyszczenie | recykling | śmieci | plastik | energia | energia słoneczna | las | rzeka | ocean | powietrze | chronić | oszczędzać | zrównoważony | ekologiczny | transport publiczny | upał | powódź',
      ['Nasze miasto chce chronić las i rzekę. Wiele osób jeździ transportem publicznym i segreguje śmieci.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  gsw: [
    theme('first', 'ja | nei | bitte | merci | grüezi / hoi | uf Wiederluege / tschüss | äxgüsi | Hilf | was | wer | wo | wänn | wieso | wie | das | da | dörte | guet | schlächt | passt=okay / that works',
      ['Äxgüsi, wo isch de Bahnhof? – Dörte, grad us. – Merci vilmal!', 'Excuse me, where is the station? – Over there, straight on. – Thanks a lot!']),
    theme('numbers', 'eis | zwei | drü | vier | föif | sächs | sibe | acht | nüün | zää | zwänzg | hundert | tuusig | halb | vil | wenig | meh | weniger | alles | nüüt',
      ['Ich hett gärn zwei Billett und es halbs Kilo Öpfel. Was choschtet das? – Zwänzg Franke.', 'I’d like two tickets and half a kilo of apples. How much is that? – Twenty francs.']),
    theme('family', 'Mueter | Vatter | Eltere | Brüeder | Schwöschter | Sohn | Tochter | Chind | Grosmami | Grospapi | Ehemaa | Ehefrau | Fründ | Fründin | Familie | Maa | Frau | Bueb | Meitli | Nachber',
      ['Mini Familie isch gross: Ich han zwei Brüedere und e Schwöschter. S Grosmami und de Grospapi wohned uf em Land.', 'My family is big: I have two brothers and a sister. Grandma and grandpa live in the countryside.']),
    theme('food', 'Brot | Chäs | Milch | Ei | Fleisch | Fisch | Poulet | Härdöpfel | Riis | Gmües | Frücht | Öpfel | Tomate | Salz | Zucker | Anke | Suppe | Zmorge | Zmittag | Znacht',
      ['Zum Zmorge iss ich Brot mit Anke und Chäs. Zum Zmittag gits mängisch Suppe und Poulet mit Härdöpfel.', 'For breakfast I eat bread with butter and cheese. For lunch there is sometimes soup and chicken with potatoes.']),
    theme('travel', 'Zug | Bus | Tram | Auto | Velo | Flüüger | Billett | Bahnhof | Flughafe | Haltestell | Perron | Fahrplan | Verspätig | Koffer | Hotel | Charte | links | rächts | grad us | reise',
      ['De Zug uf Bärn hät Verspätig. Ich han es Billett kauft und warte mit em Koffer uf em Perron.', 'The train to Bern is delayed. I bought a ticket and I am waiting on the platform with my suitcase.']),
    theme('money', 'Gäld | Bank | Konto | Charte | Bargäld | Münz | Note | Pris | Rächnig | Quittig | zale | spare | usgää | Portemonnaie=wallet | Bankomat=cash machine | billig | tüür | Rabatt | Lohn | Schulde',
      ['Ich han mit de Charte zahlt, will ich kei Bargäld gha han. De Pris isch höch gsi, aber ich han Rabatt übercho.', 'I paid by card because I had no cash. The price was high, but I got a discount.']),
    theme('emergencies', 'Hilfe! | Notfall | Polizei | Füürwehr | Ambulanz | Spital | Apothek | Unfall | Füür | Dieb | chlaue | verletzt | Schmärze | Gfahr | Pass uf! | Versicherig | Botschaft | aalüüte | verlore | Pass',
      ['Nach em Unfall hät öpper d Polizei aaglüüte. D Ambulanz hät de verletzt Maa is Spital bracht.', 'After the accident someone called the police. The ambulance took the injured man to hospital.']),
    theme('celebrations', 'Fäscht | Geburtstag | Hochziit | Wiehnacht | Oschtere | Neujahr | Fiirtig | Gschänk | Chueche | Cherze | Gascht | iilade | fiire | Gratuliere! | Alles Gueti zum Geburtstag! | Proscht! | Füürwärch | tanze | Musig | Bruuch',
      ['Zum Geburtstag hämmer alli Fründe iiglade. Es hät Chueche und Musig gä, und jede Gascht hät es Gschänk mitbracht.', 'For my birthday we invited all our friends. There was cake and music, and every guest brought a present.']),
    theme('media', 'Nachrichte | Ziitig | Artikel | Journalischt | Radio | Fernseh | Sändig | Serie | Film | Wärbig | Internet | soziali Medie | Schlagziile | Interview | Bricht | publiziere | luege | lose | Quelle | Meinig',
      ['Ich lis d Nachrichte im Internet. Bevor ich en Artikel teile, lueg ich immer d Quelle aa.', 'I read the news on the internet. Before I share an article, I always look at the source.']),
    theme('environment', 'Umwält | Klima | Klimawandel | Verschmutzig | Recycling | Abfall | Plastik | Energie | Solarstrom | Wald | Fluss | Meer | Luft | schütze | spare | nachhaltig | Bio | ÖV | Hitz | Überschwemmig',
      ['Eusi Stadt wott de Wald und de Fluss schütze. Vill Lüüt fahred mit em ÖV und trenned de Abfall.', 'Our town wants to protect the forest and the river. Many people use public transport and sort their rubbish.']),
  ],

  // European Portuguese. The phrase list comes from the LERNWERK Portuguese
  // course (sprachlernapp/course-data-v48.js), translated to English.
  pt: [
    theme('first', 'sim | não | por favor | obrigado=thank you (a woman says obrigada) | olá | adeus | desculpe | a ajuda | o quê | quem | onde | quando | porquê | como | isto | aqui | ali | bom | mau | está bem',
      ['Olá! Desculpe, onde fica a estação? – É ali, à direita. – Obrigado!', 'Hello! Excuse me, where is the station? – It is over there, on the right. – Thank you!']),
    theme('numbers', 'um | dois | três | quatro | cinco | seis | sete | oito | nove | dez | vinte | cem | mil | metade | muito | pouco | mais | menos | tudo | nada',
      ['Tenho vinte anos e o meu irmão tem dez.', 'I am twenty years old and my brother is ten.']),
    theme('family', 'a mãe | o pai | os pais | o irmão | a irmã | o filho | a filha | a criança | a avó | o avô | o marido | a esposa | o amigo | a amiga | a família | o homem | a mulher | o rapaz | a rapariga | o vizinho',
      ['Os meus pais vivem em Berna e a minha irmã vive em Lisboa.', 'My parents live in Bern and my sister lives in Lisbon.']),
    theme('food', 'o pão | o queijo | o leite | o ovo | a carne | o peixe | o frango | a batata | o arroz | os legumes | a fruta | a maçã | o tomate | o sal | o açúcar | a manteiga | a sopa | o pequeno-almoço | o almoço | o jantar',
      ['Ao pequeno-almoço como pão com manteiga e bebo leite.', 'For breakfast I eat bread and butter and drink milk.']),
    theme('travel', 'o comboio | o autocarro | o elétrico | o carro | a bicicleta | o avião | o bilhete | a estação | o aeroporto | a paragem | a plataforma | o horário | o atraso | a mala | o hotel | o mapa | à esquerda | à direita | sempre em frente | viajar',
      ['O comboio para Lisboa parte da plataforma quatro, mas tem um atraso de dez minutos.', 'The train to Lisbon leaves from platform four, but it is ten minutes late.']),
    {
      title: 'Everyday phrases',
      words: [
        ['Olá!', 'Hello!'], ['Bom dia.', 'Good morning.'], ['Como estás?', 'How are you?'], ['Até logo!', 'See you later!'],
        ['Chamo-me Anna.', 'My name is Anna.'], ['Sou da Suíça.', 'I am from Switzerland.'], ['Como te chamas?', 'What is your name?'], ['De onde és?', 'Where are you from?'],
        ['Tenho vinte anos.', 'I am twenty years old.'], ['Quantos anos tens?', 'How old are you?'], ['Custa dez francos.', 'It costs ten francs.'], ['O meu número é doze.', 'My number is twelve.'],
        ['Esta é a minha irmã.', 'This is my sister.'], ['Tenho um irmão.', 'I have a brother.'], ['Os meus pais vivem em Berna.', 'My parents live in Bern.'], ['Tens filhos?', 'Do you have children?'],
        ['Trabalho hoje.', 'I am working today.'], ['De manhã bebo café.', 'In the morning I drink coffee.'], ['A que horas te levantas?', 'What time do you get up?'], ['À noite estudo português.', 'In the evening I study Portuguese.'],
        ['Queria um café, por favor.', 'I would like a coffee, please.'], ['A conta, por favor.', 'The bill, please.'], ['O que recomenda?', 'What do you recommend?'], ['Não como carne.', 'I do not eat meat.'],
        ['Onde fica a estação?', 'Where is the station?'], ['Vou de comboio.', 'I am going by train.'], ['Siga sempre em frente.', 'Go straight on.'], ['Quando parte o próximo elétrico?', 'When does the next tram leave?'],
        ['Quanto custa isto?', 'How much is this?'], ['Procuro um casaco preto.', 'I am looking for a black jacket.'], ['Tem isto no tamanho M?', 'Do you have this in size M?'], ['Levo este.', 'I will take this one.'],
        ['Que horas são?', 'What time is it?'], ['Encontramo-nos às três.', 'Let us meet at three.'], ['Sexta-feira dá-te jeito?', 'Does Friday suit you?'], ['Tenho uma consulta amanhã.', 'I have an appointment tomorrow.'],
        ['Tenho uma reserva.', 'I have a reservation.'], ['Pode ajudar-me?', 'Can you help me?'], ['Queria ir a Zurique amanhã.', 'I would like to go to Zurich tomorrow.'], ['Onde posso comprar um bilhete?', 'Where can I buy a ticket?'],
      ],
      examples: [],
    },
  ],
  // Indonesian: the order matches the units, so each word station fits its unit.
  id: [
    theme('first', 'ya | tidak | tolong=please (asking for something) | terima kasih | halo | sampai jumpa | maaf | bantuan | apa | siapa | di mana | kapan | kenapa | bagaimana | ini | di sini | di sana | baik | buruk | oke',
      ['Halo! Maaf, toilet di mana? – Di sana, di kanan. – Terima kasih!', 'Hello! Sorry, where is the toilet? – Over there, on the right. – Thank you!']),
    theme('numbers', 'satu | dua | tiga | empat | lima | enam | tujuh | delapan | sembilan | sepuluh | dua puluh | seratus | seribu | setengah | banyak | sedikit | lebih | kurang | semua | tidak ada=nothing / there is none',
      ['Satu kelapa muda harganya dua puluh ribu.', 'One young coconut costs twenty thousand.']),
    theme('travel', 'kereta | bus | trem | mobil | sepeda | pesawat | tiket | stasiun | bandara | halte | peron | jadwal | keterlambatan | koper | hotel | peta | kiri | kanan | lurus | bepergian',
      ['Pesawat saya ke Jakarta terlambat satu jam.', 'My flight to Jakarta is one hour late.']),
    {
      title: 'Digital nomad life',
      words: [
        ['coworking', 'coworking space'], ['wifi', 'wifi'], ['colokan', 'power socket'], ['laptop', 'laptop'], ['rapat online', 'online meeting'],
        ['kerja jarak jauh', 'remote work'], ['klien', 'client'], ['tenggat waktu', 'deadline'], ['sinyal', 'phone signal'], ['mati lampu', 'power cut'],
        ['sewa', 'rent'], ['kos', 'simple rented room'], ['motor', 'scooter'], ['helm', 'helmet'], ['bensin', 'petrol'],
        ['pantai', 'beach'], ['ombak', 'wave'], ['selancar', 'surfing'], ['sawah', 'rice field'], ['matahari terbenam', 'sunset'],
      ],
      examples: [{ text: 'Wifi di coworking ini cepat, tapi saat mati lampu saya kerja dari kafe dekat pantai.', translation: 'The wifi at this coworking space is fast, but during a power cut I work from a café near the beach.', focus: 4, review: 0 }],
    },
    theme('food', 'roti | keju | susu | telur | daging | ikan | ayam | kentang | nasi | sayur | buah | apel | tomat | garam | gula | mentega | sup | sarapan | makan siang | makan malam',
      ['Untuk sarapan saya makan nasi goreng dengan telur.', 'For breakfast I eat fried rice with an egg.']),
    {
      title: 'Bali culture',
      words: [
        ['pura', 'Hindu temple'], ['upacara', 'ceremony'], ['canang sari', 'daily offering of flowers'], ['sesajen', 'offering'], ['sarung', 'sarong'],
        ['selendang', 'temple sash'], ['banjar', 'village community'], ['Nyepi', 'Day of Silence'], ['ogoh-ogoh', 'giant demon statues'], ['gamelan', 'traditional orchestra'],
        ['tari kecak', 'kecak fire dance'], ['Om Swastiastu', 'Balinese greeting'], ['suksma', 'thank you (Balinese)'], ['desa', 'village'], ['adat', 'custom, tradition'],
        ['sopan', 'polite, decent'], ['berdoa', 'to pray'], ['dupa', 'incense'], ['kelapa muda', 'young coconut'], ['babi guling', 'Balinese roast pork'],
      ],
      examples: [{ text: 'Di depan rumah ada canang sari setiap pagi. Kalau masuk pura, pakai sarung dan selendang.', translation: 'There is a canang sari in front of the house every morning. When you enter a temple, wear a sarong and a sash.', focus: 4, review: 0 }],
    },
    theme('family', 'ibu | ayah | orang tua | kakak laki-laki=older brother | adik=younger brother or sister | anak laki-laki=son | anak perempuan=daughter | anak | nenek | kakek | suami | istri | teman=friend | sahabat=close friend | keluarga | laki-laki=man | perempuan=woman | cowok=boy / guy (casual) | cewek=girl (casual) | tetangga',
      ['Keluarga Pak Wayan tinggal di sebelah. Anaknya dua.', 'Pak Wayan’s family lives next door. He has two children.']),
    theme('money', 'uang | bank | rekening | kartu | uang tunai | koin | uang kertas | harga | tagihan | struk | membayar | menabung | menghabiskan | meminjam | meminjamkan | murah | mahal | diskon | gaji | utang',
      ['Di warung saya bayar pakai uang tunai, di kafe pakai kartu.', 'At the warung I pay cash, at the café by card.']),
    theme('emergencies', 'Tolong! | darurat | polisi | pemadam kebakaran | ambulans | rumah sakit | apotek | kecelakaan | kebakaran | pencuri | mencuri | terluka | sakit=pain / ill | bahaya | Awas! | asuransi | kedutaan | menelepon | hilang | paspor',
      ['Ada kecelakaan motor. Tolong telepon ambulans!', 'There was a scooter accident. Please call an ambulance!']),
    theme('celebrations', 'pesta | ulang tahun | pernikahan | Natal | Paskah | Tahun Baru | hari libur | hadiah | kue | lilin | tamu | mengundang | merayakan | Selamat! | Selamat ulang tahun! | Bersulang! | kembang api | menari | musik | tradisi',
      ['Kami merayakan ulang tahun Lisa di pantai dengan kue dan musik.', 'We celebrated Lisa’s birthday on the beach with cake and music.']),
    theme('environment', 'lingkungan | iklim | perubahan iklim | polusi | daur ulang | sampah | plastik | energi | tenaga surya | hutan | sungai | laut | udara | melindungi | menghemat | berkelanjutan | organik | transportasi umum | panas | banjir',
      ['Banyak sampah plastik di pantai setelah hujan.', 'There is a lot of plastic rubbish on the beach after the rain.']),
  ],
};
