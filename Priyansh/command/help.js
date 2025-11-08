const { commands } = global.client;

module.exports.config = {
  name: "help",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "Converted by Aria (Original: Priyanshi Kaur)",
  description: "View available commands with details and pagination",
  commandCategory: "system",
  usages: "[page | all | command name]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const prefix = (global.config.PREFIX || "!");

  // Filter commands by role/permission
  const availableCommands = Array.from(commands.values())
    .filter(cmd => !cmd.config.hasPermssion || cmd.config.hasPermssion <= 0);

  // If specific command info requested
  if (args.length === 1 && isNaN(args[0]) && args[0] !== "all") {
    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName);

    if (!command) {
      return api.sendMessage(`❌ Command '${commandName}' not found.`, threadID, messageID);
    }

    const cmdConfig = command.config;
    const description = cmdConfig.description || "No description available";
    const usages = cmdConfig.usages || "No usage guide available";

    let msg = "╭── COMMAND INFO ────⭓\n";
    msg += `│ 📝 Name: ${cmdConfig.name}\n`;
    msg += `│ 📚 Description: ${description}\n`;
    msg += `│ 🔧 Version: ${cmdConfig.version || "1.0"}\n`;
    msg += `│ 👑 Role: ${cmdConfig.hasPermssion}\n`;
    msg += `│ ⏰ Cooldown: ${cmdConfig.cooldowns || 0}s\n`;
    msg += `│ ✍️ Author: ${cmdConfig.credits}\n`;
    msg += "├── USAGE ────⭔\n";
    msg += `${prefix}${cmdConfig.name} ${usages}\n`;
    msg += "╰──────────⭓";

    return api.sendMessage(msg, threadID, messageID);
  }

  // If list of all commands requested
  if (args[0] === "all") {
    const commandList = availableCommands.map(cmd => cmd.config.name).join(", ");
    return api.sendMessage(
      `📜 All available commands:\n${commandList}\n\n📦 Total commands: ${availableCommands.length}`,
      threadID,
      messageID
    );
  }

  // Pagination
  const commandsPerPage = 10;
  const page = parseInt(args[0]) || 1;
  const totalPages = Math.ceil(availableCommands.length / commandsPerPage);

  if (page < 1 || page > totalPages) {
    return api.sendMessage(`❌ Invalid page number. Total pages: ${totalPages}`, threadID, messageID);
  }

  const startIndex = (page - 1) * commandsPerPage;
  const pageCommands = availableCommands.slice(startIndex, startIndex + commandsPerPage);

  let msg = "╭─── COMMANDS ───";
  pageCommands.forEach(cmd => {
    const description = cmd.config.description || "No description available";
    msg += `\n│ ○ ${cmd.config.name} - ${description}`;
  });

  msg += `\n╰───────────────\n👤 Requested by: ${event.senderID}\n📖 Page: (${page}/${totalPages})\n📦 Total commands: ${availableCommands.length}`;

  return api.sendMessage(msg, threadID, messageID);
};
