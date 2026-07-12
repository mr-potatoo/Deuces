import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "shared";
import { Routes, Route } from 'react-router-dom'
import JoinRoomPage from './JoinRoomPage.tsx'
import Game from "./GamePage.tsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  withCredentials: true
});

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoomPage socket={socket} />} />
      <Route path="/game/:roomId" element={<Game socket={socket} />} />
    </Routes>
  )
}

export default App