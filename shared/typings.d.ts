export interface ServerToClientEvents {
  updateGameState: (data: {cards: [number, number][], curMove: [number, number][], curPlayer: boolean, currentPlayerId: string, playerCardCounts: { id: string; name: string; count: number }[]}) => void;
  gameOver: (data: {winner: string}) => void;
  invalidMove: (data?: { reason?: string }) => void;
  invalidJoin: (data?: { reason: string }) => void;
  roomCreated: (data: { roomId: string }) => void;
  playerJoined: (data: { playerId: string; playerCount: number; players: { id: string; name: string; ready: boolean }[] }) => void;
  playerLeft: (data: { playerId: string }) => void;
  playerReady: (data: { playerId: string; ready: boolean }) => void;
  roomState: (data: { players: { id: string; name: string; ready: boolean }[] }) => void;
}

export interface ClientToServerEvents {
  playMove: (data: {selectedCards: [number, number][];}) => void;
  ready: () => void;
  unready: () => void;
  createRoom: (data: { playerName: string }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  quickJoin: (data: { playerName: string }) => void;
  requestRoomState: () => void;
}
