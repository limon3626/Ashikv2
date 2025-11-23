const fs = require("fs");
const path = require("path");

// │📌 balances.json যেখানে থাকবে (অটোমেটিক তৈরি হবে)
const dataFile = path.join(__dirname, "balances.json");

// │📌 অটো-লোড + অটো-ক্রিয়েট
const loadBalances = () => {
  try {
    // যদি balances.json না থাকে → তৈরি করে
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, "{}");
      return {};
    }

    // যদি থাকে → পড়বে
    const raw = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(raw || "{}");

  } catch (err) {
    console.log("❌ balances.json corrupted, auto-resetting...");
    fs.writeFileSync(dataFile, "{}");
    return {};
  }
};

// │📌 সেভ করা (অটোমেটিক)
const saveBalances = (data) =>
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

module.exports.config = {
  name: "balance",
  version: "3.5",
  hasPermssion: 0,
  credits: "xnil6x + Modified by Ashik + AutoJSON by ChatGPT",
  description: "💰 Economy system with auto-created persistent storage",
  commandCategory: "economy",
  usages: "[mention | reply | t @user amount]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { senderID, threadID, messageID, messageReply, mentions } = event;

  // │📌 প্রতিবার balances লোড করবে (সেফ)
  let balances = loadBalances();

  const getBalance = (uid) => balances[uid] || 0;
  const setBalance = (uid, amount) => {
    balances[uid] = amount;
    saveBalances(balances);
  };

  // সুন্দরভাবে টাকা দেখানো
  const formatMoney = (amount) => {
    if (isNaN(amount)) return "$0";
    amount = Number(amount);
    const scales = [
      { value: 1e15, suffix: "Q" },
      { value: 1e12, suffix: "T" },
      { value: 1e9, suffix: "B" },
      { value: 1e6, suffix: "M" },
      { value: 1e3, suffix: "k" }
    ];
    const scale = scales.find(s => amount >= s.value);
    if (scale) return `$${(amount / scale.value).toFixed(1)}${scale.suffix}`;
    return `$${amount.toLocaleString()}`;
  };

  const createFlatDisplay = (title, contentLines) =>
    `✨ ${title} ✨\n` + contentLines.map(line => `➤ ${line}`).join("\n") + "\n";

  // ────────────────────────────────────────
  //         🏦 Transfer System
  // ────────────────────────────────────────
  if (args[0]?.toLowerCase() === "t") {
    const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
    const amount = parseFloat(args[args.length - 1]);

    if (!targetID || isNaN(amount)) {
      return api.sendMessage(createFlatDisplay("Invalid Usage", [
        `ব্যবহার: balance t @user amount`
      ]), threadID, messageID);
    }

    if (amount <= 0)
      return api.sendMessage(createFlatDisplay("Error", ["Amount must be positive."]), threadID, messageID);

    if (targetID === senderID)
      return api.sendMessage(createFlatDisplay("Error", ["আপনি নিজেকে টাকা পাঠাতে পারবেন না।"]), threadID, messageID);

    const senderMoney = getBalance(senderID);
    if (senderMoney < amount)
      return api.sendMessage(createFlatDisplay("Insufficient Balance", [
        `আপনার কাছে ${formatMoney(amount - senderMoney)} কম আছে।`
      ]), threadID, messageID);

    setBalance(senderID, senderMoney - amount);
    setBalance(targetID, getBalance(targetID) + amount);

    const receiverName = await Users.getNameUser(targetID);

    return api.sendMessage(createFlatDisplay("Transfer Complete", [
      `👤 প্রাপক: ${receiverName}`,
      `💸 পাঠানো হয়েছে: ${formatMoney(amount)}`,
      `💰 নতুন ব্যালেন্স: ${formatMoney(getBalance(senderID))}`
    ]), threadID, messageID);
  }

  // ────────────────────────────────────────
  // Reply দিয়ে অন্যের ব্যালেন্স দেখা
  // ────────────────────────────────────────
  if (messageReply?.senderID && !args[0]) {
    const targetID = messageReply.senderID;
    const name = await Users.getNameUser(targetID);
    return api.sendMessage(createFlatDisplay(`${name} এর ব্যালেন্স`, [
      `💵 ব্যালেন্স: ${formatMoney(getBalance(targetID))}`
    ]), threadID, messageID);
  }

  // ────────────────────────────────────────
  // Mention করা ইউজারের ব্যালেন্স
  // ────────────────────────────────────────
  if (Object.keys(mentions).length > 0) {
    const results = [];
    for (const uid of Object.keys(mentions)) {
      const name = mentions[uid].replace("@", "");
      results.push(`${name}: ${formatMoney(getBalance(uid))}`);
    }
    return api.sendMessage(createFlatDisplay("User Balances", results), threadID, messageID);
  }

  // ────────────────────────────────────────
  // নিজের ব্যালেন্স
  // ────────────────────────────────────────
  return api.sendMessage(createFlatDisplay("Your Balance", [
    `💵 ${formatMoney(getBalance(senderID))}`
  ]), threadID, messageID);
};
