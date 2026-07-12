import { Card } from "./Card";
import { cardLabel } from "./cardAssets";

export function PlayerHand({
  cards,
  gameStarted,
  gameOver,
  onCardClick,
  onPlayClick,
}: {
  cards: [[number, number], boolean][];
  gameStarted: boolean;
  gameOver: boolean;
  onCardClick: (index: number) => void;
  onPlayClick: () => void;
}) {
  const hasSelection = cards.some(([, selected]) => selected);

  return (
    <>
      {/* Play/Pass Button */}
      {gameStarted && !gameOver && (
        <button
          className={`mb-6 px-12 py-4 text-xl font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 border ${
            hasSelection
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-blue-500/30 hover:shadow-blue-400/50 border-blue-400/30"
              : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-gray-200 shadow-gray-500/30 border-gray-500/30"
          }`}
          onClick={onPlayClick}
        >
          {hasSelection ? "Play!" : "Pass"}
        </button>
      )}

      {/* Player's Hand */}
      <div className="bg-black/30 backdrop-blur-sm rounded-t-3xl px-8 pt-6 pb-4 border-t border-x border-white/10">
        <div className="flex justify-center">
          {cards.map(([card, selected], index) => (
            <div
              key={index}
              className={index > 0 ? "-ml-16" : ""}
              style={{ zIndex: index }}
            >
              <Card
                selected={selected}
                card={cardLabel(card)}
                onCardClick={() => onCardClick(index)}
              />
            </div>
          ))}
          {cards.length === 0 && !gameStarted && (
            <div className="text-white/40 text-lg py-8">
              Waiting for all players to ready up...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
