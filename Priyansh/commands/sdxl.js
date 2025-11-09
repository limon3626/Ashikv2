const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "flux",
    version: "2.0",
    hasPermssion: 0,
    credits: "Redwan",
    description: "Generate AI image using Flux API",
    commandCategory: "ai",
    usages: "flux <prompt>",
    cooldowns: 3
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage(
      "⚠️ | Please provide a prompt.\n\nExample: flux beautiful landscape", 
      event.threadID, 
      event.messageID
    );

    const loading = await api.sendMessage(`🎨 | Generating image for: "${prompt}"...`, event.threadID);

    try {
      // Ensure cache folder exists
      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      // Flux API call
      const apiUrl = `https://global-redwans-apis.onrender.com/api/flux?p=${encodeURIComponent(prompt)}&mode=flux`;
      const response = await axios.get(apiUrl);
      const htmlData = response.data.data;

      // Extract image URL
      const imageUrlMatch = htmlData.match(/https?:\/\/\S+\.(png|jpg|jpeg)/i);
      if (!imageUrlMatch) return api.sendMessage("❌ | Failed to generate image. Try again later.", event.threadID, event.messageID);

      // Download image
      const imageRes = await axios.get(imageUrlMatch[0], { responseType: 'arraybuffer' });
      const imagePath = path.join(cacheDir, `${Date.now()}_flux.jpg`);
      fs.writeFileSync(imagePath, imageRes.data);

      // Send image to thread
      api.sendMessage({
        body: `✅ | Prompt: "${prompt}"`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => fs.unlinkSync(imagePath), loading.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ | Failed to generate image. Try again later.", event.threadID, event.messageID);
    }
  }
};
