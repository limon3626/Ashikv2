const axios = require("axios");
const yts = require("yt-search");

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

function getVideoID(url) {
  const checkurl =
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const match = url.match(checkurl);
  return match ? match[1] : null;
}

module.exports.config = {
  name: "song",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Mesbah Saxx → Modified by HERO",
  description: "Download and play YouTube video via API",
  commandCategory: "media",
  usages: "song [song name or YouTube link] [quality]",
  cooldowns: 5
};

module.exports.run = async function ({ api, args, event }) {
  try {
    if (!args.length) return api.sendMessage("❌ | Provide a song name or YouTube link.", event.threadID, event.messageID);

    // ডিফল্ট কোয়ালিটি
    let qualityWanted = "360p";
    const lastArg = args[args.length - 1];
    if (/^(144p|240p|360p|480p|720p|1080p)$/i.test(lastArg)) {
      qualityWanted = lastArg.toLowerCase();
      args.pop();
    }

    let videoID;
    let waitingMsg;
    const url = args[0];

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      videoID = getVideoID(url);
      if (!videoID) return api.sendMessage("❌ | Invalid YouTube URL.", event.threadID, event.messageID);
    } else {
      const songName = args.join(" ");
      waitingMsg = await api.sendMessage(`🔍 Searching video "${songName}"...`, event.threadID);
      const r = await yts(songName);
      if (!r.videos.length) return api.sendMessage("❌ | Video not found.", event.threadID, event.messageID);
      videoID = r.videos[0].videoId; // প্রথম ভিডিও
    }

    // API থেকে ডাউনলোড লিংক নেওয়া
    const { data } = await axios.get(`${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp4&quality=${qualityWanted}`);
    const { title, quality, downloadLink } = data;

    if (waitingMsg) api.unsendMessage(waitingMsg.messageID);

    // TinyURL
    let shortenedLink;
    try {
      shortenedLink = (await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`)).data;
    } catch {
      shortenedLink = downloadLink;
    }

    return api.sendMessage(
      {
        body: `🎥 𝗩𝗶𝗱𝗲𝗼 𝗙𝗲𝘁𝗰𝗵𝗲𝗱 🎥\n\n🔖 Title: ${title}\n✨ Quality: ${quality}\n\n📥 Download: ${shortenedLink}`,
        attachment: await global.utils.getStreamFromURL(downloadLink, `${title}.mp4`)
      },
      event.threadID,
      event.messageID
    );
  } catch (e) {
    return api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
  }
};
