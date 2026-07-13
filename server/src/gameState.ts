import { checkValidMove } from "./gameLogic";

type Card = [number, number];

const deck: Card[] = Array.from({ length: 13 }, (_, value) =>
    Array.from(
        { length: 4 },
        (_, suit) => [value + 1, suit + 1] as [number, number]
    )
).reduce((acc, val) => acc.concat(val), []);

function shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    return shuffled.reduceRight((shuffled, _, i) => {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        return shuffled;
    }, shuffled);
}

export class GameState {
    players: Record<string, Card[]> = {};
    playerNames: Record<string, string> = {};
    // list of ids
    playerOrder: string[] = [];
    curMove: Card[] = [];
    // every play and pass this game, in order; a pass is cards: []
    moveHistory: { id: string; cards: Card[] }[] = [];
    winner: string = "";
    readied: Set<string> = new Set();
    turn: number = 0;
    passCtr: number = 0;
    curPlayer: string = "";
    started: boolean = false;

    addPlayer(id: string, name: string){
        if (this.playerOrder.length < 4){
            this.playerOrder.push(id);
            this.playerNames[id] = name;
            return true;
        } else {
            return false;
        }
    }

    removePlayer(id: string){
        this.playerOrder = this.playerOrder.filter((player)=>(player!=id));
        delete this.playerNames[id];
    }

    getPlayerName(id: string): string {
        return this.playerNames[id] || "Unknown";
    }

    getPlayersList(): { id: string; name: string; ready: boolean }[] {
        return this.playerOrder.map(id => ({
            id,
            name: this.getPlayerName(id),
            ready: this.readied.has(id)
        }));
    }

    getPlayerCardCounts(): { id: string; name: string; count: number }[] {
        return this.playerOrder.map(id => ({
            id,
            name: this.getPlayerName(id),
            count: this.getCards(id).length
        }));
    }

    startGame(){
        this.curMove = [];
        this.moveHistory = [];
        this.passCtr = 0;
        this.winner = "";
        this.playerOrder = shuffle(this.playerOrder);
        this.dealCards();

        // The player holding the 3 of diamonds (the lowest card) goes first
        const startingPlayer = this.playerOrder.find(id =>
            this.players[id].some(([value, suit]) => value === 2 && suit === 1)
        )!;
        this.turn = this.playerOrder.indexOf(startingPlayer);
        this.curPlayer = startingPlayer;
    }

    dealCards() {
        const shuffled = shuffle(deck);
        this.players = Object.fromEntries(
            this.playerOrder.map((player: string, i: number) => [
                player,
                shuffled.filter((_, j: number) => j % this.playerOrder.length === i)
            ])
        );
    }

    everyoneReady(){
        if (this.readied.size === 4){
            return true;
        } else {
            return false;
        }
    }

    getCards(id: string): Card[] {
        return this.players[id];
    }

    // the submitted cards must all be in the player's hand, with no duplicates
    ownsCards(id: string, move: Card[]): boolean {
        const seen = new Set<string>();
        return move.every(([value, suit]) => {
            const key = `${value},${suit}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return this.players[id].some(
                (handCard) => handCard[0] === value && handCard[1] === suit
            );
        });
    }

    playMove(id: string, move: Card[]) {
        // the game's first move cannot be a pass and must include the 3 of diamonds
        if (this.moveHistory.length === 0 &&
            (move.length === 0 || !move.some(([value, suit]) => value === 2 && suit === 1))
        ) {
            return false;
        }
        if (move.length == 0){
            this.moveHistory.push({ id, cards: [] });
            this.passCtr++;
            if (this.passCtr === 3){
                this.curMove = [];
            }
            this.turn++;
            this.curPlayer = this.playerOrder[this.turn%4];
            return true;
        } else if (this.ownsCards(id, move) && checkValidMove(move, this.curMove)) {
            this.players[id] = this.players[id].filter((handCard) => !move.some(moveCard =>
                handCard[0] === moveCard[0] && handCard[1] === moveCard[1]
            ));
            this.moveHistory.push({ id, cards: move });
            this.curMove = move;
            this.passCtr = 0;
            if (this.victoryCheck(id)) {
                this.winner = id;
            }
            this.turn++;
            this.curPlayer = this.playerOrder[this.turn%4];
            return true;
        }
        return false;
    }

    victoryCheck(id: string) {
        return this.players[id].length === 0;
    }
}