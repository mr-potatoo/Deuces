export function TurnIndicator({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 animate-pulse rounded-full"></div>
        <div className="relative text-4xl font-black text-yellow-400 bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-yellow-400/30 shadow-2xl">
          Your Turn!
        </div>
      </div>
    </div>
  );
}
