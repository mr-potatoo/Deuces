import { Card } from "./Card";
import { cardLabel } from "./cardAssets";

export function TableArea({
  curPlay,
  gameStarted,
}: {
  curPlay: [number, number][];
  gameStarted: boolean;
}) {
  return (
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
              curPlay.map((card, index) => (
                <div key={index} className={index > 0 ? "-ml-16" : ""}>
                  <Card inHand={false} card={cardLabel(card)} />
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
  );
}
