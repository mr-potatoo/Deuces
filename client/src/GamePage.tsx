import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "shared";
import type { Player, PlayerCardCount } from "./game/types";
import { RoomInfoPanel } from "./game/RoomInfoPanel";
import { OpponentHands } from "./game/OpponentHands";
import { GameOverOverlay } from "./game/GameOverOverlay";
import { InvalidMoveFlash } from "./game/InvalidMoveFlash";
import { TurnIndicator } from "./game/TurnIndicator";
import { TableArea } from "./game/TableArea";
import { ReadyControls } from "./game/ReadyControls";
import { PlayerHand } from "./game/PlayerHand";

export default function Game({
  socket,
}: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<[[number, number], boolean][]>([]);
  const [curPlay, setCurPlay] = useState<[number, number][]>([]);
  const [curPlayer, setCurPlayer] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [playerCardCounts, setPlayerCardCounts] = useState<PlayerCardCount[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [invalidMove, setInvalidMove] = useState<{ id: number; message: string } | null>(null);
  const invalidMoveIdRef = useRef(0);

  useEffect(() => {
    const handleUpdateGameState = (data: { cards: [number, number][]; curMove: [number, number][]; curPlayer: boolean; currentPlayerId: string; playerCardCounts: PlayerCardCount[] }) => {
      setCards(data.cards.map((card: [number, number]) => [card, false]));
      setCurPlay(data.curMove);
      setCurPlayer(data.curPlayer);
      setCurrentPlayerId(data.currentPlayerId);
      setPlayerCardCounts(data.playerCardCounts);
      setGameStarted(true);
    };

    const handlePlayerJoined = (data: { playerId: string; playerCount: number; players: { id: string; name: string; ready: boolean }[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    };

    const handlePlayerReady = (data: { playerId: string; ready: boolean }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.playerId ? { ...p, ready: data.ready } : p))
      );
    };

    const handleRoomState = (data: { players: { id: string; name: string; ready: boolean }[] }) => {
      setPlayers(data.players);
    };

    const handleGameOver = (data: { winner: string }) => {
      setGameOver(true);
      setIsWinner(data.winner === socket.id);
    };

    const handleInvalidMove = (data?: { reason?: string }) => {
      const id = ++invalidMoveIdRef.current;
      setInvalidMove({ id, message: data?.reason || "Invalid move" });
      setTimeout(() => {
        setInvalidMove((current) => (current?.id === id ? null : current));
      }, 1800);
    };

    socket.on("updateGameState", handleUpdateGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("playerReady", handlePlayerReady);
    socket.on("roomState", handleRoomState);
    socket.on("gameOver", handleGameOver);
    socket.on("invalidMove", handleInvalidMove);

    // Request current room state when component mounts
    socket.emit("requestRoomState");

    return () => {
      socket.off("updateGameState", handleUpdateGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("playerReady", handlePlayerReady);
      socket.off("roomState", handleRoomState);
      socket.off("gameOver", handleGameOver);
      socket.off("invalidMove", handleInvalidMove);
    };
  }, [socket]);

  function handleCardClick(index: number) {
    if (gameOver) return;
    const nextCards = cards.slice();
    nextCards[index][1] = !nextCards[index][1];
    setCards(nextCards);
  }

  function handlePlayClick() {
    if (gameOver) return;
    const selectedCards = cards
      .filter((value) => value[1] == true)
      .map((value) => value[0]);
    socket.emit("playMove", { selectedCards });
  }

  function handleReadyClick(){
    socket.emit("ready");
  }

  function handleUnreadyClick(){
    socket.emit("unready");
  }

  const isReady = players.find((p) => p.id === socket.id)?.ready ?? false;
  const readyCount = players.filter((p) => p.ready).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }}></div>
      </div>

      {gameOver && (
        <GameOverOverlay isWinner={isWinner} onReturnHome={() => navigate("/")} />
      )}

      <RoomInfoPanel roomId={roomId} players={players} />

      {gameStarted && (
        <OpponentHands
          playerCardCounts={playerCardCounts}
          currentPlayerId={currentPlayerId}
          myId={socket.id}
        />
      )}

      <InvalidMoveFlash invalidMove={invalidMove} />

      <TurnIndicator show={curPlayer && !gameOver} />

      <TableArea curPlay={curPlay} gameStarted={gameStarted} />

      {/* Bottom Player Area */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="flex flex-col items-center pb-6">
          {!gameStarted && (
            <ReadyControls
              isReady={isReady}
              readyCount={readyCount}
              totalPlayers={players.length}
              onReady={handleReadyClick}
              onUnready={handleUnreadyClick}
            />
          )}

          <PlayerHand
            cards={cards}
            gameStarted={gameStarted}
            gameOver={gameOver}
            onCardClick={handleCardClick}
            onPlayClick={handlePlayClick}
          />
        </div>
      </div>
    </div>
  );
}
