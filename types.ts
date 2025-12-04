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

// Online Types
export interface PeerConnection {
    send: (data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    close: () => void;
    open: boolean;
}

export interface OnlineMove {
    type: 'MOVE';
    x: number;
    y: number;
    player?: any;
}

export interface OnlineAction {
    type: 'UNDO' | 'RESET';
}

export type GameMessage = OnlineMove | OnlineAction;