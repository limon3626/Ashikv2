const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "balance",
  aliases: ["bal", "$", "cash"],
  version: "3.2",
  author: "xnil6x (Mirai version by ChatGPT)",
  countDown: 3,
  role: 0,
  description: "💰 Premium Economy System with Auto Save",
  category: "economy",
  guide: {
    en: "{pn} - Check your balance\n"
       + "{pn} @user - Check others\n"
       + "{pn} t @user amount - Transfer money\n"
       + "{pn} [reply] - Check replied user's balance"
  }
};

// 📌 balance.json ফাইল লোকেশন
const dataPath = path.join(__dirname, "../../data/balances.json");

// 📌 balance.json না থাকলে অটো তৈরি হবে
function loadBalances() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveBalances(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.onStart = async function ({ message, event, args }) {
  const senderID = event.senderID;
  const mentions = event.mentions || {};
  const replyUser = event.messageReply?.senderID;

  let db = loadBalances();

  // যদি user ডাটাতে না থাকে → auto set = 0
  if (!db[senderID]) db[senderID] = { money: 0 };

  const formatMoney = (amount) => {
    if (isNaN(amount)) return "$0";
    amount = Number(amount);
    const scales = [
      { value: 1e15, suffix: 'Q' },
      { value: 1e12, suffix: 'T' },
      { value: 1e9, suffix: 'B' },
      { value: 1e6, suffix: 'M' },
      { value: 1e3, suffix: 'k' }
    ];
    const scale = scales.find(s => amount >= s.value);
    if (scale) return `$${(amount / scale.value).toFixed(1)}${scale.suffix}`;
    return `$${amount.toLocaleString()}`;
  };

  const display = (title, lines) =>
    `✨ ${title} ✨\n` + lines.map(l => `➤ ${l}`).join("\n");

  // =======================
  // 🔁 Money Transfer
  // =======================
  if (args[0]?.toLowerCase() === "t") {
    const targetID = Object.keys(mentions)[0] || replyUser;
    const amount = parseFloat(args[args.length - 1]);

    if (!targetID || isNaN(amount))
      return message.reply(display("Invalid Usage", [
        "Use: balance t @user amount"
      ]));

    if (amount <= 0)
      return message.reply(display("Error", ["Amount must be positive"]));

    if (targetID === senderID)
      return message.reply(display("Error", ["You can't send money to yourself"]));

    if (!db[targetID]) db[targetID] = { money: 0 };

    if (db[senderID].money < amount)
      return message.reply(display("Insufficient Balance", [
        `You need more ${formatMoney(amount - db[senderID].money)}`
      ]));

    db[senderID].money -= amount;
    db[targetID].money += amount;

    saveBalances(db);

    return message.reply(display("Transfer Complete", [
      `Sent: ${formatMoney(amount)}`,
      `Your New Balance: ${formatMoney(db[senderID].money)}`
    ]));
  }

  // =======================
  // 🔁 Reply করে balance check
  // =======================
  if (replyUser && !args[0]) {
    if (!db[replyUser]) db[replyUser] = { money: 0 };
    saveBalances(db);

    return message.reply(display("User Balance", [
      `💰 Balance: ${formatMoney(db[replyUser].money)}`
    ]));
  }

  // =======================
  // 🔁 Mention User Balance
  // =======================
  if (Object.keys(mentions).length > 0) {
    let list = [];

    for (const uid in mentions) {
      if (!db[uid]) db[uid] = { money: 0 };
      list.push(`${mentions[uid].replace("@", "")}: ${formatMoney(db[uid].money)}`);
    }

    saveBalances(db);
    return message.reply(display("User Balances", list));
  }

  // =======================
  // 🔁 Your Own Balance
  // =======================
  saveBalances(db);

  return message.reply(display("Your Balance", [
    `💵 ${formatMoney(db[senderID].money)}`
  ]));
};
