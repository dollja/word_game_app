const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (Backend)
const serviceAccount = require("./word-game-fc90d-firebase-adminsdk-fbsvc-457781f2ce.json"); // Download from Firebase Console
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(bodyParser.json());
const PORT = 3000;

let gameState = { players: [], currentPrompt: "", gameLog: [] };

// Load game state from Firestore on startup
async function loadGameState() {
  const gameRef = db.collection("game").doc("currentState");
  const doc = await gameRef.get();
  if (doc.exists) {
    gameState = doc.data();
    console.log("Loaded game state from Firebase.");
  }
}
loadGameState();

// Generate a prompt using OpenAI
app.post("/api/generate-prompt", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: "API key is required." });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "Generate a starting word for a word association game." }],
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    gameState.currentPrompt = data.choices?.[0]?.message?.content || "Start with any word!";

    // Update Firestore
    await db.collection("game").doc("currentState").set(gameState);
    res.json({ prompt: gameState.currentPrompt });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate prompt." });
  }
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-game", async (playerName) => {
    const player = { id: socket.id, name: playerName, score: 0 };
    gameState.players.push(player);

    // Update Firestore
    await db.collection("players").doc(socket.id).set(player);
    await db.collection("game").doc("currentState").set(gameState);

    io.emit("update-game-state", gameState);
  });

  socket.on("submit-word", async ({ word, apiKey }) => {
    gameState.gameLog.push(word);

    // Validate word association via OpenAI
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: `Does the word '${word}' logically follow '${gameState.currentPrompt}'?` }],
          max_tokens: 30,
        }),
      });

      const data = await response.json();
      const isValid = data.choices?.[0]?.message?.content.includes("valid");

      if (isValid) {
        gameState.currentPrompt = word;
        const player = gameState.players.find((p) => p.id === socket.id);
        if (player) {
          player.score += 10;
          await db.collection("players").doc(socket.id).update({ score: player.score });
        }

        // Update Firestore
        await db.collection("game").doc("currentState").set(gameState);
        io.emit("update-game-state", gameState);
      } else {
        socket.emit("invalid-word", { message: "Invalid word association!" });
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  });

  socket.on("disconnect", async () => {
    gameState.players = gameState.players.filter((p) => p.id !== socket.id);
    await db.collection("players").doc(socket.id).delete();
    await db.collection("game").doc("currentState").set(gameState);
    io.emit("update-game-state", gameState);
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
