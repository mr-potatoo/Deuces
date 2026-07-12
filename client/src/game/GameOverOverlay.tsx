export function GameOverOverlay({
  isWinner,
  onReturnHome,
}: {
  isWinner: boolean;
  onReturnHome: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className={`text-8xl font-black mb-4 animate-bounce ${isWinner ? "text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" : "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"}`}>
          {isWinner ? "VICTORY!" : "DEFEAT"}
        </div>
        <div className={`text-2xl mb-8 ${isWinner ? "text-yellow-200" : "text-red-200"}`}>
          {isWinner ? "Congratulations! You've won the game!" : "Better luck next time!"}
        </div>
        <button
          onClick={onReturnHome}
          className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-400/50 transform hover:scale-105 transition-all duration-300 border border-purple-400/30"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
