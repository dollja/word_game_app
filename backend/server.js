
// Backend server code as given earlier
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
const PORT = 3000;

// In-memory game state
let gameState = {
  players: [],
  currentPrompt: "",
  gameLog: [],
};

// API route to generate the initial prompt
app.post("/api/generate-prompt", async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API key is required." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "Generate a starting word for a word association game." }],
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content || "Start with any word!";
    gameState.currentPrompt = prompt;
    res.json({ prompt });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate prompt." });
  }
});

// WebSocket connection handler
io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // Add new player to the game state
  socket.on("join-game", (playerName) => {
    gameState.players.push({ id: socket.id, name: playerName, score: 0 });
    io.emit("update-game-state", gameState);
  });

  // Handle word submission
  socket.on("submit-word", async (data) => {
    const { word, apiKey } = data;

    // Add word to game log
    gameState.gameLog.push(word);

    // Validate word association via OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Validate if the new word logically follows in a word association game." },
            { role: "user", content: `Previous word: ${gameState.currentPrompt}, New word: ${word}` },
          ],
          max_tokens: 30,
        }),
      });

      const responseData = await response.json();
      const isValid = responseData.choices?.[0]?.message?.content.includes("valid");

      if (isValid) {
        // Update the prompt and assign score
        gameState.currentPrompt = word;
        const player = gameState.players.find((p) => p.id === socket.id);
        if (player) player.score += 10;

        io.emit("update-game-state", gameState);
      } else {
        socket.emit("invalid-word", { message: "Invalid word association!" });
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    gameState.players = gameState.players.filter((p) => p.id !== socket.id);
    io.emit("update-game-state", gameState);
    console.log("A player disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
