export const suits: string[] = ["D", "C", "H", "S"];
export const values: string[] = [
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

export const cardBackImage = new URL("../assets/cards/cardBack.jpg", import.meta.url).href;

export const cardImages: Record<string, string> = {};
values.forEach((val) => {
  suits.forEach((suit) => {
    cardImages[`${val}-${suit}`] = new URL(
      `../assets/cards/${val}${suit}.jpg`,
      import.meta.url
    ).href;
  });
});

export function cardLabel(card: [number, number]): string {
  return [values[card[0] - 1], suits[card[1] - 1]].join("-");
}
