import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../../typings";

interface Player {
  id: string;
  name: string;
  ready: boolean;
}

const suits: string[] = ["D", "C", "H", "S"];
const values: string[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const cardImages: Record<string, string> = {};
const cardBackImage = new URL("./assets/cards/cardBack.jpg", import.meta.url).href;

values.forEach((val) => {
  suits.forEach((suit) => {
    cardImages[`${val}-${suit}`] = new URL(
      `./assets/cards/${val}${suit}.jpg`,
      import.meta.url
    ).href;
  });
});

interface PlayerCardCount {
  id: string;
  name: string;
  count: number;
}

function Card({
  card,
  inHand = true,
  selected = false,
  onCardClick = () => null,
}: {
  card: string;
  inHand?: boolean;
  selected?: boolean;
  onCardClick?: () => void;
}) {
  return (
    <button
      className={`p-0 rounded-xl cursor-pointer transition-all duration-300 ${
        inHand
          ? "hover:shadow-xl hover:shadow-white/30 hover:-translate-y-2"
          : "shadow-lg shadow-black/50"
      } ${selected ? "!-translate-y-8 ring-2 ring-yellow-400 shadow-xl shadow-yellow-400/30" : ""}`}
      onClick={onCardClick}
    >
      <img
        src={cardImages[card]}
        className="w-28 block rounded-xl shadow-md"
        alt={card}
      />
    </button>
  );
}

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

    socket.on("updateGameState", handleUpdateGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("playerReady", handlePlayerReady);
    socket.on("roomState", handleRoomState);
    socket.on("gameOver", handleGameOver);

    // Request current room state when component mounts
    socket.emit("requestRoomState");

    return () => {
      socket.off("updateGameState", handleUpdateGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("playerReady", handlePlayerReady);
      socket.off("roomState", handleRoomState);
      socket.off("gameOver", handleGameOver);
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

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className={`text-8xl font-black mb-4 animate-bounce ${isWinner ? "text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" : "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"}`}>
              {isWinner ? "VICTORY!" : "DEFEAT"}
            </div>
            <div className={`text-2xl mb-8 ${isWinner ? "text-yellow-200" : "text-red-200"}`}>
              {isWinner ? "Congratulations! You've won the game!" : "Better luck next time!"}
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-400/50 transform hover:scale-105 transition-all duration-300 border border-purple-400/30"
            >
              Return Home
            </button>
          </div>
        </div>
      )}

      {/* Room Info Panel */}
      <div className="fixed top-4 left-4 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
          <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Room Code</div>
          <div className="text-2xl font-bold text-white tracking-widest">{roomId}</div>
          <div className="flex gap-2 mt-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  player.ready
                    ? "bg-green-400 shadow-lg shadow-green-400/50"
                    : "bg-gray-500"
                }`}
                title={player.name}
              />
            ))}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-3 h-3 rounded-full border border-gray-600 border-dashed"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Opponent Cards */}
      {gameStarted && (() => {
        const myIndex = playerCardCounts.findIndex((p) => p.id === socket.id);
        const totalPlayers = playerCardCounts.length;

        const positions = [
          "fixed right-6 top-1/2 -translate-y-1/2",
          "fixed top-6 left-1/2 -translate-x-1/2",
          "fixed left-6 top-1/2 -translate-y-1/2",
        ];

        return playerCardCounts.map((player, index) => {
          if (player.id === socket.id) return null;

          const relativePos = (index - myIndex + totalPlayers) % totalPlayers;
          const positionClass = positions[relativePos - 1] || positions[0];
          const isCurrentTurn = currentPlayerId === player.id;

          return (
            <div
              key={player.id}
              className={`${positionClass} z-10 transition-all duration-500`}
            >
              <div
                className={`p-4 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
                  isCurrentTurn
                    ? "bg-yellow-500/20 border-yellow-400/50 shadow-lg shadow-yellow-400/20 scale-105"
                    : "bg-black/30 border-white/10 hover:bg-black/40"
                }`}
              >
                <div className={`text-sm font-bold mb-2 ${isCurrentTurn ? "text-yellow-300" : "text-white/80"}`}>
                  {player.name}
                  {isCurrentTurn && <span className="ml-2 text-xs animate-pulse">Playing...</span>}
                </div>
                <div className="flex">
                  {Array.from({ length: player.count }).map((_, i) => (
                    <img
                      key={i}
                      src={cardBackImage}
                      className={`w-8 rounded-md shadow-md ${i > 0 ? "-ml-5" : ""}`}
                      style={{ zIndex: i }}
                      alt="card"
                    />
                  ))}
                  {player.count === 0 && (
                    <span className="text-xs text-gray-400 italic">No cards</span>
                  )}
                </div>
              </div>
            </div>
          );
        });
      })()}

      {/* Your Turn Indicator */}
      {curPlayer && !gameOver && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 animate-pulse rounded-full"></div>
            <div className="relative text-4xl font-black text-yellow-400 bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-yellow-400/30 shadow-2xl">
              Your Turn!
            </div>
          </div>
        </div>
      )}

      {/* Center Table Area */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Table felt */}
          <div className="w-80 h-48 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-[100px] border-8 border-amber-900/80 shadow-2xl shadow-black/50">
            <div className="absolute inset-4 border-2 border-emerald-600/30 rounded-[80px]"></div>
          </div>

          {/* Current Play Cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex justify-center">
              {curPlay.length > 0 ? (
                curPlay.map((card: [number, number], index: number) => (
                  <div key={index} className={index > 0 ? "-ml-16" : ""}>
                    <Card
                      inHand={false}
                      card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
                    />
                  </div>
                ))
              ) : (
                <div className="text-emerald-600/50 text-lg font-medium">
                  {gameStarted ? "No cards played" : "Waiting for players..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Player Area */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="flex flex-col items-center pb-6">
          {/* Ready / Unready Button (before game starts) */}
          {!gameStarted && (
            <div className="mb-8 flex flex-col items-center gap-3">
              {isReady ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-lg animate-pulse">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    You're ready! Waiting for others...
                  </div>
                  <button
                    className="px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-red-500/30 hover:shadow-red-400/50 transform hover:scale-105 transition-all duration-300 border border-red-400/30"
                    onClick={handleUnreadyClick}
                  >
                    Unready
                  </button>
                </>
              ) : (
                <button
                  className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-400/50 transform hover:scale-105 transition-all duration-300 border border-green-400/30"
                  onClick={handleReadyClick}
                >
                  Ready!
                </button>
              )}
              <div className="text-white/50 text-sm">
                {readyCount}/{players.length} players ready
              </div>
            </div>
          )}

          {/* Play/Pass Button */}
          {gameStarted && !gameOver && (
            <button
              className={`mb-6 px-12 py-4 text-xl font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 border ${
                cards.some(([, selected]) => selected)
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-blue-500/30 hover:shadow-blue-400/50 border-blue-400/30"
                  : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-gray-200 shadow-gray-500/30 border-gray-500/30"
              }`}
              onClick={handlePlayClick}
            >
              {cards.some(([, selected]) => selected) ? "Play!" : "Pass"}
            </button>
          )}

          {/* Player's Hand */}
          <div className="bg-black/30 backdrop-blur-sm rounded-t-3xl px-8 pt-6 pb-4 border-t border-x border-white/10">
            <div className="flex justify-center">
              {cards.map(
                ([card, selected]: [[number, number], boolean], index: number) => (
                  <div
                    key={index}
                    className={index > 0 ? "-ml-16" : ""}
                    style={{ zIndex: index }}
                  >
                    <Card
                      selected={selected}
                      card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
                      onCardClick={() => handleCardClick(index)}
                    />
                  </div>
                )
              )}
              {cards.length === 0 && !gameStarted && (
                <div className="text-white/40 text-lg py-8">
                  Waiting for all players to ready up...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
