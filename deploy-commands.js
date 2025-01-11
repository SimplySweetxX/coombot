const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const { loadCommands } = require("./utils/commandHandler");

const commandsMap = loadCommands();
const commands = Array.from(commandsMap.values()).map(
  (command) => command.data
);

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    const registeredCommands = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("Successfully reloaded application (/) commands:");
    registeredCommands.forEach((command) => {
      console.log(`- ${command.name}`);
    });
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();
