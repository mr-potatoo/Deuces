import { cardImages } from "./cardAssets";

export function Card({
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
