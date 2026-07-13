import { describe, it, expect } from "vitest";
import { cardHigher, getMoveInfo, checkValidMove } from "./gameLogic";

type Card = [number, number];

// Card values: 1 = "2" ... 13 = "A". Suits: 1 = D, 2 = C, 3 = H, 4 = S.
// Strength order is standard Big Two: 3 lowest ... A, with 2 (value 1) HIGHEST.
const c = (value: number, suit: number): Card => [value, suit];

describe("cardHigher", () => {
  it("ranks by value first", () => {
    expect(cardHigher(c(5, 1), c(4, 4))).toBe(true);
    expect(cardHigher(c(4, 4), c(5, 1))).toBe(false);
  });

  it("ranks the 2 above every other card, including the ace", () => {
    expect(cardHigher(c(1, 1), c(13, 4))).toBe(true); // 2D beats AS
    expect(cardHigher(c(13, 4), c(1, 1))).toBe(false);
    expect(cardHigher(c(1, 4), c(1, 1))).toBe(true); // 2S beats 2D on suit
  });

  it("breaks ties on equal value by suit", () => {
    expect(cardHigher(c(7, 4), c(7, 1))).toBe(true); // Spade beats Diamond
    expect(cardHigher(c(7, 1), c(7, 4))).toBe(false);
  });

  it("is false for identical cards", () => {
    expect(cardHigher(c(9, 2), c(9, 2))).toBe(false);
  });
});

describe("getMoveInfo", () => {
  it("classifies singles, doubles, and triples", () => {
    expect(getMoveInfo([c(5, 1)])[0]).toBe("single");
    expect(getMoveInfo([c(5, 1), c(5, 2)])[0]).toBe("double");
    expect(getMoveInfo([c(5, 1), c(5, 2), c(5, 3)])[0]).toBe("triple");
  });

  it("rejects a pair/triple of mismatched values", () => {
    expect(getMoveInfo([c(5, 1), c(6, 2)])[0]).toBe("");
    expect(getMoveInfo([c(5, 1), c(5, 2), c(6, 3)])[0]).toBe("");
  });

  it("picks the highest-suited card as maxCard for doubles", () => {
    const [, maxCard] = getMoveInfo([c(5, 1), c(5, 4)]);
    expect(maxCard).toEqual([5, 4]);
  });

  it("has no valid classification for 4-card selections", () => {
    expect(getMoveInfo([c(5, 1), c(6, 2), c(7, 3), c(8, 4)])[0]).toBe("");
  });

  it("classifies a full house", () => {
    const hand: Card[] = [c(5, 1), c(5, 2), c(5, 3), c(8, 1), c(8, 2)];
    const [rank, maxCard] = getMoveInfo(hand);
    expect(rank).toBe("full house");
    expect(maxCard[0]).toBe(5);
  });

  it("classifies four of a kind (with a kicker)", () => {
    const hand: Card[] = [c(5, 1), c(5, 2), c(5, 3), c(5, 4), c(8, 1)];
    const [rank, maxCard] = getMoveInfo(hand);
    expect(rank).toBe("four of a kind");
    expect(maxCard[0]).toBe(5);
  });

  it("classifies a regular straight", () => {
    const hand: Card[] = [c(6, 1), c(7, 2), c(8, 3), c(9, 4), c(10, 1)];
    expect(getMoveInfo(hand)[0]).toBe("straight");
  });

  it("classifies 2-3-4-5-6 as a straight topped by the 2", () => {
    const hand: Card[] = [c(1, 3), c(2, 2), c(3, 3), c(4, 4), c(5, 1)];
    const [rank, maxCard] = getMoveInfo(hand);
    expect(rank).toBe("straight");
    expect(maxCard).toEqual([1, 3]); // the 2 is the strongest card
  });

  it("rejects A-2-3-4-5 (regression: the old ace-low wheel is invalid)", () => {
    const hand: Card[] = [c(13, 1), c(1, 1), c(2, 2), c(3, 3), c(4, 4)];
    expect(getMoveInfo(hand)[0]).toBe("");
  });

  it("does not treat a non-consecutive gap as a straight", () => {
    const hand: Card[] = [c(1, 1), c(2, 2), c(3, 3), c(4, 4), c(6, 1)];
    expect(getMoveInfo(hand)[0]).toBe("");
  });

  it("classifies a flush", () => {
    const hand: Card[] = [c(2, 1), c(5, 1), c(8, 1), c(11, 1), c(13, 1)];
    expect(getMoveInfo(hand)[0]).toBe("flush");
  });

  it("classifies a straight flush", () => {
    const hand: Card[] = [c(6, 3), c(7, 3), c(8, 3), c(9, 3), c(10, 3)];
    expect(getMoveInfo(hand)[0]).toBe("straight flush");
  });

  it("has no classification for 5 unrelated cards", () => {
    const hand: Card[] = [c(1, 1), c(3, 2), c(6, 3), c(9, 4), c(11, 1)];
    expect(getMoveInfo(hand)[0]).toBe("");
  });
});

describe("checkValidMove", () => {
  it("always allows passing (an empty play)", () => {
    expect(checkValidMove([], [c(5, 1)])).toBe(true);
  });

  it("allows any legal combination to open an empty table", () => {
    expect(checkValidMove([c(5, 1)], [])).toBe(true);
  });

  it("rejects an unclassifiable combination opening an empty table", () => {
    expect(checkValidMove([c(5, 1), c(6, 2)], [])).toBe(false);
  });

  it("rejects a play with a different card count than the current play", () => {
    expect(checkValidMove([c(5, 1)], [c(6, 1), c(6, 2)])).toBe(false);
  });

  it("beats a lower single with a higher single", () => {
    expect(checkValidMove([c(6, 1)], [c(5, 4)])).toBe(true);
  });

  it("rejects a lower single against a higher single", () => {
    expect(checkValidMove([c(4, 4)], [c(5, 1)])).toBe(false);
  });

  it("breaks ties on equal-value singles by suit", () => {
    expect(checkValidMove([c(5, 4)], [c(5, 1)])).toBe(true);
    expect(checkValidMove([c(5, 1)], [c(5, 4)])).toBe(false);
  });

  it("beats an ace with a 2 for singles, pairs, and full houses", () => {
    expect(checkValidMove([c(1, 1)], [c(13, 4)])).toBe(true);
    expect(checkValidMove([c(13, 4)], [c(1, 1)])).toBe(false);
    expect(checkValidMove([c(1, 1), c(1, 2)], [c(13, 3), c(13, 4)])).toBe(true);
    const acesFullOfKings: Card[] = [c(13, 1), c(13, 2), c(13, 3), c(12, 1), c(12, 2)];
    const twosFullOfThrees: Card[] = [c(1, 1), c(1, 2), c(1, 3), c(2, 1), c(2, 2)];
    expect(checkValidMove(twosFullOfThrees, acesFullOfKings)).toBe(true);
    expect(checkValidMove(acesFullOfKings, twosFullOfThrees)).toBe(false);
  });

  it("ranks 2-3-4-5-6 as the highest straight, above 10-J-Q-K-A", () => {
    const twoToSix: Card[] = [c(1, 1), c(2, 2), c(3, 3), c(4, 4), c(5, 1)];
    const tenToAce: Card[] = [c(9, 1), c(10, 2), c(11, 3), c(12, 4), c(13, 4)];
    const nineToKing: Card[] = [c(8, 1), c(9, 2), c(10, 3), c(11, 4), c(12, 1)];
    expect(checkValidMove(twoToSix, tenToAce)).toBe(true);
    expect(checkValidMove(tenToAce, twoToSix)).toBe(false);
    expect(checkValidMove(tenToAce, nineToKing)).toBe(true);
  });

  it("tops a flush containing a 2 with the 2, beating an ace-high flush", () => {
    const aceHighFlush: Card[] = [c(2, 1), c(5, 1), c(8, 1), c(11, 1), c(13, 1)];
    const twoHighFlush: Card[] = [c(1, 2), c(3, 2), c(5, 2), c(7, 2), c(9, 2)];
    expect(getMoveInfo(twoHighFlush)[1]).toEqual([1, 2]);
    expect(checkValidMove(twoHighFlush, aceHighFlush)).toBe(true);
  });

  it("a higher-ranked 5-card hand type beats a lower one regardless of card values", () => {
    const lowFlush: Card[] = [c(2, 1), c(5, 1), c(8, 1), c(11, 1), c(13, 1)];
    const smallStraight: Card[] = [c(1, 2), c(2, 3), c(3, 4), c(4, 1), c(5, 2)];
    expect(checkValidMove(lowFlush, smallStraight)).toBe(true);
  });

  it("rejects a 5-card hand of equal rank but a lower top card", () => {
    const lowerFlush: Card[] = [c(2, 1), c(3, 1), c(5, 1), c(7, 1), c(9, 1)];
    const higherFlush: Card[] = [c(2, 2), c(5, 2), c(8, 2), c(11, 2), c(13, 2)];
    expect(checkValidMove(lowerFlush, higherFlush)).toBe(false);
  });
});
