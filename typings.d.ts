export interface ServerToClientEvents {
  updateGameState: (data: {cards: [number, number][], curMove: [number, number][], curPlayer: boolean}) => void;
  gameOver: (data: {winner: string}) => void;
  initialize: (data: {cards: [number, number][]}) => void;
  invalidJoin: (data?: { reason: string }) => void;
  roomCreated: (data: { roomId: string }) => void;
  playerJoined: (data: { playerId: string; playerCount: number }) => void;
  playerLeft: (data: { playerId: string }) => void;
}

export interface ClientToServerEvents {
  playMove: (data: {selectedCards: [number, number][];}) => void;
  ready: () => void;
  createRoom: () => void;
  joinRoom: (data: { roomId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}