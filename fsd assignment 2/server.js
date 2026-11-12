const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const waitingUsers = new Map();
const activeRooms = new Map();

app.use(express.static("public"));

function getSharedInterests(first, second) {
  return first.interests.filter((interest) => second.interests.includes(interest));
}

function findMatch(user) {
  let bestMatch = null;
  let bestShared = [];

  for (const [socketId, waitingUser] of waitingUsers.entries()) {
    if (socketId === user.id) continue;

    const shared = getSharedInterests(user, waitingUser);
    if (shared.length > bestShared.length) {
      bestMatch = waitingUser;
      bestShared = shared;
    }
  }

  return bestMatch ? { user: bestMatch, shared: bestShared } : null;
}

io.on("connection", (socket) => {
  socket.on("find-match", (interests) => {
    // Remove this user from any previous waiting state.
    waitingUsers.delete(socket.id);

    const cleanInterests = Array.isArray(interests)
      ? [...new Set(interests.filter((item) => typeof item === "string"))]
      : [];

    if (cleanInterests.length === 0) {
      socket.emit("match-error", "Please select at least one interest.");
      return;
    }

    const user = { id: socket.id, interests: cleanInterests };
    const match = findMatch(user);

    if (!match) {
      waitingUsers.set(socket.id, user);
      socket.emit("waiting");
      return;
    }

    waitingUsers.delete(match.user.id);

    const roomId = `room-${socket.id}-${match.user.id}`;
    socket.join(roomId);
    io.sockets.sockets.get(match.user.id)?.join(roomId);

    activeRooms.set(roomId, [socket.id, match.user.id]);

    socket.emit("matched", {
      roomId,
      sharedInterests: match.shared
    });

    io.to(match.user.id).emit("matched", {
      roomId,
      sharedInterests: match.shared
    });
  });

  socket.on("cancel-search", () => {
    waitingUsers.delete(socket.id);
  });

  socket.on("send-message", ({ roomId, message }) => {
    if (!activeRooms.has(roomId)) return;
    const members = activeRooms.get(roomId);
    if (!members.includes(socket.id)) return;

    const cleanMessage = String(message || "").trim().slice(0, 500);
    if (!cleanMessage) return;

    socket.to(roomId).emit("new-message", {
      message: cleanMessage,
      sender: "Stranger"
    });
    socket.emit("message-sent", {
      message: cleanMessage,
      sender: "You"
    });
  });

  socket.on("end-chat", (roomId) => {
    endRoom(roomId, socket.id);
  });

  socket.on("disconnect", () => {
    waitingUsers.delete(socket.id);

    for (const [roomId, members] of activeRooms.entries()) {
      if (members.includes(socket.id)) {
        endRoom(roomId, socket.id);
      }
    }
  });

  function endRoom(roomId, endingSocketId) {
    const members = activeRooms.get(roomId);
    if (!members || !members.includes(endingSocketId)) return;

    activeRooms.delete(roomId);

    for (const memberId of members) {
      io.sockets.sockets.get(memberId)?.leave(roomId);
      if (memberId !== endingSocketId) {
        io.to(memberId).emit("chat-ended");
      }
    }

    socket.emit("chat-ended");
  }
});

server.listen(PORT, () => {
  console.log(`AfterHours is running at http://localhost:${PORT}`);
});
