const axios = require("axios");

async function baseApiUrl() {
  const base = await axios.get("https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json");
  return base.data.api;
}

module.exports.config = {
  name: "quiz",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Dipto + Mirai Convert by Ashik",
  description: "Play quiz in Bangla or English",
  commandCategory: "game",
  usages: "[bn/en]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  const input = (args[0] || "bn").toLowerCase();
  let category = input === "en" ? "english" : "bangla";
  const timeout = 300;

  try {
    const response = await axios.get(`${await baseApiUrl()}/quiz?category=${category}&q=random`);
    const quizData = response.data.question;
    const { question, correctAnswer, options } = quizData;
    const { a, b, c, d } = options;
    const namePlayerReact = await Users.getNameUser(event.senderID);

    const quizMsg = `╭───✦ QUIZ ✦───╮
🧠 Question: ${question}
├ A) ${a}
├ B) ${b}
├ C) ${c}
├ D) ${d}
╰───────────────╯
💬 Reply this message with your answer (A/B/C/D)!`;

    api.sendMessage(quizMsg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        correctAnswer,
        attempts: 0,
        nameUser: namePlayerReact,
        dataGame: quizData
      });

      // Auto delete after timeout
      setTimeout(() => api.unsendMessage(info.messageID), timeout * 1000);
    }, event.messageID);
  } catch (e) {
    console.error(e);
    api.sendMessage("⚠️ Quiz load error: " + e.message, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply, Users, Currencies }) {
  const { correctAnswer, nameUser, author } = handleReply;
  if (event.senderID !== author) return api.sendMessage("❌ Only the quiz starter can answer!", event.threadID, event.messageID);

  const maxAttempts = 2;
  let userReply = event.body.trim().toLowerCase();

  if (handleReply.attempts >= maxAttempts) {
    await api.unsendMessage(handleReply.messageID);
    return api.sendMessage(`🚫 ${nameUser}, you’ve used all attempts!\n✅ Correct answer: ${correctAnswer}`, event.threadID, event.messageID);
  }

  const answer = correctAnswer.toLowerCase();
  if (userReply === answer) {
    api.unsendMessage(handleReply.messageID);
    let rewardCoins = 300;
    let rewardExp = 100;

    await Currencies.increaseMoney(event.senderID, rewardCoins);
    await Currencies.increaseExp(event.senderID, rewardExp);

    return api.sendMessage(
      `🎉 Congratulations, ${nameUser}!\n✅ Correct Answer: ${correctAnswer}\n💰 +${rewardCoins} Coins\n✨ +${rewardExp} EXP`,
      event.threadID,
      event.messageID
    );
  } else {
    handleReply.attempts += 1;
    const remaining = maxAttempts - handleReply.attempts;
    return api.sendMessage(
      `❌ Wrong Answer!\n🔁 Attempts left: ${remaining}\nTry again!`,
      event.threadID,
      event.messageID
    );
  }
};
