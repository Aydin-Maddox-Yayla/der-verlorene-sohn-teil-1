
import { Language, StoryBeat } from './types';

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 1,
    text: {
      [Language.DE]: "2008. Die Sonne ging unter. Mein Sohn war weg. Spurlos.",
      [Language.EN]: "2008. The sun was setting. My son was gone. Without a trace."
    },
    triggerPos: { x: 400, y: -200 }
  },
  {
    id: 2,
    text: {
      [Language.DE]: "Die Polizei suchte eine Woche. Dann gaben sie auf. Ich nicht.",
      [Language.EN]: "The police searched for a week. Then they gave up. I didn't."
    },
    triggerPos: { x: -600, y: 800 }
  },
  {
    id: 3,
    text: {
      [Language.DE]: "Ich fand seinen Schuh bei der alten Eiche. Er war zerrissen.",
      [Language.EN]: "I found his shoe by the old oak. It was torn apart."
    },
    triggerPos: { x: 1000, y: 1200 },
    evidenceKey: "SCHUH"
  },
  {
    id: 4,
    text: {
      [Language.DE]: "Winter 2008. Die Kälte biss, aber die Hoffnung brannte noch.",
      [Language.EN]: "Winter 2008. The cold bit, but hope was still burning."
    },
    triggerPos: { x: -1200, y: -400 }
  },
  {
    id: 5,
    text: {
      [Language.DE]: "2009. Ich hörte sein Lachen im Wind. Oder war es die Einbildung?",
      [Language.EN]: "2009. I heard his laughter in the wind. Or was it my imagination?"
    },
    triggerPos: { x: 1800, y: 600 }
  },
  {
    id: 6,
    text: {
      [Language.DE]: "Merkwürdige Symbole an den Bäumen. Das war kein Tier.",
      [Language.EN]: "Strange symbols on the trees. That was no animal."
    },
    triggerPos: { x: -300, y: 2000 },
    evidenceKey: "SYMBOLE"
  },
  {
    id: 7,
    text: {
      [Language.DE]: "Ich lebe seit Monaten im Wald. Die Zivilisation ist weit weg.",
      [Language.EN]: "I've been living in the woods for months. Civilization is far away."
    },
    triggerPos: { x: -2000, y: -1500 }
  },
  {
    id: 8,
    text: {
      [Language.DE]: "Frühling 2010. Er wurde für tot erklärt. Ich unterschrieb nichts.",
      [Language.EN]: "Spring 2010. He was declared dead. I signed nothing."
    },
    triggerPos: { x: 2000, y: -2000 }
  },
  {
    id: 9,
    text: {
      [Language.DE]: "Da war ein Schatten. Er sah aus wie er. Er rannte weg.",
      [Language.EN]: "There was a shadow. It looked like him. It ran away."
    },
    triggerPos: { x: 600, y: -2500 },
    evidenceKey: "SCHATTEN"
  },
  {
    id: 10,
    text: {
      [Language.DE]: "Ich verliere den Verstand. Ich sehe mein eigenes Gesicht im Fluss, aber es lacht mich aus.",
      [Language.EN]: "I'm losing my mind. I see my own face in the river, but it's laughing at me."
    },
    triggerPos: { x: -2200, y: 2200 }
  },
  {
    id: 11,
    text: {
      [Language.DE]: "2010. Eine Höhle im tiefsten Dickicht. Dort saß er.",
      [Language.EN]: "2010. A cave in the deepest thicket. There he sat."
    },
    triggerPos: { x: 2500, y: 1000 },
    evidenceKey: "HÖHLE"
  },
  {
    id: 12,
    text: {
      [Language.DE]: "'Papa?', sagte er. Seine Stimme war... zu perfekt.",
      [Language.EN]: "'Daddy?', he said. His voice was... too perfect."
    },
    triggerPos: { x: 2600, y: 1050 }
  },
  {
    id: 13,
    text: {
      [Language.DE]: "Wir gehen nach Hause. Aber er blinzelt nicht. Nie.",
      [Language.EN]: "We are going home. But he doesn't blink. Never."
    },
    triggerPos: { x: 1000, y: 500 }
  },
  {
    id: 14,
    text: {
      [Language.DE]: "Er lernt meine Gesten. Er stiehlt meine Identität.",
      [Language.EN]: "He is learning my gestures. He is stealing my identity."
    },
    triggerPos: { x: -200, y: -200 }
  },
  {
    id: 15,
    text: {
      [Language.DE]: "Es ist ein Skinwalker. Er will mein Leben. Ich muss ihn aufhalten.",
      [Language.EN]: "It's a skinwalker. It wants my life. I must stop it."
    },
    triggerPos: { x: 0, y: 0 }
  }
];

export const EVIDENCE_TASKS = [
  { key: "SCHUH", de: "Zerrissener Schuh", en: "Torn Shoe" },
  { key: "SYMBOLE", de: "Merkwürdige Symbole", en: "Strange Symbols" },
  { key: "SCHATTEN", de: "Fremder Schatten", en: "Stranger's Shadow" },
  { key: "HÖHLE", de: "Die Höhle", en: "The Cave" }
];

export const TRANSLATIONS = {
  [Language.DE]: {
    start: "START",
    settings: "EINSTELLUNGEN",
    credits: "MITWIRKENDE",
    back: "ZURÜCK",
    accept: "AKZEPTIEREN",
    language: "SPRACHE",
    volume: "LAUTSTÄRKE",
    graphics: "GRAFIK",
    keybinds: "STEUERUNG",
    disclaimer: "Dieses Spiel ist keine wahre Geschichte, es ist nur eine Fan-Story.",
    pauseInstruction: "Drücke 'P' zum Pausieren.",
    paused: "PAUSIERT",
    resume: "FORTSETZEN",
    quit: "BEENDEN",
    theEnd: "DAS ENDE?",
    toBeContinued: "Fortsetzung folgt...",
    creator: "Erstellt von Aydin und Tino",
    doubleClick: "HINWEIS: Doppelt auf die Knöpfe drücken!",
    title: "DER VERLORENE SOHN teil 1",
    tasks: "BEWEISE:"
  },
  [Language.EN]: {
    start: "START",
    settings: "SETTINGS",
    credits: "CREDITS",
    back: "BACK",
    accept: "ACCEPT",
    language: "LANGUAGE",
    volume: "VOLUME",
    graphics: "GRAPHICS",
    keybinds: "KEYBINDS",
    disclaimer: "This game is not a real story its just a fan story.",
    pauseInstruction: "Press 'P' to Pause.",
    paused: "PAUSED",
    resume: "RESUME",
    quit: "QUIT",
    theEnd: "THE END?",
    toBeContinued: "To be continued...",
    creator: "Created by Aydin and Tino",
    doubleClick: "NOTE: Double click the buttons!",
    title: "THE LOST SON part 1",
    tasks: "EVIDENCE:"
  }
};
