const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./env");
const Message = require("../modules/chat/message.model");
const Conversation = require("../modules/chat/conversation.model");

let io;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === "admin") {
      socket.join("admin:monitor");
    }

    socket.on("chat:send", async (data, callback) => {
      try {
        const { conversationId, text } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          return callback && callback({ error: "Forbidden or not found" });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text,
        });

        conversation.lastMessage = {
          text,
          sender: socket.userId,
          sentAt: message.createdAt,
        };
        await conversation.save();

        const messageData = {
          id: message._id.toString(),
          conversationId: message.conversation.toString(),
          sender: message.sender.toString(),
          text: message.text,
          createdAt: message.createdAt.toISOString(),
          readAt: null,
        };

        // Broadcast to all participants (including sender to update other devices)
        conversation.participants.forEach((participantId) => {
          io.to(`user:${participantId.toString()}`).emit("chat:receive", messageData);
        });
        io.to("admin:monitor").emit("chat:receive", messageData);

        if (callback) callback({ success: true, message: messageData });
      } catch (err) {
        if (callback) callback({ error: "Internal error" });
      }
    });

    socket.on("chat:typing", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.includes(socket.userId)) {
          const otherParticipants = conversation.participants.filter(
            (p) => p.toString() !== socket.userId
          );
          otherParticipants.forEach((p) => {
            io.to(`user:${p.toString()}`).emit("chat:typing", {
              conversationId,
              userId: socket.userId,
            });
          });
        }
      } catch (err) {
        // ignore
      }
    });

    socket.on("chat:read", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await Conversation.findById(conversationId);
        
        if (conversation && conversation.participants.includes(socket.userId)) {
          const readAt = new Date();
          await Message.updateMany(
            { conversation: conversationId, sender: { $ne: socket.userId }, readAt: null },
            { $set: { readAt } }
          );
          
          const otherParticipants = conversation.participants.filter(
            (p) => p.toString() !== socket.userId
          );
          otherParticipants.forEach((p) => {
            io.to(`user:${p.toString()}`).emit("chat:read", {
              conversationId,
              readAt: readAt.toISOString(),
            });
          });
        }
      } catch (err) {
        // ignore
      }
    });

    socket.on("disconnect", () => {
      // automatically handled
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocketServer, getIo };
