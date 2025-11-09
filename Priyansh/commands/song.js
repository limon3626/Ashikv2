const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");

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
    name: "song",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "HERO + ChatGPT",
    description: "Search and download YouTube video directly (no selection, no audio)",
    commandCategory: "Media",
    usages: "[video name]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    if (!args.length) {
      return api.sendMessage("🎬 দয়া করে ভিডিও নাম লিখুন!", event.threadID, event.messageID);
    }

    const videoName = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    try {
      // প্রথম ভিডিও খুঁজে বের করা
      const searchResults = await ytSearch(videoName);
      if (!searchResults || !searchResults.videos.length) {
        return api.sendMessage("❌ কোনো ফলাফল পাওয়া যায়নি!", event.threadID, event.messageID);
      }

      const video = searchResults.videos[0]; // শুধু প্রথম ভিডিও
      const downloadPath = path.join(cacheDir, `${video.videoId}.mp4`);

      // ডাউনলোড করা
      const downloadResponse = await axios.post(
        DOWNLOAD_API,
        {
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          format: "video"
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

      // পাঠানো
      await api.sendMessage(
        {
          attachment: fs.createReadStream(downloadPath),
          body: `🎬 আপনার ভিডিও: ${video.title}`
        },
        event.threadID,
        () => {
          if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
        },
        event.messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
  }
};
