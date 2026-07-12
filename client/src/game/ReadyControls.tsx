export function ReadyControls({
  isReady,
  readyCount,
  totalPlayers,
  onReady,
  onUnready,
}: {
  isReady: boolean;
  readyCount: number;
  totalPlayers: number;
  onReady: () => void;
  onUnready: () => void;
}) {
  return (
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
            onClick={onUnready}
          >
            Unready
          </button>
        </>
      ) : (
        <button
          className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-400/50 transform hover:scale-105 transition-all duration-300 border border-green-400/30"
          onClick={onReady}
        >
          Ready!
        </button>
      )}
      <div className="text-white/50 text-sm">
        {readyCount}/{totalPlayers} players ready
      </div>
    </div>
  );
}
