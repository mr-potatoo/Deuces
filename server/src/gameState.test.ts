import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "./gameState";

function readyFourPlayerGame(): { game: GameState; ids: string[] } {
  const game = new GameState();
  const ids = ["p1", "p2", "p3", "p4"];
  ids.forEach((id, i) => game.addPlayer(id, `Player ${i + 1}`));
  ids.forEach((id) => game.readied.add(id));
  return { game, ids };
}

describe("GameState player management", () => {
  it("adds up to 4 players and rejects a 5th", () => {
    const game = new GameState();
    expect(game.addPlayer("p1", "Alice")).toBe(true);
    expect(game.addPlayer("p2", "Bob")).toBe(true);
    expect(game.addPlayer("p3", "Carol")).toBe(true);
    expect(game.addPlayer("p4", "Dave")).toBe(true);
    expect(game.addPlayer("p5", "Eve")).toBe(false);
    expect(game.playerOrder).toHaveLength(4);
  });

  it("removes a player from playerOrder and playerNames", () => {
    const game = new GameState();
    game.addPlayer("p1", "Alice");
    game.addPlayer("p2", "Bob");
    game.removePlayer("p1");
    expect(game.playerOrder).toEqual(["p2"]);
    expect(game.getPlayerName("p1")).toBe("Unknown");
  });

  it("requires exactly 4 readied players before everyoneReady is true", () => {
    const game = new GameState();
    ["p1", "p2", "p3"].forEach((id) => game.addPlayer(id, id));
    ["p1", "p2", "p3"].forEach((id) => game.readied.add(id));
    expect(game.everyoneReady()).toBe(false);

    game.addPlayer("p4", "p4");
    game.readied.add("p4");
    expect(game.everyoneReady()).toBe(true);
  });

  it("reports players list and card counts by playerOrder", () => {
    const { game } = readyFourPlayerGame();
    game.startGame();

    const list = game.getPlayersList();
    expect(list).toHaveLength(4);
    expect(list.every((p) => p.ready)).toBe(true);

    const counts = game.getPlayerCardCounts();
    expect(counts.every((p) => p.count === 13)).toBe(true);
  });
});

describe("GameState.startGame", () => {
  it("deals the full 52-card deck evenly with no duplicates", () => {
    const { game } = readyFourPlayerGame();
    game.startGame();

    const allCards = game.playerOrder.flatMap((id) => game.getCards(id));
    expect(allCards).toHaveLength(52);

    const unique = new Set(allCards.map(([v, s]) => `${v}-${s}`));
    expect(unique.size).toBe(52);

    game.playerOrder.forEach((id) => {
      expect(game.getCards(id)).toHaveLength(13);
    });
  });

  it("always starts with whoever holds the 3 of diamonds", () => {
    for (let i = 0; i < 20; i++) {
      const { game } = readyFourPlayerGame();
      game.startGame();

      const starterHand = game.getCards(game.curPlayer);
      const hasThreeOfDiamonds = starterHand.some(([v, s]) => v === 2 && s === 1);
      expect(hasThreeOfDiamonds).toBe(true);

      // turn index must line up with curPlayer's seat so rotation continues correctly
      expect(game.playerOrder[game.turn % 4]).toBe(game.curPlayer);
    }
  });

  it("marks the game as started via everyoneReady + startGame flow", () => {
    const { game } = readyFourPlayerGame();
    expect(game.started).toBe(false);
    game.startGame();
    // startGame itself doesn't flip `started` - that's the caller's responsibility (see server.ts),
    // but curMove/winner should be reset for a fresh game
    expect(game.curMove).toEqual([]);
    expect(game.winner).toBe("");
  });
});

describe("GameState.playMove", () => {
  let game: GameState;
  const threeOfDiamonds: [number, number] = [2, 1];

  beforeEach(() => {
    game = readyFourPlayerGame().game;
    game.startGame();
  });

  // The starter always holds the 3 of diamonds and must open with it
  function playOpening() {
    expect(game.playMove(game.curPlayer, [threeOfDiamonds])).toBe(true);
  }

  it("rejects a pass as the game's first move", () => {
    const turnBefore = game.turn;
    expect(game.playMove(game.curPlayer, [])).toBe(false);
    expect(game.turn).toBe(turnBefore);
    expect(game.passCtr).toBe(0);
  });

  it("rejects a first move that doesn't include the 3 of diamonds", () => {
    const player = game.curPlayer;
    const otherCard = game
      .getCards(player)
      .find(([v, s]) => !(v === 2 && s === 1))!;

    expect(game.playMove(player, [otherCard])).toBe(false);
    expect(game.playMove(player, [threeOfDiamonds])).toBe(true);
  });

  it("advances the turn and increments passCtr on a pass", () => {
    playOpening();
    const turnAfterOpening = game.turn;

    expect(game.playMove(game.curPlayer, [])).toBe(true);
    expect(game.passCtr).toBe(1);
    expect(game.turn).toBe(turnAfterOpening + 1);
    expect(game.curPlayer).toBe(game.playerOrder[(turnAfterOpening + 1) % 4]);
  });

  it("clears curMove after 3 consecutive passes", () => {
    playOpening();
    expect(game.curMove).toHaveLength(1);

    game.playMove(game.curPlayer, []);
    game.playMove(game.curPlayer, []);
    expect(game.curMove).toHaveLength(1); // only 2 passes so far

    game.playMove(game.curPlayer, []);
    expect(game.curMove).toEqual([]); // 3rd consecutive pass clears the table
  });

  it("rejects an illegal move and leaves state unchanged", () => {
    const player = game.curPlayer;
    const handBefore = [...game.getCards(player)];
    const turnBefore = game.turn;

    // mismatched values - not a valid pair or any other recognized combination
    const illegalMove: [number, number][] = [[1, 1], [2, 2]];

    expect(game.playMove(player, illegalMove)).toBe(false);
    expect(game.getCards(player)).toEqual(handBefore);
    expect(game.turn).toBe(turnBefore);
  });

  it("rejects cards the player doesn't hold, leaving state unchanged", () => {
    const starter = game.curPlayer;
    playOpening();
    const starterCard = game.getCards(starter)[0];
    const player = game.curPlayer;
    const handBefore = [...game.getCards(player)];
    const turnBefore = game.turn;

    // any single beats the 3 of diamonds, so only ownership can reject this
    expect(game.playMove(player, [starterCard])).toBe(false);
    expect(game.getCards(player)).toEqual(handBefore);
    expect(game.turn).toBe(turnBefore);
  });

  it("rejects a move containing the same card twice", () => {
    // without the duplicate check this would classify as a valid opening double
    expect(
      game.playMove(game.curPlayer, [threeOfDiamonds, threeOfDiamonds])
    ).toBe(false);
  });

  it("removes played cards from the hand and resets passCtr", () => {
    const player = game.curPlayer;

    playOpening();
    expect(game.getCards(player)).not.toContainEqual(threeOfDiamonds);
    expect(game.passCtr).toBe(0);
    expect(game.curMove).toEqual([threeOfDiamonds]);
  });

  it("records every play and pass in moveHistory", () => {
    const starter = game.curPlayer;
    playOpening();
    const passer = game.curPlayer;
    game.playMove(passer, []);

    expect(game.moveHistory).toEqual([
      { id: starter, cards: [threeOfDiamonds] },
      { id: passer, cards: [] },
    ]);
  });

  it("declares a winner the moment a player empties their hand", () => {
    const player = game.curPlayer;
    // Force the starter down to just the 3 of diamonds, then open with it
    game.players[player] = [threeOfDiamonds];

    expect(game.playMove(player, [threeOfDiamonds])).toBe(true);
    expect(game.winner).toBe(player);
  });
});
