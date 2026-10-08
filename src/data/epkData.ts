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
    tagline: "Poesia, Canzone d'Autore & Sound Design Contemporaneo",
    role: "Cantautore & Visionario Sonoro",
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
      "Nato e cresciuto a Pesaro, Alessandro Rocchi si forma fin dall'infanzia ascoltando i grandi maestri del cantautorato italiano — Fabrizio De André, Lucio Dalla, Rino Gaetano e Franco Battiato. Da sempre autore silenzioso di pensieri, appunti intimi e poesie, ha trovato nell'Intelligenza Artificiale il catalizzatore compositivo ideale: una vera liuteria contemporanea capace di dare forma e voce a decenni di parole scritte. I suoi concept album, «Non C'è Vita Su Marte» e «Fette Biscottate e Marmellata», uniscono la forza poetica della parola a sonorità cinematiche e avvolgenti.",
    fullBio: [
      "La storia artistica di Alessandro Rocchi affonda le radici a Pesaro, città di mare, vento e secolare tradizione musicale. Fin da bambino, la sua sensibilità è stata educata dalle voci e dalle visioni dei giganti della canzone d'autore italiana: l'umanità viscerale degli ultimi cantata da Fabrizio De André, la libertà melodica e narrativa di Lucio Dalla, la disillusione tagliente e ironica di Rino Gaetano, e la ricerca mistica tra sacro ed elettronica colta di Franco Battiato.",
      "Da quegli anni d'infanzia e adolescenza, Alessandro non ha mai smesso di scrivere. Ha riempito taccuini e fogli sparsi di poesie, riflessioni notturne, istantanee di vita quotidiana e squarci emotivi, custodendo la parola come un laboratorio segreto e necessario dell'anima.",
      "La svolta arriva con l'intuizione di unire questo patrimonio intimo di testi e poesie con il potenziale espressivo dell'Intelligenza Artificiale, intesa non come surrogato dell'umano, ma come una moderna liuteria digitale e un amplificatore dell'intenzione artistica. Guidata dalla metrica, dalla sensibilità e dalla direzione dell'autore, l'AI diventa la cassa di risonanza che trasforma i versi in arrangiamenti orchestrali, trame analogiche, chitarre sature e atmosfere noir.",
      "Ne scaturiscono due concept album di rara intensità: «Non C'è Vita Su Marte», un'odissea sonora di 10 tracce che indaga l'isolamento contemporaneo attraverso la metafora dello spazio profondo, e «Fette Biscottate e Marmellata», 12 brani dalle tinte noir metropolitane che raccontano la dolcezza amara delle abitudini infrante. Un percorso dove la nobiltà del testo letterario si fa canzone senza tempo."
    ],
    artisticManifesto:
      "«Le parole c'erano già tutte, scritte e custodite per anni nei miei quaderni a Pesaro. L'Intelligenza Artificiale è stata la scintilla che ha dato loro voce e frequenza: non un sostituto dell'anima, ma un amplificatore che permette alla poesia di farsi musica viva.»"
  },
  fastStats: [
    { label: "Origine", value: "Pesaro", subtext: "Città della Musica (PU)" },
    { label: "Album Ufficiali", value: "2", subtext: "22 Brani Inediti" },
    { label: "Radici", value: "Cantautorato", subtext: "De André • Dalla • Gaetano • Battiato" },
    { label: "Composizione", value: "Poesia + AI", subtext: "Liuteria Digitale Creativa" }
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
      subtitle: "Dalla poesia d'autore all'odissea sonora: quando le parole scritte incontrano la frontiera dell'AI.",
      date: "3 Ottobre 2026",
      albumId: "non-ce-vita-su-marte",
      body: [
        "Esce «Non C'è Vita Su Marte», il concept album d'esordio del cantautore e autore pesarese Alessandro Rocchi, disponibile su tutte le piattaforme streaming e in edizione speciale vinile.",
        "Nato dall'incontro tra un'intensa vocazione poetica coltivata fin dall'infanzia — sulle orme di De André, Dalla, Gaetano e Battiato — e la sperimentazione con l'Intelligenza Artificiale come moderno catalizzatore compositivo, il disco si compone di 10 brani legati da una trama emotiva profonda.",
        "Il disco indaga la desolazione interiore, l'incomunicabilità e il bisogno di verità dell'uomo contemporaneo: «Ho cercato di tradurre in musica la sensazione di galleggiare nello spazio profondo, per scoprire che il vuoto più vertiginoso non si trova nell'universo, ma dentro le nostre stanze interiori», spiega l'artista.",
        "L'opera è corredata da video canvas d'autore sincronizzati per ciascun brano, creando un'esperienza multimediale completa per il vinile e per lo schermo."
      ],
      trackByTrack: [
        { title: "01. Rosso Marte", notes: "L'inizio del viaggio: chitarre riverberate e primo contatto con la desolazione." },
        { title: "04. Stanze Vuote", notes: "Ballata intima sull'eco dei ricordi nelle stanze disabitate." },
        { title: "07. Odissea Sonora", notes: "Traccia cardine del disco, un crescendo tra alternative rock e sinfonie sintetiche." },
        { title: "10. Balla la polvere", notes: "Il finale epico: la polvere rossa che danza sulla desolazione con dignità liberatoria." }
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
        "Ancora una volta, i versi nati dalla penna di Rocchi trovano compimento grazie a una direzione artistica raffinata che valorizza l'AI come complice compositivo, restituendo all'ascolto brani dalla forte impronta cinematografica."
      ],
      trackByTrack: [
        { title: "01. Quel salto nel vuoto", notes: "La decisione vertiginosa di cambiare vita e mollare le ancore." },
        { title: "02. Fette Biscottate e Marmellata", notes: "La title track: dolcezza mattutina e malinconia urbana a contrasto." },
        { title: "03. C'è posto qui con me", notes: "Apertura acustica verso l'altro, invito alla condivisione nel freddo." }
      ]
    }
  ],
  quotes: [
    {
      id: "quote-1",
      quote: "Alessandro Rocchi dimostra come la grande tradizione cantautorale italiana possa dialogare con l'Intelligenza Artificiale senza perdere un solo grammo di poesia e umanità.",
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
      quote: "Un autore di Pesaro che custodisce l'eredità di De André e Dalla, portandola nel futuro con un approccio produttivo visionario.",
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
