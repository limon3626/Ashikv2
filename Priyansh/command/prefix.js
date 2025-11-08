module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ashikur Rahman",
  description: "given prefix detail",
  commandCategory: "Dành cho Admin",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  var { threadID, messageID, body, senderID } = event;
  //if (senderID == global.data.botID) return;

  function out(data) {
    api.sendMessage(data, threadID, messageID)
  }

  var dataThread = (await Threads.getData(threadID));
  var data = dataThread.data; 
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};

  var arr = ["mpre","mprefix","prefix", "dấu lệnh", "prefix của bot là gì","daulenh", "duong", "what prefix", "freefix", "what is the prefix", "bot dead", "bots dead", "where prefix", "what is bot", "what prefix bot", "how to use bot" ,"how use bot", "where are the bots","bot not working","bot is offline","where prefix","prefx","prfix","prifx","perfix","bot not talking","where is bot"];
  
  arr.forEach(i => {
    let str = i[0].toUpperCase() + i.slice(1);
    if (body === i.toUpperCase() || body === i || str === body) {
      const prefix = threadSetting.PREFIX || global.config.PREFIX;
      if (data.PREFIX == null) {
        return out(`This Is My Prefix ⇉ [ ${prefix} ]\n💝🥀𝐎𝐖𝐍𝐄𝐑:- ☞Ashikur Rahman☜ 💫\n🖤𝚈𝚘𝚞 𝙲𝚊𝚗 𝙲𝚊𝚕𝚕 𝙷𝚒𝚖 Ashik🖤\n😳𝐇𝐢𝐬 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐢𝐝🤓:- ☞ https://www.facebook.com/profile.php?id=61578644536780👋For Any Kind Of Help Contact On Telegram  Username 👉 @Hero3636😇`)
      }
      else return out(`This Is My Prefix ⇉ [ ${prefix} ]\n💝🥀𝐎𝐖𝐍𝐄𝐑:- ☞Ashikur Rahmnan☜ 💫\n🖤𝚈𝚘𝚞 𝙲𝚊𝚗 𝙲𝚊𝚕𝚕 𝙷𝚒𝚖 Ashik🖤\n😳𝐇𝐢𝐬 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐢𝐝🤓:- ☞ https://www.facebook.com/profile.php?id=61578644536780\n👋For Any Kind Of Help Contact On Telegram  Username 👉 @Hero3636😇` + data.PREFIX)
    }
  });
};

module.exports.run = async({ event, api }) => {
  return api.sendMessage("error", event.threadID)
    }
