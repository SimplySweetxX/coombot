const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { loadCommands } = require("./utils/commandHandler");
const { handleMediaMessage } = require("./modules/mediaTracker");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load commands into a collection
client.commands = loadCommands();

// Event listener for when the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log("Available commands:");
  client.commands.forEach((value, key) => {
    console.log(`- ${key}`);
  });
});

// Listen for new messages
client.on("messageCreate", handleMediaMessage);

// Event listener for interactions (slash commands)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  console.log(`Received command: ${interaction.commandName}`);

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`Command not found: ${interaction.commandName}`);
    await interaction.reply({ content: "Command not found.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`Command executed: ${interaction.commandName}`);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    await interaction.reply({
      content: "There was an error executing that command!",
      ephemeral: true,
    });
  }
});

// Set up a keep-alive mechanism by pinging Discord's API
setInterval(() => {
  console.log("Sending keep-alive API request...");
  client.user
    .fetch() // Fetch the bot's own user object
    .then(() => console.log("Keep-alive successful"))
    .catch(console.error);

  // Log WebSocket ping
  console.log(`WebSocket ping: ${client.ws.ping}ms`);
}, 60 * 1000); // Runs every 30 minutes

// Log in to Discord with your app's token
client.login(token);
