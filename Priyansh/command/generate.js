const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "generate",
  version: "2.3",
  hasPermssion: 0,
  credits: "Raj (Modified by Aria)",
  description: "Generate AI image using prompt (bottom watermark blur)",
  commandCategory: "ai",
  usages: "generate <prompt> [blurPercent]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) return api.sendMessage(
    "⚠️ | Please provide a prompt.\n\nExample: generate flying boy raj 10",
    event.threadID,
    event.messageID
  );

  // Last arg can be blur percentage (default 10%)
  let blurPercent = 10;
  if (!isNaN(args[args.length - 1])) {
    blurPercent = parseInt(args.pop());
    if (blurPercent < 0 || blurPercent > 50) blurPercent = 10; // safety limit
  }

  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage(
    "⚠️ | Please provide a prompt.",
    event.threadID,
    event.messageID
  );

  const loadingMsg = await api.sendMessage(
    `🎨 | Generating image for: "${prompt}" with bottom watermark blur...`,
    event.threadID
  );

  try {
    // Ensure cache folder exists
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    // Download image from Pollinations
    const res = await axios.get(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
      { responseType: "arraybuffer" }
    );

    const imagePath = path.join(cacheDir, `${Date.now()}_gen.jpg`);
    fs.writeFileSync(imagePath, res.data);

    // Load image with Jimp
    const image = await Jimp.read(imagePath);

    // Blur bottom portion (blurPercent of image height)
    const blurHeight = Math.floor(image.bitmap.height * (blurPercent / 100));
    const bottom = image.clone().crop(0, image.bitmap.height - blurHeight, image.bitmap.width, blurHeight);
    bottom.blur(8); // intensity of blur
    image.composite(bottom, 0, image.bitmap.height - blurHeight);

    await image.writeAsync(imagePath);

    // Send image
    api.sendMessage(
      {
        body: `✅ | Prompt: "${prompt}"`,
        attachment: fs.createReadStream(imagePath)
      },
      event.threadID,
      () => fs.unlinkSync(imagePath),
      loadingMsg.messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage(
      "❌ | Failed to generate image. Try again later.",
      event.threadID,
      event.messageID
    );
  }
};
