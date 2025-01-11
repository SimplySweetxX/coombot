const fs = require("fs");
const path = require("path");
const { updateRoles } = require("../modules/mediaTracker");

module.exports = {
  data: {
    name: "updateroles",
    description:
      "Manually update roles for all users based on their media counts",
  },
  async execute(interaction) {
    try {
      // Check if the user has the necessary permissions (e.g., developer role)
      const DEV_CHANNEL_ID = "1257156928912625787";
      if (interaction.channelId !== DEV_CHANNEL_ID) {
        await interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }

      // Load media counts from JSON
      const mediaCountsPath = path.join(__dirname, "../data/mediaCounts.json");
      let mediaCounts;
      try {
        const rawData = fs.readFileSync(mediaCountsPath, "utf-8");
        mediaCounts = JSON.parse(rawData);
      } catch (error) {
        console.error("Failed to read or parse mediaCounts.json:", error);
        await interaction.reply({
          content: "Failed to load media counts. Please try again later.",
          ephemeral: true,
        });
        return;
      }

      // Iterate through all users and update their roles
      const guild = interaction.guild;
      for (const [userId, mediaCount] of Object.entries(mediaCounts)) {
        try {
          const member = await guild.members.fetch(userId);
          await updateRoles(member, mediaCount);
          console.log(`Updated roles for user ${userId}`);
        } catch (error) {
          console.error(`Failed to update roles for user ${userId}:`, error);
        }
      }

      await interaction.reply({
        content: "Roles have been updated for all users.",
        ephemeral: true,
      });
    } catch (error) {
      console.error("An error occurred while updating roles:", error);
      await interaction.reply({
        content:
          "An error occurred while updating roles. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
