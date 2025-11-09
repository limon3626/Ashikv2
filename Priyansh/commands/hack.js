const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports.config = {
  name: "hack",
  version: "1.0",
  credits: "Raj",
  hasPermssion: 0,
  description: "Fake hacking image",
  commandCategory: "fun",
  usages: "[tag]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const mentions = Object.keys(event.mentions);
  const targets = mentions.length > 0 ? mentions : [event.senderID];

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  for (const uid of targets) {
    let name;
    try {
      if (mentions.length > 0) {
        name = event.mentions[uid].replace("@", "");
      } else {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || "Unknown";
      }
    } catch {
      name = "Unknown";
    }

    try {
      const backgroundUrl = "https://files.catbox.moe/b4y3fr.jpg";
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

      const [bgRes, avatarRes] = await Promise.all([
        axios.get(backgroundUrl, { responseType: "arraybuffer" }),
        axios.get(avatarUrl, { responseType: "arraybuffer" })
      ]);

      const bgImg = await loadImage(Buffer.from(bgRes.data));
      const avatarImg = await loadImage(Buffer.from(avatarRes.data));

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.drawImage(bgImg, 0, 0);

      // Avatar
      ctx.drawImage(avatarImg, 85, 570, 130, 110);

      // Name
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText(name, 235, 635);

      const outputPath = path.join(cacheDir, `hack_${uid}.jpg`);
      const buffer = canvas.toBuffer("image/jpeg");
      fs.writeFileSync(outputPath, buffer);

      api.sendMessage(
        {
          body: `🖥️ Hacking started for ${name}...`,
          attachment: fs.createReadStream(outputPath)
        },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage(
        `❌ ${name} के लिए hacking image बनाने में error आया`,
        event.threadID,
        event.messageID
      );
    }
  }
};
