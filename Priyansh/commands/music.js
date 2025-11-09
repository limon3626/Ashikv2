const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const fetch = require("node-fetch");

const SEARCH_API = "https://gemini-d0bh.onrender.com/search";
const DOWNLOAD_API = "https://priyanshuapi.xyz/api/runner/yout-downloader/download";
const API_KEY = "apim_bfVZ8_qKchCbGPLowwdzyJGxlqFBg9spe0Zu44GccDw";

module.exports = {
  config: {
    name: "music",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "𝐊𝐀𝐒𝐇𝐈𝐅 𝐑𝐀𝐙𝐀",
    description: "🎵 Search and download YouTube songs as MP3",
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    if (!args.length) {
      return api.sendMessage("༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**Please enter a song name to search! 🎶**\n\n༻﹡﹡﹡﹡﹡﹡﹡༺", event.threadID, event.messageID);
    }

    const query = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    try {
      // Search via Gemini API (to match your working file)
      const searchRes = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
      if (!searchRes.data.results || searchRes.data.results.length === 0) {
        return api.sendMessage("⚝──⭒─⭑─⭒──⚝\n\n**No songs found for your search! ❌**\n\n⚝──⭒─⭑─⭒──⚝", event.threadID, event.messageID);
      }

      const results = searchRes.data.results.slice(0, 6);
      let msg = `≿━━━━༺❀༻━━━━≾\n\n**🎧 Select a song number to download:**\n\n`;

      const thumbs = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        msg += `${i + 1}. ${r.title}\n`;
        try {
          const thumbPath = path.join(cacheDir, `thumb_${event.senderID}_${i}.jpg`);
          const img = await axios.get(r.thumbnail, { responseType: "arraybuffer" });
          fs.writeFileSync(thumbPath, Buffer.from(img.data, "binary"));
          thumbs.push(thumbPath);
        } catch { }
      }

      msg += `\n≿━━━━༺❀༻━━━━≾\n\n**Reply with a number (1–${results.length}) to download.**`;

      api.sendMessage({ body: msg, attachment: thumbs.map(f => fs.createReadStream(f)) }, event.threadID, (err, info) => {
        global.client.handleReply.push({
          type: "music_select",
          name: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          songs: results,
          thumbs
        });
      }, event.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("⚝──⭒─⭑─⭒──⚝\n\n**Error occurred while searching song! ❌**\n\n⚝──⭒─⭑─⭒──⚝", event.threadID, event.messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    if (event.senderID !== handleReply.author) return;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.songs.length) {
      return api.sendMessage("༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**Please reply with a valid number! ⚠️**\n\n༻﹡﹡﹡﹡﹡﹡﹡༺", event.threadID, event.messageID);
    }

    const selected = handleReply.songs[choice - 1];
    const songTitle = selected.title;
    const videoUrl = selected.url;

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

    try {
      api.sendMessage(`≿━━━━༺❀༻━━━━≾\n\n**🎵 Downloading:** ${songTitle}\n\nPlease wait...`, event.threadID);

      const dlRes = await axios.post(
        DOWNLOAD_API,
        { url: videoUrl, format: "audio" },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      );

      fs.writeFileSync(filePath, Buffer.from(dlRes.data));

      await api.sendMessage({
        body: `༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**🎶 Song:** ${songTitle}\n\n**Uploaded by:** 𝐊𝐀𝐒𝐇𝐈𝐅 𝐑𝐀𝐙𝐀\n\n༻﹡﹡﹡﹡﹡﹡﹡༺`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        handleReply.thumbs.forEach(t => fs.existsSync(t) && fs.unlinkSync(t));
        api.unsendMessage(handleReply.messageID);
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("⚝──⭒─⭑─⭒──⚝\n\n**Failed to download this song! ❌**\n\n⚝──⭒─⭑─⭒──⚝", event.threadID, event.messageID);
    }
  }
};
