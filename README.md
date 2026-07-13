# Deuces

A real-time, browser-based card game for exactly 4 players, in the spirit of Big Two / Choh Dai Di: be the first to play every card in your hand. Built with a React client and an Express + Socket.IO server that holds all game state in memory.

## Getting started

This is an npm workspaces monorepo (`client/`, `server/`, `shared/`). From the project root:

```bash
npm install          # installs everything for all three workspaces
npm run dev:server   # starts the game server on http://localhost:3000
npm run dev:client   # starts the client on http://localhost:5173
```

Open `http://localhost:5173` in a browser (4 tabs/windows, or incognito windows, to test a full game locally).

## How to play

1. **Enter your name** on the home screen.
2. **Get into a room** with 3 other players, either by:
   - **Quick Join** — drops you into any open room, or creates one if none exist.
   - **Create New Room** — generates a 6-character room code to share.
   - **Join Room** — enter a room code a friend shared with you.
3. Once 4 players are in the room, everyone clicks **Ready!** (you can click **Unready** to back out before the game starts). As soon as all 4 players are ready, the game deals hands and begins automatically.
4. Play proceeds until one player has played every card in their hand — that player wins immediately and the game ends.

## Rules and mechanics

### The deck

A standard 52-card deck (no jokers), dealt evenly so each of the 4 players gets 13 cards.

**Card rank**, low to high: `2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A`.

**Suit rank** (used only to break ties between cards of the same value), low to high: `♦ Diamonds < ♣ Clubs < ♥ Hearts < ♠ Spades`.

### Turn order

Turn order is randomized fresh at the start of every game — it isn't based on who created the room or joined first. Whoever goes first may open with any legal hand.

### Making a play

On your turn you either **play a hand** or **pass**. A played hand must:

- contain the **same number of cards** as the hand currently on the table (or any number of cards, if the table is empty), and
- **outrank** the hand on the table (see hand types below), or be a **higher card** if it's the same type of hand.

If you have no beatable hand, or don't want to play one, you can pass instead.

### Hand types

| Cards | Hand | Beats a lower hand of the same size when... |
|---|---|---|
| 1 | Single | it has the higher card |
| 2 | Pair | both cards share a value, higher pair value wins |
| 3 | Triple | all three cards share a value, higher triple value wins |
| 5 | Straight | 5 cards in sequence (see note below) |
| 5 | Flush | 5 cards of the same suit |
| 5 | Full House | 3 of one value + 2 of another |
| 5 | Four of a Kind | 4 of one value + any 1 other card (the "kicker") |
| 5 | Straight Flush | 5 cards in sequence, all the same suit |

There is no valid 4-card hand — a four-of-a-kind must be played as a 5-card hand together with one kicker.

Among 5-card hands, ranking from weakest to strongest is: **Straight < Flush < Full House < Four of a Kind < Straight Flush**. A higher-ranked hand type always beats a lower one, regardless of card values (e.g. any flush beats any straight).

**Straights** are 5 consecutive values, e.g. `9-10-J-Q-K`. As a special case, `2-3-4-5-A` also counts as a straight (an Ace-low run), in addition to normal runs like `10-J-Q-K-A`.

### Passing and clearing the table

If **three players in a row pass**, the table clears and the next player in turn order may lead with any legal hand — turn order keeps rotating normally and does not jump back to whoever played the last hand.

### Winning

The moment a player plays their final card, they're declared the winner and the game ends immediately for everyone in the room.

### Feedback while playing

- Attempting to play out of turn, or an illegal combination of cards, flashes a red message on screen explaining why the play was rejected.
- Each opponent's remaining card count is shown around the table, along with a highlight on whoever's turn it currently is.
