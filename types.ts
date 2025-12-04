export enum GameType {
  GOMOKU = '五子棋',
  XIANGQI = '中国象棋',
  GO = '围棋'
}

export enum Player {
  BLACK = 'black',
  WHITE = 'white', // Or RED for Xiangqi
  RED = 'red'
}

export interface Coordinates {
  x: number;
  y: number;
}

export type GoBoardState = number[][]; // 0: Empty, 1: Black, 2: White

// Xiangqi Types
export enum PieceType {
  GENERAL = 'general', // Jiang/Shuai
  ADVISOR = 'advisor', // Shi
  ELEPHANT = 'elephant', // Xiang
  HORSE = 'horse', // Ma
  CHARIOT = 'chariot', // Ju
  CANNON = 'cannon', // Pao
  SOLDIER = 'soldier' // Bing/Zu
}

export interface XiangqiPiece {
  type: PieceType;
  player: Player.RED | Player.BLACK;
}

export type XiangqiBoardState = (XiangqiPiece | null)[][];
