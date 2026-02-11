
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface GameState {
  score: number;
  status: GameStatus;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}
