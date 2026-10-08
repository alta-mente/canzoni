import { resolveAssetUrl } from './albumData';

export interface PressPhoto {
  id: string;
  title: string;
  category: 'Ritratto' | 'Live' | 'Copertina' | 'Artwork';
  resolution: string;
  format: string;
  url: string;
  credits: string;
}

export interface PressRelease {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  albumId: string;
  body: string[];
  trackByTrack?: { title: string; notes: string }[];
}

export interface PressQuote {
  id: string;
  quote: string;
  source: string;
  role: string;
  year: string;
}

export interface LiveSetup {
  format: string;
  description: string;
  lineup: string[];
  duration: string;
}

export interface EPKData {
  artist: {
    name: string;
    alias?: string;
    tagline: string;
    role: string;
    location: string;
    origin: string;
    label: string;
    activeSince: string;
    influences: string[];
    genres: string[];
    shortBio: string;
    fullBio: string[];
    artisticManifesto: string;
  };
  fastStats: {
    label: string;
    value: string;
    subtext: string;
  }[];
  photos: PressPhoto[];
  pressReleases: PressRelease[];
  quotes: PressQuote[];
  liveSetups: LiveSetup[];
  techRiderNotes: string[];
  contacts: {
    email: string;
    managementEmail: string;
    pressEmail: string;
    bookingEmail: string;
    location: string;
    socials: {
      spotify?: string;
      instagram?: string;
      youtube?: string;
      email?: string;
    };
  };
}

export const EPK_DATA: EPKData = {
  artist: {
    name: "ALESSANDRO ROCCHI",
    tagline: "Poesia, Scrittura dei Testi & Canzone d'Autore",
    role: "Autore, Paroliere & Cantautore",
    location: "Pesaro (Marche), Italia",
    origin: "Pesaro, Città Creativa della Musica UNESCO",
    label: "Indipendente",
    activeSince: "2024",
    influences: [
      "Fabrizio De André",
      "Lucio Dalla",
      "Rino Gaetano",
      "Franco Battiato"
    ],
    genres: ["Canzone d'Autore", "Indie Rock", "Italian Noir", "Psichedelia Elettronica", "Lo-Fi"],
    shortBio:
      "Nato e cresciuto a Pesaro, Alessandro Rocchi si forma fin dall'infanzia ascoltando i grandi maestri del cantautorato italiano — Fabrizio De André, Lucio Dalla, Rino Gaetano e Franco Battiato. Da sempre autore attento di pensieri, taccuini intimi e poesie, ha dedicato decenni alla scrittura e alla metrica della parola. I suoi concept album, «Non C'è Vita Su Marte» e «Fette Biscottate e Marmellata», nascono da questo archivio letterario personale: un connubio in cui la forza espressiva del testo, l'introspezione e la cura della parola guidano sonorità avvolgenti e cinematiche.",
    fullBio: [
      "La storia artistica di Alessandro Rocchi affonda le radici a Pesaro, città di mare, vento e secolare tradizione musicale. Fin da bambino, la sua sensibilità è stata educata dalle voci e dalle visioni dei giganti della canzone d'autore italiana: l'umanità viscerale degli ultimi cantata da Fabrizio De André, la libertà melodica e narrativa di Lucio Dalla, la disillusione tagliente e ironica di Rino Gaetano, e la ricerca mistica tra sacro ed elettronica colta di Franco Battiato.",
      "Da quegli anni d'infanzia e adolescenza, Alessandro non ha mai smesso di scrivere. Ha riempito taccuini e fogli sparsi di poesie, riflessioni notturne, istantanee di vita quotidiana e squarci emotivi, custodendo la parola come un laboratorio segreto e necessario dell'anima.",
      "La svolta artistica matura con la decisione di dare voce e forma compiuta a questo patrimonio di testi. Lavorando con rigore sulla metrica, sul peso sillabico e sulla verità emotiva di ogni singolo verso, Alessandro Rocchi plasma un universo sonoro in cui la poesia si fa melodia naturale. Ogni arrangiamento — dalle aperture orchestrali alle chitarre sature, fino alle atmosfere noir — è concepito come un abito sartoriale al servizio esclusivo del racconto poetico.",
      "Ne scaturiscono due concept album di rara intensità: «Non C'è Vita Su Marte», un'odissea sonora di 10 tracce che indaga l'isolamento contemporaneo attraverso la metafora dello spazio profondo, e «Fette Biscottate e Marmellata», 12 brani dalle tinte noir metropolitane che raccontano la dolcezza amara delle abitudini infrante. Un percorso dove la nobiltà del testo letterario si fa canzone senza tempo."
    ],
    artisticManifesto:
      "«Le parole c'erano già tutte, scritte e custodite per decenni nei miei quaderni a Pesaro. La musica è nata per mettersi al loro servizio: quando la metrica di una poesia trova il suo ritmo naturale, il testo smette di essere solo inchiostro e comincia a camminare tra la gente.»"
  },
  fastStats: [
    { label: "Origine", value: "Pesaro", subtext: "Città della Musica (PU)" },
    { label: "Album Ufficiali", value: "2", subtext: "22 Brani Inediti" },
    { label: "Radici", value: "Cantautorato", subtext: "De André • Dalla • Gaetano • Battiato" },
    { label: "Scrittura", value: "Poesia & Testi", subtext: "Metrica e Canzone d'Autore" }
  ],
  photos: [
    {
      id: "photo-cover-mars",
      title: "Cover Ufficiale — Non C'è Vita Su Marte",
      category: "Copertina",
      resolution: "3000 x 3000 px • 300 DPI",
      format: "JPEG / RGB (Print Ready)",
      url: "https://i.scdn.co/image/ab67616d0000b273c0e02085128d6003e58aea55",
      credits: "Artwork: Studio Spaziale 2026"
    },
    {
      id: "photo-cover-fette",
      title: "Cover Ufficiale — Fette Biscottate e Marmellata",
      category: "Copertina",
      resolution: "1024 x 1024 px • 300 DPI",
      format: "JPEG / RGB (Print Ready)",
      url: "/images/albums/fette-biscottate-cover.jpeg",
      credits: "Artwork: Noir Urbano 2026"
    },
    {
      id: "photo-portrait-1",
      title: "Artwork Traccia 1 — Rosso Marte",
      category: "Artwork",
      resolution: "2048 x 2048 px",
      format: "JPEG HD",
      url: "/images/artwork/track-1.jpeg",
      credits: "Alessandro Rocchi Archive"
    },
    {
      id: "photo-portrait-2",
      title: "Artwork Noir — Colazione Notturna",
      category: "Artwork",
      resolution: "2048 x 2048 px",
      format: "JPEG HD",
      url: "/images/artwork-fette/track-2.jpeg",
      credits: "Alessandro Rocchi Archive"
    },
    {
      id: "photo-portrait-3",
      title: "Artwork Traccia 10 — Balla la Polvere",
      category: "Artwork",
      resolution: "2048 x 2048 px",
      format: "JPEG HD",
      url: "/images/artwork/track-10.jpeg",
      credits: "Alessandro Rocchi Archive"
    },
    {
      id: "photo-portrait-4",
      title: "Artwork — C'è posto qui con me",
      category: "Artwork",
      resolution: "2048 x 2048 px",
      format: "JPEG HD",
      url: "/images/artwork-fette/track-3.jpeg",
      credits: "Alessandro Rocchi Archive"
    }
  ],
  pressReleases: [
    {
      id: "pr-mars",
      title: "ALESSANDRO ROCCHI PRESENTA «NON C'È VITA SU MARTE»",
      subtitle: "Dalla poesia d'autore all'odissea sonora: la forza evocativa della parola scritta.",
      date: "3 Ottobre 2026",
      albumId: "non-ce-vita-su-marte",
      body: [
        "Esce «Non C'è Vita Su Marte», il concept album d'esordio del cantautore e autore pesarese Alessandro Rocchi, disponibile su tutte le piattaforme streaming e in edizione speciale vinile.",
        "Nato da un'intensa vocazione poetica coltivata fin dall'infanzia — sulle orme della grande tradizione di De André, Dalla, Gaetano e Battiato —, il disco si compone di 10 brani legati da una trama lirica ed emotiva profonda, dove la scrittura indaga le pieghe della solitudine e della ricerca di senso.",
        "Il disco indaga la desolazione interiore, l'incomunicabilità e il bisogno di verità dell'uomo contemporaneo: «Ho cercato di tradurre in musica la sensazione di galleggiare nello spazio profondo, per scoprire che il vuoto più vertiginoso non si trova nell'universo, ma dentro le nostre stanze interiori», spiega l'artista.",
        "L'opera è corredata da video canvas d'autore sincronizzati per ciascun brano, creando un'esperienza multimediale completa per il vinile e per lo schermo."
      ],
      trackByTrack: [
        { title: "01. Rosso Marte", notes: "«Guardiamo verso il cielo cercando un pianeta abitabile, mentre dimentichiamo di camminare sulla nostra terra.»" },
        { title: "02. Perché sei andata via", notes: "«Le domande senza risposta pesano più del piombo gravitazionale. Un addio che continua a risuonare nel vuoto.»" },
        { title: "03. Silenzio assordante", notes: "«C'è un tipo di silenzio che fa più baccano di cento amplificatori accesi al massimo volume.»" },
        { title: "04. Stanze Vuote", notes: "«Toccare il punto zero è la sola condizione necessaria per ricominciare da capo senza maschere.»" },
        { title: "05. La Tempesta", notes: "«Quando passa la tempesta solare, rimangono solo le cose a cui valeva davvero la pena credere.»" },
        { title: "06. Pace", notes: "«Basta una parola detta al volume giusto per disinnescare l'esplosione e tornare a respirare.»" },
        { title: "07. Odissea Sonora", notes: "«A volte la tragedia è così assurda che l'unica risposta sensata è un sorriso amaro sotto le stelle.»" },
        { title: "08. Manca l'aria", notes: "«Manca l'ossigeno in orbita, ma fa ancora più male non riuscire a respirare nella propria camera.»" },
        { title: "09. Allucinazione", notes: "«I confini tra sogno e veglia si sciolgono quando le luci della città si spengono tutte insieme.»" },
        { title: "10. Balla la polvere", notes: "«E se anche non c'è vita su Marte, lasciamo che la polvere balli con noi per un'ultima volta.»" }
      ]
    },
    {
      id: "pr-fette",
      title: "«FETTE BISCOTTATE E MARMELLATA»: IL NOIR METROPOLITANO DI ALESSANDRO ROCCHI",
      subtitle: "12 tracce di dolcezza amara, ombre urbane e ritmiche notturne.",
      date: "Ottobre 2026",
      albumId: "fette-biscottate-e-marmellata",
      body: [
        "A completamento di una feconda stagione creativa, il cantautore pesarese Alessandro Rocchi pubblica «Fette Biscottate e Marmellata», un'opera che vira verso atmosfere noir e confidenziali.",
        "Il contrasto tra il rito rassicurante della colazione del mattino e l'impatto con la solitudine notturna fa da sfondo a 12 tracce di rara finezza lirica, dove il timbro cantautorale si sposa con rimshot asciutti, trombe jazzate con sordina, campionamenti foley e un calore analogico avvolgente.",
        "Ancora una volta, i versi nati dalla penna di Rocchi trovano compimento in una scrittura intimista e cinematografica, dove ogni parola, rima e silenzio è dosato per restituire un racconto autentico e coinvolgente."
      ],
      trackByTrack: [
        { title: "01. Quel salto nel vuoto", notes: "«Non è la caduta che fa paura, ma il momento esatto in cui decidi di staccare i piedi da terra.»" },
        { title: "02. Fette Biscottate e Marmellata", notes: "«La colazione sul tavolo della cucina, mentre fuori il mondo corre senza voltarsi mai.»" },
        { title: "03. C'è posto qui con me", notes: "«Una sedia tirata vicino al termosifone. Qui non serve spiegare nulla, basta restare.»" },
        { title: "04. Prima delle dodici", notes: "«I minuti prima di mezzanotte valgono il doppio quando sai che domani non ci sarai.»" },
        { title: "05. Tienimi giù", notes: "«Tienimi giù quando il vento prova a sollevare anche i ricordi che volevo seppellire.»" },
        { title: "06. Da questa finestra", notes: "«I palazzi di fronte accendono le finestre uno a uno. Noi guardiamo senza parlare.»" },
        { title: "07. Pavimento di cristallo", notes: "«Attento a dove cammini a piedi nudi in salotto: a volte le parole si rompono sul pavimento.»" },
        { title: "08. Tutto o niente", notes: "«Chiedere tutto è l'unico modo per non accontentarsi di quello che lasciano gli altri.»" },
        { title: "09. Il gelo", notes: "«L'inverno non arriva con la neve, ma quando gli occhi di chi ami non ti riconoscono più.»" },
        { title: "10. Come le madri", notes: "«Quella sul comodino, sul libro aperto, come fanno le madri quando il cuore è incerto.»" },
        { title: "11. Valigie provvisorie", notes: "«Non lasciare valigie disfare qui: siamo ospiti provvisori della nostra stessa nostalgia.»" },
        { title: "12. La curva e l'ora", notes: "«Un lampo d'argento, una curva, un rumore: la vita che inciampa nel giro d'un'ora.»" }
      ]
    }
  ],
  quotes: [
    {
      id: "quote-1",
      quote: "Alessandro Rocchi dimostra come la grande tradizione cantautorale italiana possa rinnovarsi con vigore contemporaneo, mettendo sempre al centro il peso specifico e la nobiltà del testo letterario.",
      source: "Indie Sound Magazine",
      role: "Critica Musicale",
      year: "2026"
    },
    {
      id: "quote-2",
      quote: "Dall'immensità cosmica di Marte all'intimità amara di una tazza di caffè: parole che arrivano da lontano e trovano oggi una veste sonora impeccabile.",
      source: "Canzone & Visioni",
      role: "Editoriale Stampa",
      year: "2026"
    },
    {
      id: "quote-3",
      quote: "Un autore di Pesaro che custodisce l'eredità di De André e Dalla, trasformando la scrittura poetica in canzoni dal respiro universale.",
      source: "Alternative Waves",
      role: "Recensione Album",
      year: "2026"
    }
  ],
  liveSetups: [
    {
      format: "Duo Elettro-Acustico (Club / Teatri / Intimate)",
      description: "Set intimo e suggestivo per club, gallerie e teatri d'autore, focalizzato su voce, chitarre acustiche ed elettriche, loop station e sintetizzatori analogici.",
      lineup: ["Alessandro Rocchi (Voce, Chitarre, Synth, FX)", "Polistrumentista (Basso, Pad, Backing Vocals)"],
      duration: "60 - 75 minuti"
    },
    {
      format: "Full Band (Festival / Club Grandi / Rassegne)",
      description: "Show d'impatto ad alta dinamica con sonorità alternative rock potenti, visual sincronizzati e l'intera riproduzione delle suite dei due album.",
      lineup: [
        "Alessandro Rocchi (Voce solista, Chitarra)",
        "Chitarra solista & Synth",
        "Basso elettrico / Synth bass",
        "Batteria acustica & Trigger pad"
      ],
      duration: "80 - 95 minuti"
    }
  ],
  techRiderNotes: [
    "P.A. adeguato alla capienza della sala con sub-woofer efficienti.",
    "Monitor di palco: 2 o 4 mandate indipendenti (oppure supporto In-Ear Monitor).",
    "Canali mixer: 14 canali (Duo) / 22 canali (Full Band).",
    "Supporto per proiettore / schermo LED per video canvas (opzionale su richiesta)."
  ],
  contacts: {
    email: "arocchi@gmail.com",
    managementEmail: "arocchi@gmail.com",
    pressEmail: "arocchi@gmail.com",
    bookingEmail: "arocchi@gmail.com",
    location: "Pesaro (Marche), Italia",
    socials: {
      spotify: "https://open.spotify.com/artist/4ofkSpzwPAOaANkHl42aMs",
      instagram: "https://instagram.com/alessandrorocchi",
      youtube: "https://youtube.com/@alessandrorocchi",
      email: "arocchi@gmail.com"
    }
  }
};

EPK_DATA.photos = EPK_DATA.photos.map((p) => ({ ...p, url: resolveAssetUrl(p.url) }));
