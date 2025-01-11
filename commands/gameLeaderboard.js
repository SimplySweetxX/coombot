const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gameleaderboard")
    .setDescription("View the leaderboard for a specific game")
    .addStringOption((option) =>
      option
        .setName("game")
        .setDescription("Choose the game to view the leaderboard")
        .setRequired(true)
        .addChoices(
          { name: "Rock-Paper-Scissors", value: "rps" },
          { name: "Tic-Tac-Toe", value: "tictactoe" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("sort_by")
        .setDescription("Sort the leaderboard by wins, losses, or ties")
        .setRequired(false)
        .addChoices(
          { name: "Wins", value: "wins" },
          { name: "Losses", value: "losses" },
          { name: "Ties", value: "ties" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("Limit the number of players displayed")
        .setRequired(false)
    ),

  async execute(interaction) {
    const game = interaction.options.getString("game");
    const sortBy = interaction.options.getString("sort_by") || "wins"; // Default to wins if no option is chosen
    const limit = interaction.options.getInteger("limit") || 10; // Default to top 10 players

    let leaderboardPath;
    let gameName;

    // Determine the file path and game name based on the user's choice
    if (game === "rps") {
      leaderboardPath = path.join(__dirname, "../data/rpsLeaderboard.json");
      gameName = "Rock-Paper-Scissors";
    } else if (game === "tictactoe") {
      leaderboardPath = path.join(
        __dirname,
        "../data/tictactoeLeaderboard.json"
      );
      gameName = "Tic-Tac-Toe";
    }

    // Load the leaderboard data from the appropriate file
    let leaderboard;
    if (fs.existsSync(leaderboardPath)) {
      leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, "utf8"));
    } else {
      await interaction.reply(`No leaderboard data available for ${gameName}.`);
      return;
    }

    // Sort leaderboard by the chosen criteria (wins, losses, or ties)
    const sortedLeaderboard = Object.entries(leaderboard).sort(
      ([, statsA], [, statsB]) => statsB[sortBy] - statsA[sortBy]
    );

    // Create the embed for the leaderboard
    const leaderboardEmbed = new EmbedBuilder()
      .setTitle(`${gameName} Leaderboard (Sorted by ${sortBy})`)
      .setColor(0x00ae86) // You can choose any color you prefer
      .setTimestamp();

    // Add fields to the embed for each player
    sortedLeaderboard.slice(0, limit).forEach(([userId, stats], index) => {
      leaderboardEmbed.addFields({
        name: `#${index + 1}: <@${userId}>`,
        value: `Wins: ${stats.wins}, Losses: ${stats.losses}, Ties: ${stats.ties}`,
        inline: true, // Keeps the fields in a compact layout
      });
    });

    // Send the embed to the channel
    await interaction.reply({ embeds: [leaderboardEmbed] });
  },
};
