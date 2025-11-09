const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const fetch = require("node-fetch");

async function baseApiUrl() {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
  );
  return base.data.api;
}

(async () => {
  global.apis = {
    diptoApi: await baseApiUrl()
  };
})();

const DOWNLOAD_API = "https://priyanshuapi.xyz/api/runner/yout-downloader/download";
const API_KEY = "apim_bfVZ8_qKchCbGPLowwdzyJGxlqFBg9spe0Zu44GccDw";

module.exports = {
  config: {
    name: "video",
    version: "1.3.1",
    hasPermssion: 0,
    credits: "HERO + ChatGPT",
    description: "Search and download YouTube videos (always video format)",
    commandCategory: "Media",
    usages: "[video name] (always downloads video)",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    if (!args.length) {
      return api.sendMessage("🎬 দয়া করে ভিডিও নাম লিখুন!", event.threadID, event.messageID);
    }

    let resultCount = 6;
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg)) {
      resultCount = Math.min(parseInt(lastArg), 20);
      args.pop();
    }

    const videoName = args.join(" ");

    try {
      const searchResults = await ytSearch(videoName);
      if (!searchResults || !searchResults.videos.length) {
        return api.sendMessage("❌ কোনো ফলাফল পাওয়া যায়নি!", event.threadID, event.messageID);
      }

      const topResults = searchResults.videos.slice(0, resultCount);
      let msg = `🎬 নিচের ${topResults.length}টা ভিডিও থেকে একটি সিলেক্ট করুন:\n\n`;

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      let attachments = [];
      for (let i = 0; i < topResults.length; i++) {
        const video = topResults[i];
        msg += `${i + 1}. ${video.title} (${video.timestamp})\n`;

        const thumbPath = path.join(cacheDir, `thumb_${event.senderID}_${i}.jpg`);
        const response = await axios.get(video.thumbnail, { responseType: "arraybuffer" });
        fs.writeFileSync(thumbPath, Buffer.from(response.data, "binary"));
        attachments.push(fs.createReadStream(thumbPath));
      }

      api.sendMessage(
        { body: msg, attachment: attachments },
        event.threadID,
        (err, info) => {
          global.client.handleReply.push({
            type: "video_select",
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            videos: topResults,
            thumbs: attachments.map((_, i) =>
              path.join(cacheDir, `thumb_${event.senderID}_${i}.jpg`)
            ),
            isVideo: true // সবসময় video ডাউনলোড হবে
          });
        },
        event.messageID
      );
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ ভিডিও সার্চ করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
  },

  handleReply: async function ({ api, event, handleReply }) {
    if (event.senderID !== handleReply.author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
      return api.sendMessage("❌ সঠিক সংখ্যা লিখুন!", event.threadID, event.messageID);
    }

    const video = handleReply.videos[choice - 1];
    const cacheDir = path.join(__dirname, "cache");
    const downloadPath = path.join(cacheDir, `${video.videoId}.mp4`);
    const format = "video"; // সবসময় video

    try {
      const downloadResponse = await axios.post(
        DOWNLOAD_API,
        {
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          format: format
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      fs.writeFileSync(downloadPath, Buffer.from(downloadResponse.data));

      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🎬 আপনার ভিডিও: ${video.title}`
        },
        event.threadID,
        () => {
          if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
          handleReply.thumbs.forEach(t => fs.existsSync(t) && fs.unlinkSync(t));
          api.unsendMessage(handleReply.messageID);
        },
        event.messageID
      );
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ ডাউনলোড করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
  }
};
