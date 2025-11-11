const fs = require("fs");

module.exports.config = {
  name: "slots",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "xnil6x + Modified by Ashik",
  description: "🎰 Ultra-stylish slot machine for Mirai bot",
  commandCategory: "game",
  usages: "[bet amount]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Users, Currencies }) {
  const { threadID, messageID, senderID } = event;
  const bet = parseInt(args[0]);

  // Format money function
  const formatMoney = (amount) => {
    if (isNaN(amount)) return "💲0";
    const scales = [
      { value: 1e15, suffix: "Q", color: "🌈" },
      { value: 1e12, suffix: "T", color: "✨" },
      { value: 1e9, suffix: "B", color: "💎" },
      { value: 1e6, suffix: "M", color: "💰" },
      { value: 1e3, suffix: "k", color: "💵" }
    ];
    const scale = scales.find(s => amount >= s.value);
    if (scale) {
      const scaledValue = amount / scale.value;
      return `${scale.color}${scaledValue.toFixed(2)}${scale.suffix}`;
    }
    return `💲${amount.toLocaleString()}`;
  };

  if (isNaN(bet) || bet <= 0)
    return api.sendMessage("🔴 দয়া করে সঠিক বেট এমাউন্ট দিন!", threadID, messageID);

  const money = (await Currencies.getData(senderID)).money;
  if (money < bet)
    return api.sendMessage(`🔴 আপনার কাছে পর্যাপ্ত টাকা নেই! ${formatMoney(bet - money)} আরো লাগবে।`, threadID, messageID);

  // Slot symbols and weights
  const symbols = [
    { emoji: "🍒", weight: 30 },
    { emoji: "🍋", weight: 25 },
    { emoji: "🍇", weight: 20 },
    { emoji: "🍉", weight: 15 },
    { emoji: "⭐", weight: 7 },
    { emoji: "7️⃣", weight: 3 }
  ];

  // Weighted random
  const roll = () => {
    const totalWeight = symbols.reduce((a, b) => a + b.weight, 0);
    let random = Math.random() * totalWeight;
    for (const s of symbols) {
      if (random < s.weight) return s.emoji;
      random -= s.weight;
    }
    return symbols[0].emoji;
  };

  const slot1 = roll(), slot2 = roll(), slot3 = roll();

  let winnings = 0;
  let outcome = "", winType = "", bonus = "";

  if (slot1 === "7️⃣" && slot2 === "7️⃣" && slot3 === "7️⃣") {
    winnings = bet * 10;
    outcome = "🔥 মেগা জ্যাকপট! ট্রিপল 7️⃣!";
    winType = "💎 ম্যাক্স উইন!";
    bonus = "🎆 বোনাস: আপনার ব্যালেন্সে +3% যোগ হয়েছে!";
    await Currencies.increaseMoney(senderID, money * 0.03);
  } 
  else if (slot1 === slot2 && slot2 === slot3) {
    winnings = bet * 5;
    outcome = "💰 জ্যাকপট! তিনটি মিলেছে!";
    winType = "💫 বিগ উইন!";
  } 
  else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    winnings = bet * 2;
    outcome = "✨ দুইটা মিলেছে!";
    winType = "🌟 উইন!";
  } 
  else if (Math.random() < 0.5) {
    winnings = bet * 1.5;
    outcome = "🎯 ভাগ্যবান স্পিন!";
    winType = "🍀 ছোট উইন!";
  } 
  else {
    winnings = -bet;
    outcome = "💸 পরেরবার চেষ্টা করুন!";
    winType = "☠️ হার!";
  }

  await Currencies.increaseMoney(senderID, winnings);
  const newMoney = (await Currencies.getData(senderID)).money;

  const slotBox = 
  "╔═════════════════════╗\n" +
  "║  🎰 SLOT MACHINE 🎰  ║\n" +
  "╠═════════════════════╣\n" +
  `║     [ ${slot1} | ${slot2} | ${slot3} ]     ║\n` +
  "╚═════════════════════╝";

  const resultColor = winnings >= 0 ? "🟢" : "🔴";
  const resultText = winnings >= 0 ? `🏆 জিতেছেন: ${formatMoney(winnings)}` : `💸 হেরেছেন: ${formatMoney(bet)}`;

  const msg = `${slotBox}\n\n🎯 ফলাফল: ${outcome}\n${winType}\n${bonus ? `${bonus}\n` : ""}${resultColor} ${resultText}\n💰 বর্তমান ব্যালেন্স: ${formatMoney(newMoney)}\n\n💡 টিপস: বেশি বেট মানে বেশি জ্যাকপট সুযোগ!`;

  return api.sendMessage(msg, threadID, messageID);
};
