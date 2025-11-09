const fs = require("fs");
module.exports.config = {
	name: "ashik",
  	version: "1.0.1",
	hasPermssion: 0,
	credits: "Ashikur Rahman", 
	description: "hihihihi",
	commandCategory: "no prefix",
	usages: "Ashik",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event }) { 
	var { threadID, messageID } = event;

	if (
		event.body.indexOf("@Ashikur Rahman")==0 || 
		event.body.indexOf("@𝐓ɽ͜͡𝐮𝐬ʈ 𝐌̽𝐞 𝐁𝐚͜͡𝐛ɣ̈̈›› 𝐈 𝐖ɪ̽ɭɭ ဗီူံ ๛⃝𓆩𝐁ɽ͜͡𝐞̽ɑ̽𝐤 𝐘ǿ𝐮̽ɾ 𝐇𝐞̽𝐚͜͡𝐫ʈﮩﮩــﮩــــ𓆩  𓆪〘̶𑁍 〘̶𑁍𓆩⃝Ashik𓆪 † 』𓆩๏̬̬̬̬̬̬𓆪†『٭𝐱͜͡⃝ᴆ』†٭❯")==0 || 
		event.body.indexOf("@Ashikur Rahman")==0 || 
		event.body.indexOf("Ashik")==0
	) {
		var msg = {
			body: "Ashik ✨💖🥀",
			attachment: fs.createReadStream(__dirname + `/noprefix/Ashik.png`)
		}
		api.sendMessage(msg, threadID, messageID);
    	api.setMessageReaction("💔", event.messageID, (err) => {}, true)
	}
}

module.exports.run = function({ api, event }) {
	// কোনো command চালালে এখানে আসবে
}
