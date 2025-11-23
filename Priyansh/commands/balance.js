const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "balance",
  aliases: ["bal", "$", "cash"],
  version: "3.2",
  author: "xnil6x (Fixed by ChatGPT)",
  countDown: 3,
  role: 0,
  description: "Economy balance system with auto-save",
  category: "economy",
  guide: {
    en: "{pn} → Check your balance\n"
       + "{pn} @user → Check another user\n"
       + "{pn} t @user amount → Transfer money\n"
       + "{pn} (reply) → Check replied user's balance"
  }
};

// JSON file
const dataFolder = path.join(__dirname, "../../data");
const dataFile = path.join(dataFolder, "balance.json");

// Ensure folder + file exists
function loadDB() {
  if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

  return JSON.parse(fs.readFileSync(dataFile));
}

function saveDB(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Money Format
function formatMoney(amount) {
  amount = Number(amount);
  if (isNaN(amount)) return "$0";

  const units = [
    { v: 1e15, s: "Q" },
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "k" }
  ];

  const u = units.find(u => amount >= u.v);
  if (u) return `$${(amount / u.v).toFixed(1)}${u.s}`;

  return `$${amount.toLocaleString()}`;
}

// Message Style
function card(title, lines) {
  return `✨ ${title} ✨\n` + lines.map(x => `➤ ${x}`).join("\n");
}

module.exports.run = async function ({ message, event, args }) {
  const sender = event.senderID;
  const mentions = event.mentions || {};
  const replyUser = event.messageReply?.senderID;

  let db = loadDB();

  // Auto create if user not in DB
  if (!db[sender]) db[sender] = { money: 0 };

  // ==========================
  //        TRANSFER
  // ==========================
  if (args[0]?.toLowerCase() === "t") {
    const targetID = Object.keys(mentions)[0] || replyUser;
    const amount = parseFloat(args[args.length - 1]);

    if (!targetID || isNaN(amount))
      return message.reply(card("Invalid Usage", [
        "Use: balance t @user amount"
      ]));

    if (amount <= 0)
      return message.reply(card("Error", ["Amount must be positive"]));

    if (targetID === sender)
      return message.reply(card("Error", ["You cannot send to yourself"]));

    if (!db[targetID]) db[targetID] = { money: 0 };

    if (db[sender].money < amount)
      return message.reply(card("Insufficient Funds", [
        `You need ${formatMoney(amount - db[sender].money)} more.`
      ]));

    db[sender].money -= amount;
    db[targetID].money += amount;

    saveDB(db);

    return message.reply(card("Transfer Complete", [
      `Sent: ${formatMoney(amount)}`,
      `Your New Balance: ${formatMoney(db[sender].money)}`
    ]));
  }

  // ==========================
  //   Reply → Balance Check
  // ==========================
  if (replyUser && !args[0]) {
    if (!db[replyUser]) db[replyUser] = { money: 0 };
    saveDB(db);

    return message.reply(card("User Balance", [
      `💰 Balance: ${formatMoney(db[replyUser].money)}`
    ]));
  }

  // ==========================
  //   Mention → Balance Check
  // ==========================
  if (Object.keys(mentions).length > 0) {
    let result = [];

    for (const uid in mentions) {
      if (!db[uid]) db[uid] = { money: 0 };
      result.push(`${mentions[uid].replace("@", "")}: ${formatMoney(db[uid].money)}`);
    }

    saveDB(db);

    return message.reply(card("User Balances", result));
  }

  // ==========================
  //     Default → Your Balance
  // ==========================
  saveDB(db);

  return message.reply(card("Your Balance", [
    `💵 ${formatMoney(db[sender].money)}`
  ]));
};
