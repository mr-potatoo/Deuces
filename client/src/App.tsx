import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../../typings";
import { Routes, Route } from 'react-router-dom'
import JoinRoomPage from './JoinRoomPage.tsx'
import Game from "./GamePage.tsx";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000", {
  withCredentials: true
});

// socket.io.on("reconnect", (attempt) => {
//   console.info("Reconnected on attempt: " + attempt);
// });

// socket.io.on("reconnect_attempt", (attempt) => {
//   console.info("Reconnection attempt: " + attempt);
// });

// socket.io.on("reconnect_error", (error) => {
//   console.info("Reconnection error: " + error);
// });

// socket.io.on("reconnect_failed", () => {
//   console.info("Reconnection failed");
//   alert("We are unable to connect you to the web socket.");
// });

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoomPage socket={socket} />} />
      <Route path="/game/:roomId" element={<Game socket={socket} />} />
    </Routes>
  )
}

export default App