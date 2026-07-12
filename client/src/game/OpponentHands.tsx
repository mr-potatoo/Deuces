import { cardBackImage } from "./cardAssets";
import type { PlayerCardCount } from "./types";

const POSITIONS = [
  "fixed right-6 top-1/2 -translate-y-1/2",
  "fixed top-6 left-1/2 -translate-x-1/2",
  "fixed left-6 top-1/2 -translate-y-1/2",
];

export function OpponentHands({
  playerCardCounts,
  currentPlayerId,
  myId,
}: {
  playerCardCounts: PlayerCardCount[];
  currentPlayerId: string;
  myId?: string;
}) {
  const myIndex = playerCardCounts.findIndex((p) => p.id === myId);
  const totalPlayers = playerCardCounts.length;

  return (
    <>
      {playerCardCounts.map((player, index) => {
        if (player.id === myId) return null;

        const relativePos = (index - myIndex + totalPlayers) % totalPlayers;
        const positionClass = POSITIONS[relativePos - 1] || POSITIONS[0];
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
      })}
    </>
  );
}
