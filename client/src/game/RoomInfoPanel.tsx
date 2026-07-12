import type { Player } from "./types";

export function RoomInfoPanel({
  roomId,
  players,
}: {
  roomId?: string;
  players: Player[];
}) {
  return (
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
  );
}
