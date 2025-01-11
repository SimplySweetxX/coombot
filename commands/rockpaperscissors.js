const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const leaderboardPath = path.join(__dirname, "../data/rpsLeaderboard.json");

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

// Function to get the emoji for a choice
const getEmoji = (choice) => {
  const emojiMap = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️",
  };
  return emojiMap[choice];
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play Rock-Paper-Scissors!")
    .addUserOption((option) =>
      option
        .setName("opponent")
        .setDescription(
          "Choose an opponent (leave blank to play against the bot)"
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    const player1Id = interaction.user.id;
    const opponent = interaction.options.getUser("opponent");
    let player2Id = null;
    let opponentName = "the bot";

    // If an opponent is specified and is not the bot, it's a player vs. player game
    if (opponent && opponent.id !== interaction.client.user.id) {
      player2Id = opponent.id;
      opponentName = `<@${player2Id}>`;
    }

    // Create buttons for Rock, Paper, and Scissors
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rock")
        .setLabel("🪨 Rock")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("paper")
        .setLabel("📄 Paper")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("scissors")
        .setLabel("✂️ Scissors")
        .setStyle(ButtonStyle.Primary)
    );

    // Send the initial message with the buttons
    await interaction.reply({
      content:
        opponent && opponent.id !== interaction.client.user.id
          ? `You are playing against ${opponentName}. Both players, make your move!`
          : "You are playing against the bot. Make your move!",
      components: [row],
    });

    let player1Choice = null;
    let player2Choice = null;
    const choices = ["rock", "paper", "scissors"];

    // Bot makes a random move if playing against the bot
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    // Set up a collector to handle button clicks
    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000, // 15 seconds to make a move
    });

    collector.on("collect", async (i) => {
      if (i.user.id === player1Id) {
        if (player1Choice) {
          await i.reply({
            content: "You've already made your move!",
            ephemeral: true,
          });
          return;
        }
        player1Choice = i.customId;
        await i.reply({
          content: `You chose ${getEmoji(
            player1Choice
          )}. Waiting for the opponent...`,
          ephemeral: true,
        });
      } else if (player2Id && i.user.id === player2Id) {
        if (player2Choice) {
          await i.reply({
            content: "You've already made your move!",
            ephemeral: true,
          });
          return;
        }
        player2Choice = i.customId;
        await i.reply({
          content: `You chose ${getEmoji(
            player2Choice
          )}. Waiting for the opponent...`,
          ephemeral: true,
        });
      } else {
        await i.reply({
          content: "You are not part of this game!",
          ephemeral: true,
        });
        return;
      }

      // If playing against the bot, determine the result immediately after player1 chooses
      if (!player2Id && player1Choice) {
        collector.stop(); // Stop collecting moves
        let result = "";
        if (player1Choice === botChoice) {
          result = "It's a tie!";
          updateLeaderboard(player1Id, "tie");
        } else if (
          (player1Choice === "rock" && botChoice === "scissors") ||
          (player1Choice === "paper" && botChoice === "rock") ||
          (player1Choice === "scissors" && botChoice === "paper")
        ) {
          result = `You win! I chose ${getEmoji(botChoice)}.`;
          updateLeaderboard(player1Id, "win");
        } else {
          result = `You lose! I chose ${getEmoji(botChoice)}.`;
          updateLeaderboard(player1Id, "loss");
        }

        // Disable buttons and show result
        await interaction.editReply({
          content: `You chose ${getEmoji(player1Choice)}, I chose ${getEmoji(
            botChoice
          )}. \n ${result}`,
          components: [],
        });
      }

      // In PvP, check if both players have made their moves
      if (player1Choice && player2Choice) {
        collector.stop(); // Stop collecting moves

        let result = "";
        if (player1Choice === player2Choice) {
          result = "It's a tie!";
          updateLeaderboard(player1Id, "tie");
          updateLeaderboard(player2Id, "tie");
        } else if (
          (player1Choice === "rock" && player2Choice === "scissors") ||
          (player1Choice === "paper" && player2Choice === "rock") ||
          (player1Choice === "scissors" && player2Choice === "paper")
        ) {
          result = `<@${player1Id}> wins!`;
          updateLeaderboard(player1Id, "win");
          updateLeaderboard(player2Id, "loss");
        } else {
          result = `<@${player2Id}> wins!`;
          updateLeaderboard(player2Id, "win");
          updateLeaderboard(player1Id, "loss");
        }

        // Disable buttons and show result
        await interaction.editReply({
          content: `Player 1 (${interaction.user.username}) chose ${getEmoji(
            player1Choice
          )}, and Player 2 (${opponent.username}) chose ${getEmoji(
            player2Choice
          )}. \n ${result}`,
          components: [],
        });
      }
    });

    // If the game times out, disable the buttons
    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: "No moves were made in time. Game over!",
          components: [],
        });
      }
    });
  },
};
