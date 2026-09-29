import { io, type Socket } from 'socket.io-client';

// Frontend and backend are served from the same Express port (custom
// server in server/index.js embeds Next.js), so same-origin is correct by
// default. Override only for a standalone `next dev` pointed at a
// separately-running backend.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

let notesSocket: Socket | null = null;
let gameSocket: Socket | null = null;

export function getNotesSocket(): Socket {
  if (!notesSocket) notesSocket = io(`${SOCKET_URL}/notes`);
  return notesSocket;
}

export function getGameSocket(): Socket {
  if (!gameSocket) gameSocket = io(`${SOCKET_URL}/game`);
  return gameSocket;
}
