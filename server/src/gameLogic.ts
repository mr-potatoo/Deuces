const rankToVal: Record<string, number> = {
  "": 0,
  straight: 1,
  flush: 2,
  "full house": 3,
  "four of a kind": 4,
  "straight flush": 5,
};

// returns true if the first card is greater than the second card
export function cardHigher(card1: [number, number], card2: [number, number]) {
  if (card1[0] > card2[0] || (card1[0] == card2[0] && card1[1] > card2[1])) {
    return true;
  }
  return false;
}

export function getMoveInfo(
  cards: [number, number][]
): [string, [number, number]] {
  var rank: string = "";
  var maxCard: [number, number] = [0, 0];
  if (
    [1, 2, 3].includes(cards.length) &&
    cards.every((card) => card[0] === cards[0][0])
  ) {
    rank = ["single", "double", "triple"][cards.length - 1];
    maxCard = cards.reduce((acc, card) => [card[0], Math.max(acc[1], card[1])]);
  } else if (cards.length == 5) {
    // check full house or four of a kind
    const freqs = Object.entries(
      cards.reduce<Record<number, number>>(
        (acc, [val, _]) => ({ ...acc, [val]: (acc[val] ?? 0) + 1 }),
        {}
      )
    );
    const top2 = [...freqs].sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top2[0][1] == 3 && top2[1][1] == 2) {
      rank = "full house";
      // we don't care about the suit -- won't affect ranking
      maxCard = [Number(top2[0][0]), 0];
    } else if (top2[0][1] == 4) {
      rank = "four of a kind";
      // we don't care about the suit -- won't affect ranking
      maxCard = [Number(top2[0][0]), 0];
    }

    // check straight and flush (and both)
    const sortedCards = [...cards].sort((a, b) => a[0] - b[0]);
    const isFlush = cards.every((val) => val[1] === cards[0][1]);
    const isStraight = sortedCards.every(
      (val, index) =>
        index === 0 ||
        val[0] === sortedCards[index - 1][0] + 1 ||
        (val[0] === 13 && sortedCards[index - 1][0] === 4)
    );
    if (isStraight && isFlush) {
      rank = "straight flush";
      maxCard = sortedCards[sortedCards.length - 1];
    } else if (isFlush) {
      rank = "flush";
      maxCard = sortedCards[sortedCards.length - 1];
    } else if (isStraight) {
      rank = "straight";
      maxCard = sortedCards[sortedCards.length - 1];
    }
  }
  return [rank, maxCard];
}

export function checkValidMove(
  play: [number, number][],
  curPlay: [number, number][]
): boolean {
  const [rank, maxCard] = getMoveInfo(play);
  const [curRank, curMaxCard] = getMoveInfo(curPlay);
  // pass, no current play, rank higher, rank equal + maxcard higher
  if (
    play.length == 0 ||
    curPlay.length == 0 && rank||
    play.length === curPlay.length && rankToVal[rank] > rankToVal[curRank] ||
    play.length === curPlay.length && rankToVal[rank] === rankToVal[curRank] && cardHigher(maxCard, curMaxCard)
  ) {
    return true;
  }
  return false;
}
