import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { io as ioClient, Socket } from "socket.io-client";
import type { AddressInfo } from "net";

let port: number;

beforeAll(async () => {
  // Bind to an OS-assigned free port so this test never collides with a real dev server.
  process.env.PORT = "0";
  const { httpServer } = await import("./server");

  if (!httpServer.listening) {
    await new Promise<void>((resolve) => httpServer.once("listening", resolve));
  }
  port = (httpServer.address() as AddressInfo).port;
});

afterAll(async () => {
  const { io } = await import("./server");
  io.close();
});

function once(socket: Socket, event: string): Promise<any> {
  return new Promise((resolve) => socket.once(event, resolve));
}

function connect(): Socket {
  return ioClient(`http://localhost:${port}`, {
    withCredentials: true,
    forceNew: true,
    reconnection: false,
  });
}

async function createReadyGame(names = ["Alice", "Bob", "Carol", "Dave"]) {
  const sockets = names.map(() => connect());
  await Promise.all(sockets.map((s) => once(s, "connect")));

  const createP = once(sockets[0], "roomCreated");
  sockets[0].emit("createRoom", { playerName: names[0] });
  const { roomId } = await createP;

  for (let i = 1; i < names.length; i++) {
    const joinedP = once(sockets[i], "playerJoined");
    sockets[i].emit("joinRoom", { roomId, playerName: names[i] });
    await joinedP;
  }

  const stateEvents = sockets.map((s) => once(s, "updateGameState"));
  sockets.forEach((s) => s.emit("ready"));
  const states = await Promise.all(stateEvents);

  return { sockets, states };
}

describe("server integration", () => {
  let activeSockets: Socket[] = [];

  afterEach(() => {
    activeSockets.forEach((s) => s.close());
    activeSockets = [];
  });

  it("deals 13 cards to each player and marks exactly one as the current player", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    expect(states.every((s) => s.cards.length === 13)).toBe(true);
    expect(states.filter((s) => s.curPlayer)).toHaveLength(1);
  });

  it("always starts the game with whoever holds the 3 of diamonds", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    const starterState = states.find((s) => s.curPlayer);
    expect(starterState.cards.some(([v, s]: [number, number]) => v === 2 && s === 1)).toBe(true);
  });

  it("rejects a first play that doesn't include the 3 of diamonds", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    const turnIndex = states.findIndex((s) => s.curPlayer);
    const otherCard = states[turnIndex].cards.find(
      ([v, s]: [number, number]) => !(v === 2 && s === 1)
    );

    const invalidP = once(sockets[turnIndex], "invalidMove");
    sockets[turnIndex].emit("playMove", { selectedCards: [otherCard] });
    const msg = await invalidP;

    expect(msg.reason).toMatch(/not a valid play/i);
  });

  it("rejects a move made out of turn with a clear reason", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    const turnIndex = states.findIndex((s) => s.curPlayer);
    const otherIndex = (turnIndex + 1) % sockets.length;

    const invalidP = once(sockets[otherIndex], "invalidMove");
    sockets[otherIndex].emit("playMove", { selectedCards: [[1, 1]] });
    const msg = await invalidP;

    expect(msg.reason).toMatch(/not your turn/i);
  });

  it("rejects an illegal combination from the correct player", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    const turnIndex = states.findIndex((s) => s.curPlayer);
    const hand: [number, number][] = states[turnIndex].cards;
    const a = hand[0];
    const b = hand.find((card) => card[0] !== a[0]);

    const invalidP = once(sockets[turnIndex], "invalidMove");
    sockets[turnIndex].emit("playMove", { selectedCards: [a, b] });
    const msg = await invalidP;

    expect(msg.reason).toMatch(/not a valid play/i);
  });

  it("advances the turn after a legal pass", async () => {
    const { sockets, states } = await createReadyGame();
    activeSockets = sockets;

    // the opening play must be the 3 of diamonds; passing is legal afterwards
    const turnIndex = states.findIndex((s) => s.curPlayer);
    const openingEvents = sockets.map((s) => once(s, "updateGameState"));
    sockets[turnIndex].emit("playMove", { selectedCards: [[2, 1]] });
    const afterOpening = await Promise.all(openingEvents);

    const passerIndex = afterOpening.findIndex((s) => s.curPlayer);
    expect(passerIndex).not.toBe(turnIndex);

    const nextStateEvents = sockets.map((s) => once(s, "updateGameState"));
    sockets[passerIndex].emit("playMove", { selectedCards: [] });
    const nextStates = await Promise.all(nextStateEvents);

    const nextTurnIndex = nextStates.findIndex((s) => s.curPlayer);
    expect(nextTurnIndex).not.toBe(-1);
    expect(nextTurnIndex).not.toBe(passerIndex);
  });
});
