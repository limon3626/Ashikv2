const { commands } = global.client;

module.exports.config = {
  name: "help",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Modified by ChatGPT (Original: Priyanshi Kaur)",
  description: "Show all commands at once",
  commandCategory: "system",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const prefix = (global.config.PREFIX || "!");

  // Get all commands with permission check
  const availableCommands = Array.from(commands.values())
    .filter(cmd => !cmd.config.hasPermssion || cmd.config.hasPermssion <= 0);

  let msg = "╭── 📜 ALL COMMANDS ───⭓\n";

  availableCommands.forEach(cmd => {
    const desc = cmd.config.description || "No description available";
    msg += `│ • ${cmd.config.name} — ${desc}\n`;
  });

  msg += `╰────────────────────⭓\n📦 Total Commands: ${availableCommands.length}`;

  return api.sendMessage(msg, threadID, messageID);
};
