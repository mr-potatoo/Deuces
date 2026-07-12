import { checkValidMove } from "./gameLogic";

type Card = [number, number];

const deck: Card[] = Array.from({ length: 13 }, (_, value) =>
    Array.from(
        { length: 4 },
        (_, suit) => [value + 1, suit + 1] as [number, number]
    )
).reduce((acc, val) => acc.concat(val), []);

function shuffle(deck: Card[]) {
    const shuffled = [...deck];
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
        this.winner = "";
        this.turn = 0;
        this.curMove = [];
        this.curPlayer = this.playerOrder[0];
        this.dealCards();
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

    playMove(id: string, move: Card[]) {
        if (move.length == 0){
            this.passCtr++;
            if (this.passCtr === 3){
                this.curMove = [];
            }
            this.turn++;
            this.curPlayer = this.playerOrder[this.turn%4];
            return true;
        } else if (checkValidMove(move, this.curMove)) {
            this.players[id] = this.players[id].filter((handCard) => !move.some(moveCard =>
                handCard[0] === moveCard[0] && handCard[1] === moveCard[1]
            ));
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