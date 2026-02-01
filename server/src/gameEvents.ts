import { Socket } from "socket.io";
import { getMoveInfo, checkValidMove } from "./gameLogic";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../typings";

export default function gameEvents(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  socket.on("playMove", (data) => {
    
  });
}