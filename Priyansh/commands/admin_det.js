const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "owner",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Ashikur Rahman", 
  description: "Owner profile",
  commandCategory: "no prefix",
  usages: "admin",
  cooldowns: 5, 
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  if (body && (body.indexOf("ADMIN") == 0 || body.indexOf("Admin") == 0 || body.indexOf("/Admin") == 0 || body.indexOf("#admin") == 0)) {
    try {
      // তোমার লিংক থেকে ছবি নামাবে
      const img = (await axios.get("https://i.postimg.cc/cCnLXxmt/front.png", { responseType: "stream" })).data;
      
      var msg = {
        body: "🫅 𝐎𝐖𝐍𝐄𝐑 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 🫅",
        attachment: img
      };

      api.sendMessage(msg, threadID, messageID);
      api.setMessageReaction("🫅", event.messageID, (err) => {}, true);
    } catch (e) {
      console.log(e);
    }
  }
};

module.exports.run = function() {};
