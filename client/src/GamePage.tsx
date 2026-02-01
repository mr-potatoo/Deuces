import { useState } from "react";
import { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../../typings";

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

values.forEach((val) => {
  suits.forEach((suit) => {
    cardImages[`${val}-${suit}`] = new URL(
      `./assets/cards/${val}${suit}.jpg`,
      import.meta.url
    ).href;
  });
});

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
      className={`p-0 rounded-lg cursor-pointer ${
        inHand ? "hover:shadow-lg hover:shadow-white" : ""
      } ${selected ? "!-translate-y-6" : ""} transition-transform duration-300`}
      onClick={onCardClick}
    >
      <img src={cardImages[card]} className="w-30 block rounded-lg" />
    </button>
  );
}

export default function Game({
  socket,
}: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}) {
  const [cards, setCards] = useState<[[number, number], boolean][]>([]);
  const [curPlay, setCurPlay] = useState<[number, number][]>([]);
  const [curPlayer, setCurPlayer] = useState<boolean>(false);

  function handleCardClick(index: number) {
    const nextCards = cards.slice();
    nextCards[index][1] = !nextCards[index][1];
    setCards(nextCards);
  }

  function handlePlayClick() {
    const selectedCards = cards
      .filter((value) => value[1] == true)
      .map((value) => value[0]);
    socket.emit("playMove", { selectedCards });
  }

  socket.on("updateGameState", (data) => {
    setCards(data.cards.map((card: [number, number]) => [card, false]));
    setCurPlay(data.curMove);
    setCurPlayer(data.curPlayer);
  });

  function handleReadyClick(){
    socket.emit("ready");
  }

  return (
    <>
    {curPlayer ? <div>It's your turn!</div> : null}
    <div className="flex flex-col items-center fixed bottom-0 left-1/2 -translate-x-1/2">
      <button
        className="btn mb-10 bg-green-700 hover:bg-green-900"
        onClick={handleReadyClick}
      >
        Ready!
      </button>
      <div className="flex mb-4">
        {curPlay.map(
          (card: [number, number]) => (
            <Card
              inHand = {false}
              card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
            />
          )
        )}
      </div>
      <button
        className="btn mb-10 bg-green-700 hover:bg-green-900"
        onClick={handlePlayClick}
      >
        Play!
      </button>
      <div className="flex mb-4">
        {cards.map(
          ([card, selected]: [[number, number], boolean], index: number) => (
            <Card
              key={index}
              selected={selected}
              card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
              onCardClick={() => handleCardClick(index)}
            />
          )
        )}
      </div>
    </div>
    </>
  );
}
