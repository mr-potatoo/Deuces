import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../../typings";
import { Routes, Route } from 'react-router-dom'
import JoinRoomPage from './JoinRoomPage.tsx'
import Game from "./GamePage.tsx";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000", {
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