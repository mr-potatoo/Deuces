import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../../typings";

interface Player {
  id: string;
  ready: boolean;
}

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
const cardBackImage = new URL("./assets/cards/cardBack.jpg", import.meta.url).href;

values.forEach((val) => {
  suits.forEach((suit) => {
    cardImages[`${val}-${suit}`] = new URL(
      `./assets/cards/${val}${suit}.jpg`,
      import.meta.url
    ).href;
  });
});

interface PlayerCardCount {
  id: string;
  count: number;
}

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
  const { roomId } = useParams<{ roomId: string }>();
  const [cards, setCards] = useState<[[number, number], boolean][]>([]);
  const [curPlay, setCurPlay] = useState<[number, number][]>([]);
  const [curPlayer, setCurPlayer] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [playerCardCounts, setPlayerCardCounts] = useState<PlayerCardCount[]>([]);

  useEffect(() => {
    const handleUpdateGameState = (data: { cards: [number, number][]; curMove: [number, number][]; curPlayer: boolean; playerCardCounts: PlayerCardCount[] }) => {
      setCards(data.cards.map((card: [number, number]) => [card, false]));
      setCurPlay(data.curMove);
      setCurPlayer(data.curPlayer);
      setPlayerCardCounts(data.playerCardCounts);
      setGameStarted(true);
    };

    const handlePlayerJoined = (data: { playerId: string; playerCount: number; players: { id: string; ready: boolean }[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    };

    const handlePlayerReady = (data: { playerId: string }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.playerId ? { ...p, ready: true } : p))
      );
    };

    const handleRoomState = (data: { players: { id: string; ready: boolean }[] }) => {
      setPlayers(data.players);
    };

    const handleGameOver = (data: { winner: string }) => {
      setGameOver(true);
      setIsWinner(data.winner === socket.id);
    };

    socket.on("updateGameState", handleUpdateGameState);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("playerReady", handlePlayerReady);
    socket.on("roomState", handleRoomState);
    socket.on("gameOver", handleGameOver);

    // Request current room state when component mounts
    socket.emit("requestRoomState");

    return () => {
      socket.off("updateGameState", handleUpdateGameState);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("playerReady", handlePlayerReady);
      socket.off("roomState", handleRoomState);
      socket.off("gameOver", handleGameOver);
    };
  }, [socket]);

  function handleCardClick(index: number) {
    if (gameOver) return;
    const nextCards = cards.slice();
    nextCards[index][1] = !nextCards[index][1];
    setCards(nextCards);
  }

  function handlePlayClick() {
    if (gameOver) return;
    const selectedCards = cards
      .filter((value) => value[1] == true)
      .map((value) => value[0]);
    socket.emit("playMove", { selectedCards });
  }

  function handleReadyClick(){
    socket.emit("ready");
  }

  return (
    <>
    {gameOver && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-center">
          <h1 className={`text-6xl font-bold ${isWinner ? "text-green-400" : "text-red-400"}`}>
            {isWinner ? "You Won!" : "You Lost"}
          </h1>
        </div>
      </div>
    )}
    <div className="absolute top-4 left-4">
      <div className="text-lg font-semibold">Room: {roomId}</div>
      <div className="flex gap-2 mt-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`w-4 h-4 rounded-full ${
              player.ready ? "bg-green-500" : "bg-gray-500"
            }`}
            title={player.id}
          />
        ))}
        {Array.from({ length: 4 - players.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-4 h-4 rounded-full border-2 border-gray-500 border-dashed"
          />
        ))}
      </div>
    </div>
    {gameStarted && (
      <div className="absolute top-4 right-4 flex flex-col gap-4">
        {playerCardCounts
          .filter((p) => p.id !== socket.id)
          .map((player, playerIndex) => (
            <div key={player.id} className="bg-gray-800/50 p-2 rounded-lg">
              <div className="text-sm mb-1">P{playerIndex + 1}</div>
              <div className="flex">
                {Array.from({ length: player.count }).map((_, i) => (
                  <img
                    key={i}
                    src={cardBackImage}
                    className={`w-6 rounded-sm ${i > 0 ? "-ml-4" : ""}`}
                    style={{ zIndex: i }}
                    alt="card"
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    )}
    {curPlayer ? <div>It's your turn!</div> : null}
    <div className="flex flex-col items-center fixed bottom-0 left-1/2 -translate-x-1/2">
      {!gameStarted && (
        <button
          className="btn mb-10 bg-green-700 hover:bg-green-900"
          onClick={handleReadyClick}
        >
          Ready!
        </button>
      )}
      <div className="flex mb-4">
        {curPlay.map(
          (card: [number, number], index: number) => (
            <div key={index} className={index > 0 ? "-ml-20" : ""}>
              <Card
                inHand={false}
                card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
              />
            </div>
          )
        )}
      </div>
      {gameStarted && !gameOver && (
        <button
          className="btn mb-10 bg-green-700 hover:bg-green-900"
          onClick={handlePlayClick}
        >
          {cards.some(([, selected]) => selected) ? "Play!" : "Pass"}
        </button>
      )}
      <div className="flex mb-4">
        {cards.map(
          ([card, selected]: [[number, number], boolean], index: number) => (
            <div
              key={index}
              className={index > 0 ? "-ml-20" : ""}
              style={{ zIndex: index }}
            >
              <Card
                selected={selected}
                card={[values[card[0] - 1], suits[card[1] - 1]].join("-")}
                onCardClick={() => handleCardClick(index)}
              />
            </div>
          )
        )}
      </div>
    </div>
    </>
  );
}
