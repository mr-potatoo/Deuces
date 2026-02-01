import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";

interface JoinRoomPageProps {
  socket: Socket;
}

export default function JoinRoomPage({ socket }: JoinRoomPageProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsJoining(true);
    setError("");

    // Listen for room creation
    socket.once("roomCreated", ({ roomId }) => {
      console.log(`Room created: ${roomId}`);
      // Store player name in localStorage or pass via navigation state
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("roomId", roomId);
      navigate(`/game/${roomId}`);
    });

    socket.emit("createRoom");
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setError("");

    // Listen for join result
    socket.once("playerJoined", () => {
      console.log(`Joined room: ${roomCode}`);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("roomId", roomCode);
      navigate(`/game/${roomCode}`);
    });

    socket.once("invalidJoin", ({ reason }) => {
      setError(reason || "Unable to join room");
      setIsJoining(false);
    });

    socket.emit("joinRoom", { roomId: roomCode.toUpperCase() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Card Game
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter your name to start playing
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Player Name Input */}
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={isJoining}
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isJoining}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isJoining ? "Creating..." : "Create New Room"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Room Code Input */}
          <div>
            <label
              htmlFor="roomCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="ABCDEF"
              maxLength={6}
              disabled={isJoining}
              className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition uppercase font-mono text-center text-lg tracking-wider disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Join Room Button */}
          <button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Create a room and share the code with your
            friends, or enter a code to join an existing game. Up to 4 players
            per room!
          </p>
        </div>
      </div>
    </div>
  );
}