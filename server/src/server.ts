import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../typings";
import { GameState } from "./gameState";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store all game rooms
const rooms = new Map<string, GameState>();
// Track which room each player is in
const playerRooms = new Map<string, string>();

// Helper function to generate room ID
function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a new room
    socket.on("createRoom", (data: { playerName: string }) => {
        const roomId = generateRoomId();
        const game = new GameState();
        rooms.set(roomId, game);

        socket.join(roomId);
        playerRooms.set(socket.id, roomId);
        game.addPlayer(socket.id, data.playerName);

        socket.emit("roomCreated", { roomId });

        // Send player list to the creator
        const players = game.playerOrder.map(id => ({
            id,
            name: game.getPlayerName(id),
            ready: game.readied.has(id)
        }));
        socket.emit("playerJoined", {
            playerId: socket.id,
            playerCount: game.playerOrder.length,
            players
        });

        console.log(`Room ${roomId} created by ${data.playerName} (${socket.id})`);
    });

    // Join an existing room
    socket.on("joinRoom", (data: { roomId: string; playerName: string }) => {
        const { roomId, playerName } = data;
        const game = rooms.get(roomId);

        if (!game) {
            socket.emit("invalidJoin", { reason: "Room does not exist" });
            return;
        }

        if (game.addPlayer(socket.id, playerName)) {
            socket.join(roomId);
            playerRooms.set(socket.id, roomId);
            console.log(`Player ${playerName} (${socket.id}) joined room ${roomId}`);

            // Build players list with ready states
            const players = game.playerOrder.map(id => ({
                id,
                name: game.getPlayerName(id),
                ready: game.readied.has(id)
            }));

            // Notify all players in room about new player
            io.to(roomId).emit("playerJoined", {
                playerId: socket.id,
                playerCount: game.playerOrder.length,
                players
            });
        } else {
            console.log(`Room ${roomId} full, join failed for ${socket.id}`);
            socket.emit("invalidJoin", { reason: "Room is full" });
        }
    });

    // Quick join - find an available room or create a new one
    socket.on("quickJoin", (data: { playerName: string }) => {
        const { playerName } = data;

        // Find a room that isn't full and hasn't started
        let availableRoomId: string | null = null;
        for (const [roomId, game] of rooms) {
            if (game.playerOrder.length < 4 && !game.started) {
                availableRoomId = roomId;
                break;
            }
        }

        if (availableRoomId) {
            // Join the available room
            const game = rooms.get(availableRoomId)!;
            game.addPlayer(socket.id, playerName);
            socket.join(availableRoomId);
            playerRooms.set(socket.id, availableRoomId);
            console.log(`Player ${playerName} (${socket.id}) quick joined room ${availableRoomId}`);

            // Emit roomCreated so client knows which room they joined
            socket.emit("roomCreated", { roomId: availableRoomId });

            // Build players list with ready states
            const players = game.playerOrder.map(id => ({
                id,
                name: game.getPlayerName(id),
                ready: game.readied.has(id)
            }));

            // Notify all players in room about new player
            io.to(availableRoomId).emit("playerJoined", {
                playerId: socket.id,
                playerCount: game.playerOrder.length,
                players
            });
        } else {
            // No available room, create a new one
            const roomId = generateRoomId();
            const game = new GameState();
            rooms.set(roomId, game);

            socket.join(roomId);
            playerRooms.set(socket.id, roomId);
            game.addPlayer(socket.id, playerName);

            socket.emit("roomCreated", { roomId });

            // Send player list to the creator
            const players = game.playerOrder.map(id => ({
                id,
                name: game.getPlayerName(id),
                ready: game.readied.has(id)
            }));
            socket.emit("playerJoined", {
                playerId: socket.id,
                playerCount: game.playerOrder.length,
                players
            });

            console.log(`Room ${roomId} created via quick join by ${playerName} (${socket.id})`);
        }
    });

    socket.on("requestRoomState", () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game) return;

        const players = game.playerOrder.map(id => ({
            id,
            name: game.getPlayerName(id),
            ready: game.readied.has(id)
        }));

        socket.emit("roomState", { players });
    });

    socket.on("ready", () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game) return;

        game.readied.add(socket.id);

        // Notify all players in room that this player is ready
        io.to(roomId).emit("playerReady", { playerId: socket.id, ready: true });

        if (game.everyoneReady() && !game.started) {
            game.startGame();

            // Build player card counts
            const playerCardCounts = game.playerOrder.map(id => ({
                id,
                name: game.getPlayerName(id),
                count: game.getCards(id).length
            }));

            // Get all sockets in this room
            io.in(roomId).fetchSockets().then(sockets => {
                sockets.forEach(clientSocket => {
                    if (clientSocket.id === game.playerOrder[0]) {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: [],
                            curPlayer: true,
                            currentPlayerId: game.curPlayer,
                            playerCardCounts
                        });
                    } else {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: [],
                            curPlayer: false,
                            currentPlayerId: game.curPlayer,
                            playerCardCounts
                        });
                    }
                });
            });
        }
    });

    socket.on("unready", () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game || game.started) return;

        game.readied.delete(socket.id);

        // Notify all players in room that this player is no longer ready
        io.to(roomId).emit("playerReady", { playerId: socket.id, ready: false });
    });

    socket.on("playMove", (data) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game) return;

        if (socket.id !== game.curPlayer) {
            socket.emit("invalidMove", { reason: "It's not your turn" });
            return;
        }

        if (!game.playMove(socket.id, data.selectedCards)) {
            socket.emit("invalidMove", { reason: "That's not a valid play" });
            return;
        }

        // Build player card counts
        const playerCardCounts = game.playerOrder.map(id => ({
            id,
            name: game.getPlayerName(id),
            count: game.getCards(id).length
        }));

        // Emit to all players in the room
        io.in(roomId).fetchSockets().then(sockets => {
            sockets.forEach(clientSocket => {
                if (clientSocket.id === game.curPlayer) {
                    clientSocket.emit("updateGameState", {
                        cards: game.getCards(clientSocket.id),
                        curMove: game.curMove,
                        curPlayer: true,
                        currentPlayerId: game.curPlayer,
                        playerCardCounts
                    });
                } else {
                    clientSocket.emit("updateGameState", {
                        cards: game.getCards(clientSocket.id),
                        curMove: game.curMove,
                        curPlayer: false,
                        currentPlayerId: game.curPlayer,
                        playerCardCounts
                    });
                }
            });
        });
        // Check if someone won
        if (game.winner) {
            io.to(roomId).emit("gameOver", { winner: game.winner });
            console.log(`Game over in room ${roomId}. Winner: ${game.winner}`);
            return;
        }

        console.log(`Play made in room ${roomId}. It is now ${game.curPlayer}'s turn`);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        const roomId = playerRooms.get(socket.id);
        if (roomId) {
            const game = rooms.get(roomId);
            if (game) {
                game.removePlayer(socket.id);
                
                // Notify other players
                io.to(roomId).emit("playerLeft", { playerId: socket.id });
                
                // Clean up empty rooms
                if (game.playerOrder.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty)`);
                }
            }
            playerRooms.delete(socket.id);
        }
    });
});

httpServer.listen(3000, () => {
    console.log("Server listening on port 3000");
});