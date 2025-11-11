module.exports.config = {
  name: "bank",
  version: "1.9",
  hasPermssion: 0,
  credits: "X Nil + Modified by Ashik",
  description: "🏦 Bank system with wallet, bank, and loan for Mirai bot",
  commandCategory: "economy",
  usages: "bank [balance | deposit <amount> | withdraw <amount> | loan | preloan | top]",
  cooldowns: 5
};

// 💰 সুন্দরভাবে টাকার পরিমাণ দেখানোর ফাংশন
function formatMoney(amount) {
  if (amount === 0) return "0";
  const abs = Math.abs(amount);
  if (abs >= 1e15) return (amount / 1e15).toFixed(2).replace(/\.00$/, "") + "qt";
  if (abs >= 1e12) return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
  if (abs >= 1e9) return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (abs >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (abs >= 1e3) return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "k";
  return amount.toString();
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { senderID, threadID, messageID } = event;
  const cmd = args[0]?.toLowerCase();

  // 📋 কোনো সাবকমান্ড না দিলে হেল্প মেসেজ দেখাবে
  if (!cmd) {
    return api.sendMessage(
      "🏦 Bank Commands:\n" +
      "• balance\n" +
      "• deposit <amount>\n" +
      "• withdraw <amount>\n" +
      "• loan\n" +
      "• preloan\n" +
      "• top",
      threadID,
      messageID
    );
  }

  // ইউজারের তথ্য লোড
  const data = await Currencies.getData(senderID);
  const money = data.money || 0;
  let userData = data.data || {};

  if (!userData.bankdata) userData.bankdata = { bank: 0, loan: 0 };
  const bankData = userData.bankdata;

  // 🏦 ব্যালেন্স দেখা
  if (cmd === "balance") {
    return api.sendMessage(
      `🏦 আপনার ব্যাংক অ্যাকাউন্ট:\n` +
      `💰 ওয়ালেট: ${formatMoney(money)}\n` +
      `🏦 ব্যাংক: ${formatMoney(bankData.bank)}\n` +
      `💳 লোন: ${formatMoney(bankData.loan)}`,
      threadID,
      messageID
    );
  }

  // 💵 জমা দেওয়া (Deposit)
  if (cmd === "deposit") {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0)
      return api.sendMessage("❌ সঠিক এমাউন্ট দিন জমা দিতে।", threadID, messageID);

    if (money < amount)
      return api.sendMessage(`❌ আপনার কাছে ${formatMoney(money)} আছে, পর্যাপ্ত না।`, threadID, messageID);

    await Currencies.decreaseMoney(senderID, amount);
    bankData.bank += amount;

    await Currencies.setData(senderID, { money: money - amount, data: userData });

    return api.sendMessage(
      `✅ জমা সম্পন্ন: ${formatMoney(amount)}\n` +
      `🏦 ব্যাংক: ${formatMoney(bankData.bank)}\n` +
      `💰 ওয়ালেট: ${formatMoney(money - amount)}`,
      threadID,
      messageID
    );
  }

  // 🏧 উত্তোলন (Withdraw)
  if (cmd === "withdraw") {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0)
      return api.sendMessage("❌ সঠিক এমাউন্ট দিন উত্তোলন করতে।", threadID, messageID);

    if (bankData.bank < amount)
      return api.sendMessage(`❌ আপনার ব্যাংকে ${formatMoney(bankData.bank)} আছে।`, threadID, messageID);

    bankData.bank -= amount;
    await Currencies.increaseMoney(senderID, amount);

    await Currencies.setData(senderID, { data: userData });

    return api.sendMessage(
      `✅ উত্তোলন সম্পন্ন: ${formatMoney(amount)}\n` +
      `💰 ওয়ালেট: ${formatMoney(money + amount)}\n` +
      `🏦 ব্যাংক: ${formatMoney(bankData.bank)}`,
      threadID,
      messageID
    );
  }

  // 💳 লোন নেওয়া
  if (cmd === "loan") {
    const loanLimit = 1000000;

    if (bankData.loan > 0)
      return api.sendMessage(
        `⛔ আপনি আগে থেকেই ${formatMoney(bankData.loan)} লোন নিয়েছেন। আগে শোধ করুন।`,
        threadID,
        messageID
      );

    bankData.loan = loanLimit;
    await Currencies.increaseMoney(senderID, loanLimit);

    await Currencies.setData(senderID, { data: userData });

    return api.sendMessage(
      `✅ লোন অনুমোদিত: ${formatMoney(loanLimit)} আপনার ওয়ালেটে যোগ হয়েছে! 💵`,
      threadID,
      messageID
    );
  }

  // 💰 লোন শোধ (Preloan)
  if (cmd === "preloan") {
    if (bankData.loan === 0)
      return api.sendMessage("✅ আপনার কোনো লোন নেই!", threadID, messageID);

    if (money < bankData.loan)
      return api.sendMessage(`❌ শোধ করতে ${formatMoney(bankData.loan)} লাগবে, কিন্তু আপনার কাছে পর্যাপ্ত নেই।`, threadID, messageID);

    await Currencies.decreaseMoney(senderID, bankData.loan);
    bankData.loan = 0;

    await Currencies.setData(senderID, { data: userData });

    return api.sendMessage("✅ লোন সফলভাবে শোধ হয়েছে! আপনি এখন ঋণমুক্ত।", threadID, messageID);
  }

  // 🏆 টপ ১০ ব্যাঙ্ক ব্যালেন্স
  if (cmd === "top") {
    const allUsers = await Currencies.getAll();
    const topUsers = allUsers
      .filter(u => u?.data?.bankdata?.bank > 0)
      .sort((a, b) => b.data.bankdata.bank - a.data.bankdata.bank)
      .slice(0, 10);

    if (topUsers.length === 0)
      return api.sendMessage("❌ কোনো ইউজার ব্যাংকে টাকা রাখেনি।", threadID, messageID);

    let msg = "🏆 ব্যাংকে সর্বোচ্চ টাকার মালিক Top 10 ইউজার:\n";
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const name = await Users.getNameUser(user.userID);
      msg += `${i + 1}. ${name}: ${formatMoney(user.data.bankdata.bank)}\n`;
    }

    return api.sendMessage(msg.trim(), threadID, messageID);
  }

  // ❓ ভুল সাবকমান্ড
  return api.sendMessage(
    "❓ ভুল কমান্ড। ব্যবহার করুন:\n" +
    "balance, deposit, withdraw, loan, preloan, top",
    threadID,
    messageID
  );
};
