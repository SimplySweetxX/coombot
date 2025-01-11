const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const leaderboardPath = path.join(
  __dirname,
  "../data/tictactoeLeaderboard.json"
);

// Load the leaderboard from the JSON file
let leaderboard = {};
if (fs.existsSync(leaderboardPath)) {
  leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, "utf8"));
} else {
  leaderboard = {};
}

// Function to update leaderboard data
const updateLeaderboard = (userId, result) => {
  if (!leaderboard[userId]) {
    leaderboard[userId] = { wins: 0, losses: 0, ties: 0 };
  }

  if (result === "win") {
    leaderboard[userId].wins += 1;
  } else if (result === "loss") {
    leaderboard[userId].losses += 1;
  } else if (result === "tie") {
    leaderboard[userId].ties += 1;
  }

  // Save the updated leaderboard to the file
  fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Play Tic-Tac-Toe!")
    .addStringOption((option) =>
      option
        .setName("opponent")
        .setDescription("Choose your opponent")
        .setRequired(true)
        .addChoices(
          { name: "Play against another player", value: "player" },
          { name: "Play against the bot", value: "bot" }
        )
    ),

  async execute(interaction) {
    const opponent = interaction.options.getString("opponent");
    const players = {
      X: interaction.user.id, // User always starts as X
      O: null, // Player O joins later in Player vs Player mode
    };

    let currentPlayer = "X"; // X always starts
    let gameState = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];

    // Function to randomize which player goes first
    const randomizeFirstPlayer = () => {
      if (Math.random() < 0.5) {
        currentPlayer = "X";
      } else {
        currentPlayer = "O";
      }
    };

    // Function to check for a winner or tie
    const checkWinner = (board) => {
      const winningLines = [
        [board[0][0], board[0][1], board[0][2]], // Row 1
        [board[1][0], board[1][1], board[1][2]], // Row 2
        [board[2][0], board[2][1], board[2][2]], // Row 3
        [board[0][0], board[1][0], board[2][0]], // Column 1
        [board[0][1], board[1][1], board[2][1]], // Column 2
        [board[0][2], board[1][2], board[2][2]], // Column 3
        [board[0][0], board[1][1], board[2][2]], // Diagonal 1
        [board[2][0], board[1][1], board[0][2]], // Diagonal 2
      ];

      for (const line of winningLines) {
        if (line[0] && line[0] === line[1] && line[1] === line[2]) {
          return line[0]; // Return 'X' or 'O' (winner)
        }
      }

      // Check if the board is full (tie)
      if (board.every((row) => row.every((cell) => cell !== ""))) {
        return "tie";
      }

      return null; // No winner yet
    };

    // Function to create the Tic-Tac-Toe board with emoji labels
    const createBoard = () => {
      return gameState.map((row, rowIndex) => {
        const buttons = row.map((cell, colIndex) => {
          const customId = `${rowIndex}-${colIndex}`;
          let label = "🔳";
          if (cell === "X") label = "❌"; // Use the "X" emoji
          else if (cell === "O") label = "⭕"; // Use the "O" emoji

          return new ButtonBuilder()
            .setCustomId(customId)
            .setLabel(label) // '❌', '⭕', or 🔳 for empty
            .setStyle(cell ? ButtonStyle.Secondary : ButtonStyle.Primary) // Disable buttons with X/O
            .setDisabled(!!cell); // Disable if the cell is already taken
        });

        return new ActionRowBuilder().addComponents(...buttons);
      });
    };

    // Bot makes a random move
    const botMove = () => {
      let emptyCells = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (gameState[row][col] === "") {
            emptyCells.push([row, col]);
          }
        }
      }

      // Randomly choose an empty cell
      if (emptyCells.length > 0) {
        const [row, col] =
          emptyCells[Math.floor(Math.random() * emptyCells.length)];
        gameState[row][col] = "O"; // Bot is always 'O'
      }
    };

    // Send the initial message with a Join button for player vs player
    if (opponent === "player") {
      randomizeFirstPlayer(); // Randomize who goes first in player vs player
      const joinButton = new ButtonBuilder()
        .setCustomId("join")
        .setLabel("Join as Player O")
        .setStyle(ButtonStyle.Primary);

      await interaction.reply({
        content: `Tic-Tac-Toe! Waiting for a second player to join. ${
          currentPlayer === "X" ? "❌" : "⭕"
        } goes first!`,
        components: [new ActionRowBuilder().addComponents(joinButton)],
      });
    } else {
      await interaction.reply({
        content: `Tic-Tac-Toe! You are playing against the bot.`,
        components: createBoard(),
      });
    }

    // Set up a collector to handle button clicks
    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // 1 minute to complete the game
    });

    collector.on("collect", async (i) => {
      if (
        i.customId === "join" &&
        players.O === null &&
        opponent === "player"
      ) {
        // Assign player O
        players.O = i.user.id;
        await interaction.editReply({
          content: `Second player joined! ${i.user.username} is Player O.`,
          components: createBoard(),
        });
        return;
      }

      const [row, col] = i.customId.split("-").map(Number);

      // Ensure only the two players can interact
      if (i.user.id !== players[currentPlayer]) {
        await i.reply({
          content: `It's not your turn or you aren't a player!`,
          ephemeral: true,
        });
        return;
      }

      // Mark the board with the player's symbol
      gameState[row][col] = currentPlayer;

      // Check for a winner or tie
      let winner = checkWinner(gameState);
      if (winner) {
        collector.stop(); // Stop collecting moves
        let resultMessage =
          winner === "tie"
            ? `It's a tie!`
            : `${winner === "X" ? "❌" : "⭕"} wins! 🎉`;

        // Save the result to the leaderboard
        if (winner !== "tie") {
          if (winner === "X") {
            updateLeaderboard(players.X, "win");
            if (opponent === "player") {
              updateLeaderboard(players.O, "loss");
            } else {
              updateLeaderboard("bot", "loss");
            }
          } else if (winner === "O") {
            if (opponent === "player") {
              updateLeaderboard(players.O, "win");
              updateLeaderboard(players.X, "loss");
            } else {
              updateLeaderboard(players.X, "loss");
              updateLeaderboard("bot", "win");
            }
          }
        } else {
          updateLeaderboard(players.X, "tie");
          if (opponent === "player") {
            updateLeaderboard(players.O, "tie");
          } else {
            updateLeaderboard("bot", "tie");
          }
        }

        // Disable the board after the game ends
        await i.update({
          content: resultMessage,
          components: createBoard(),
        });
        return;
      }

      // Switch to the other player
      currentPlayer = currentPlayer === "X" ? "O" : "X";

      // If playing against the bot, make the bot move
      if (opponent === "bot" && currentPlayer === "O") {
        botMove(); // Bot makes its move
        winner = checkWinner(gameState);
        if (winner) {
          collector.stop(); // Stop collecting moves
          let resultMessage =
            winner === "tie"
              ? `It's a tie!`
              : `${winner === "X" ? "❌" : "⭕"} wins! 🎉`;

          // Save the result to the leaderboard
          if (winner === "X") {
            updateLeaderboard(players.X, "win");
            updateLeaderboard("bot", "loss");
          } else if (winner === "O") {
            updateLeaderboard("bot", "win");
            updateLeaderboard(players.X, "loss");
          } else {
            updateLeaderboard(players.X, "tie");
            updateLeaderboard("bot", "tie");
          }

          // Disable the board after the game ends
          await i.update({
            content: resultMessage,
            components: createBoard(),
          });
          return;
        }

        currentPlayer = "X"; // Switch back to the player
      }

      // Update the board for the next turn
      await i.update({
        content: `It's ${currentPlayer === "X" ? "❌" : "⭕"} turn.`,
        components: createBoard(),
      });
    });

    // If the game times out, disable the board
    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: `Game timed out!`,
          components: [],
        });
      }
    });
  },
};
