const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: {
    name: "topcoomer",
    description: "Displays the top 10 coomers with the most porn posts",
  },
  async execute(interaction) {
    try {
      // Load media counts from JSON
      const mediaCountsPath = path.join(__dirname, "../data/mediaCounts.json");

      if (!fs.existsSync(mediaCountsPath)) {
        console.error(`File not found: ${mediaCountsPath}`);
        await interaction.reply("Media counts data file not found.");
        return;
      }

      let mediaCounts;
      try {
        const rawData = fs.readFileSync(mediaCountsPath, "utf-8");
        mediaCounts = JSON.parse(rawData);
      } catch (error) {
        console.error("Failed to read or parse mediaCounts.json:", error);
        await interaction.reply(
          "Failed to load media counts. Please try again later."
        );
        return;
      }

      // Sort users by count and get the top 10
      const sortedUsers = Object.entries(mediaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (sortedUsers.length === 0) {
        await interaction.reply("No media posts have been recorded yet.");
        return;
      }

      // Create the embed message
      const embed = new EmbedBuilder()
        .setTitle(":sweat_drops: Top Coomers :sweat_drops:")
        .setColor("#FF10F0");

      // Fetch the usernames without pinging
      for (const [index, [userId, count]] of sortedUsers.entries()) {
        try {
          const user = await interaction.client.users.fetch(userId);
          const rankEmoji = [
            "🥇",
            "🥈",
            "🥉",
            "🏅",
            "🏅",
            "🏅",
            "🏅",
            "🏅",
            "🏅",
            "🏅",
          ][index];
          const formattedUsername = `<@${userId}>`;
          embed.addFields({
            name: "\u200B", // Zero-width space
            value: `${rankEmoji} - ${formattedUsername}: ${count} Loads`,
          });
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          embed.addFields({
            name: "\u200B", // Zero-width space
            value: `${rankEmoji} - [Unknown User]: ${count} Loads`,
          });
        }
      }

      // Send the embed as a reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(
        "An error occurred while executing the topmedia command:",
        error
      );
      try {
        await interaction.reply(
          "There was an error fetching the top users. Please try again later!"
        );
      } catch (err) {
        console.error("Failed to send error reply to interaction:", err);
      }
    }
  },
};
