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
    socket.on("createRoom", () => {
        const roomId = generateRoomId();
        const game = new GameState();
        rooms.set(roomId, game);

        socket.join(roomId);
        playerRooms.set(socket.id, roomId);
        game.addPlayer(socket.id);

        socket.emit("roomCreated", { roomId });

        // Send player list to the creator
        const players = game.playerOrder.map(id => ({
            id,
            ready: game.readied.has(id)
        }));
        socket.emit("playerJoined", {
            playerId: socket.id,
            playerCount: game.playerOrder.length,
            players
        });

        console.log(`Room ${roomId} created by ${socket.id}`);
    });

    // Join an existing room
    socket.on("joinRoom", (data: { roomId: string }) => {
        const { roomId } = data;
        const game = rooms.get(roomId);

        if (!game) {
            socket.emit("invalidJoin", { reason: "Room does not exist" });
            return;
        }

        if (game.addPlayer(socket.id)) {
            socket.join(roomId);
            playerRooms.set(socket.id, roomId);
            console.log(`Player ${socket.id} joined room ${roomId}`);

            // Build players list with ready states
            const players = game.playerOrder.map(id => ({
                id,
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

    socket.on("requestRoomState", () => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game) return;

        const players = game.playerOrder.map(id => ({
            id,
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
        io.to(roomId).emit("playerReady", { playerId: socket.id });

        if (game.everyoneReady() && !game.started) {
            game.startGame();
            
            // Get all sockets in this room
            io.in(roomId).fetchSockets().then(sockets => {
                sockets.forEach(clientSocket => {
                    if (clientSocket.id === game.playerOrder[0]) {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: [],
                            curPlayer: true
                        });
                    } else {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: [],
                            curPlayer: false
                        });
                    }
                });
            });
        }
    });

    socket.on("playMove", (data) => {
        const roomId = playerRooms.get(socket.id);
        if (!roomId) return;

        const game = rooms.get(roomId);
        if (!game) return;

        if (socket.id === game.curPlayer && game.playMove(socket.id, data.selectedCards)) {
            // Emit to all players in the room
            io.in(roomId).fetchSockets().then(sockets => {
                sockets.forEach(clientSocket => {
                    if (clientSocket.id === game.curPlayer) {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: game.curMove,
                            curPlayer: true
                        });
                    } else {
                        clientSocket.emit("updateGameState", {
                            cards: game.getCards(clientSocket.id),
                            curMove: game.curMove,
                            curPlayer: false
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
        }
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