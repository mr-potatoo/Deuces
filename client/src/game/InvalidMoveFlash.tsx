export function InvalidMoveFlash({
  invalidMove,
}: {
  invalidMove: { id: number; message: string } | null;
}) {
  if (!invalidMove) return null;

  return (
    <div
      key={invalidMove.id}
      className="fixed top-[30%] left-1/2 z-40 animate-flash-message"
    >
      <div className="bg-red-600/90 backdrop-blur-md text-white text-2xl font-bold px-8 py-4 rounded-2xl border border-red-400/40 shadow-2xl shadow-red-500/30 whitespace-nowrap">
        {invalidMove.message}
      </div>
    </div>
  );
}
