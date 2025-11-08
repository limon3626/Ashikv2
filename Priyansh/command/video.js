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

module.exports = {
  config: {
    name: "video",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "HERO + ChatGPT",
    description: "Search and download YouTube videos (with thumbnails)",
    commandCategory: "Media",
    usages: "[video name] [optional result count]",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    if (!args.length) {
      return api.sendMessage("🎬 দয়া করে ভিডিও নাম লিখুন!", event.threadID, event.messageID);
    }

    // লাস্ট আর্গুমেন্ট সংখ্যা কিনা চেক করা
    let resultCount = 6; // ডিফল্ট ৬
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg)) {
      resultCount = Math.min(parseInt(lastArg), 20); // সর্বোচ্চ ২০টা লিমিট
      args.pop(); // সংখ্যা বাদ দিয়ে শুধু ভিডিও নাম রাখা
    }

    const videoName = args.join(" ");

    try {
      const searchResults = await ytSearch(videoName);
      if (!searchResults || !searchResults.videos.length) {
        return api.sendMessage("❌ কোনো ফলাফল পাওয়া যায়নি!", event.threadID, event.messageID);
      }

      const topResults = searchResults.videos.slice(0, resultCount);
      let msg = `🎶 নিচের ${topResults.length}টা ভিডিও থেকে একটি সিলেক্ট করুন:\n\n`;

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
            )
          });
        },
        event.messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ ভিডিও সার্চ করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
  },

  handleReply: async function({ api, event, handleReply }) {
    if (event.senderID !== handleReply.author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.videos.length) {
      return api.sendMessage("❌ সঠিক সংখ্যা লিখুন!", event.threadID, event.messageID);
    }

    const video = handleReply.videos[choice - 1];
    const downloadPath = path.join(__dirname, "cache", `${video.videoId}.mp4`);

    try {
      const apiUrl = `${global.apis.diptoApi}/ytDl3?link=${video.videoId}&format=mp4`;
      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadLink;

      const videoBuffer = await (await fetch(downloadUrl)).buffer();
      fs.writeFileSync(downloadPath, videoBuffer);

      await api.sendMessage({
        attachment: fs.createReadStream(downloadPath),
        body: `🎬 আপনার ভিডিও: ${video.title}`
      }, event.threadID, () => {
        if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
        handleReply.thumbs.forEach(t => fs.existsSync(t) && fs.unlinkSync(t));
        api.unsendMessage(handleReply.messageID);
      }, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
  }
};
