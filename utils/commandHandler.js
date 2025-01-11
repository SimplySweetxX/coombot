// utils/commandHandler.js
const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commands = new Map();
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  }

  return commands;
}

module.exports = { loadCommands };
