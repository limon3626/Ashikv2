module.exports.config = {
	name: "language",
	version: "1.0.1",
	hasPermssion: 2,
	credits: "Ashik",
	description: "Change BOT language",
	commandCategory: "System",
	usages: "[vi] [en] [bn]",
	cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    switch (args[0]) {
        case "vietnames":
        case "vi":
            return api.sendMessage(`Ngôn ngữ đã được chuyển sang tiếng Việt`, threadID, () => global.config.language = "vi"); 
        
        case "english":
        case "en":
            return api.sendMessage(`Language has been converted to English`, threadID, () => global.config.language = "en"); 
        
        case "bangla":
        case "bn":
            return api.sendMessage(`ভাষা পরিবর্তন করা হয়েছে বাংলায় 🇧🇩`, threadID, () => global.config.language = "bn"); 
        
        default:
            return api.sendMessage("Syntax error, use: language [vi / en / bn]", threadID, messageID);
    }	
}
