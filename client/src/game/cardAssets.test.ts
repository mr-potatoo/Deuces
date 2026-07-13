import { describe, it, expect } from "vitest";
import { cardLabel, cardImages, values, suits } from "./cardAssets";

describe("cardLabel", () => {
  it("maps the lowest card (value 1, suit 1) to 2 of Diamonds", () => {
    expect(cardLabel([1, 1])).toBe("2-D");
  });

  it("maps the highest card (value 13, suit 4) to Ace of Spades", () => {
    expect(cardLabel([13, 4])).toBe("A-S");
  });

  it("maps a middle value/suit correctly", () => {
    expect(cardLabel([9, 3])).toBe("10-H");
  });
});

describe("cardImages", () => {
  it("has an image URL registered for every value/suit combination", () => {
    expect(Object.keys(cardImages)).toHaveLength(values.length * suits.length);
    values.forEach((value) => {
      suits.forEach((suit) => {
        expect(cardImages[`${value}-${suit}`]).toBeTruthy();
      });
    });
  });
});
