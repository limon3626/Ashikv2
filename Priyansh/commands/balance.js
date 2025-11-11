module.exports.config = {
  name: "balance",
  version: "3.2",
  hasPermssion: 0,
  credits: "xnil6x + Modified by Ashik",
  description: "💰 Premium Economy System with Stylish Display (Mirai Compatible)",
  commandCategory: "economy",
  usages: "[mention | reply | t @user amount]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { senderID, threadID, messageID, messageReply, mentions } = event;

  // ✅ সুন্দরভাবে টাকার পরিমাণ দেখানোর ফাংশন
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
    if (scale) {
      const scaledValue = amount / scale.value;
      return `$${scaledValue.toFixed(1)}${scale.suffix}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const createFlatDisplay = (title, contentLines) => {
    return `✨ ${title} ✨\n` + 
      contentLines.map(line => `➤ ${line}`).join("\n") + "\n";
  };

  // 🏦 Transfer Command
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

    const senderMoney = (await Currencies.getData(senderID)).money;
    const receiverMoney = (await Currencies.getData(targetID)).money;

    if (senderMoney < amount) {
      return api.sendMessage(createFlatDisplay("Insufficient Balance", [
        `আপনার কাছে ${formatMoney(amount - senderMoney)} কম আছে।`
      ]), threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, amount);
    await Currencies.increaseMoney(targetID, amount);

    const receiverName = await Users.getNameUser(targetID);
    const newBalance = senderMoney - amount;

    return api.sendMessage(createFlatDisplay("Transfer Complete", [
      `👤 প্রাপক: ${receiverName}`,
      `💸 পাঠানো হয়েছে: ${formatMoney(amount)}`,
      `💰 নতুন ব্যালেন্স: ${formatMoney(newBalance)}`
    ]), threadID, messageID);
  }

  // 🧍 Reply দিয়ে অন্যের ব্যালেন্স দেখা
  if (messageReply?.senderID && !args[0]) {
    const targetID = messageReply.senderID;
    const name = await Users.getNameUser(targetID);
    const { money } = await Currencies.getData(targetID);

    return api.sendMessage(createFlatDisplay(`${name} এর ব্যালেন্স`, [
      `💵 ব্যালেন্স: ${formatMoney(money)}`
    ]), threadID, messageID);
  }

  // 🧑‍🤝‍🧑 Mention করা ইউজারদের ব্যালেন্স দেখা
  if (Object.keys(mentions).length > 0) {
    const results = [];
    for (const uid of Object.keys(mentions)) {
      const name = mentions[uid].replace("@", "");
      const { money } = await Currencies.getData(uid);
      results.push(`${name}: ${formatMoney(money)}`);
    }
    return api.sendMessage(createFlatDisplay("User Balances", results), threadID, messageID);
  }

  // 💰 নিজের ব্যালেন্স দেখা
  const { money } = await Currencies.getData(senderID);
  return api.sendMessage(createFlatDisplay("Your Balance", [
    `💵 ${formatMoney(money)}`
  ]), threadID, messageID);
};
