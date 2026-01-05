
export enum GameState {
  MENU = 'MENU',
  DISCLAIMER = 'DISCLAIMER',
  INTRO = 'INTRO',
  GAMEPLAY = 'GAMEPLAY',
  PAUSED = 'PAUSED',
  ENDING_SCENE = 'ENDING_SCENE',
  END_CREDITS = 'END_CREDITS',
  SETTINGS = 'SETTINGS'
}

export enum Language {
  DE = 'DE',
  EN = 'EN'
}

export enum EntityType {
  FATHER = 'FATHER',
  SON = 'SON'
}

export enum AnimationState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  RUN = 'RUN',
  UNNATURAL = 'UNNATURAL',
  SCARED = 'SCARED',
  FALLING = 'FALLING'
}

export interface GameSettings {
  language: Language;
  volume: number;
  graphicsQuality: 'LOW' | 'HIGH';
  keybinds: {
    up: string;
    down: string;
    left: string;
    right: string;
    interact: string;
    run: string;
    pause: string;
  };
}

export interface StoryBeat {
  id: number;
  text: {
    [Language.DE]: string;
    [Language.EN]: string;
  };
  triggerPos: { x: number; y: number };
  evidenceKey?: string;
}
