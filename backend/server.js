const httpServer = require("http").createServer();
// Initialisation du socket.io et autorisation de l'origine
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
});
// Middleware pour vérifier le nom d'utilisateur
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

// socket connection
io.on("connection", (socket) => {
  // recherche des utilisateurs connectés
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
  }
  // envoi de la liste des utilisateurs connectés à tous les utilisateurs
  socket.emit("users", users);

  // notification de la connexion d'un nouvel utilisateur
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  // envoi de messages privés a un utilisateur
  socket.on("private message", ({ content, to }) => {
    socket.to(to).emit("private message", {
      content,
      from: socket.id,
    });
  });

  // notifié la déconnexion d'un utilisateur
  socket.on("disconnect", () => {
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

//Définition du port d'écoute
const PORT = process.env.PORT || 3000;

//Démarrage du serveur
httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
