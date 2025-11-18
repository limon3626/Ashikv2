const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "3.1",
    credits: "Ashik Edit",
    description: "Mirai: Custom Welcome Image with Random Background"
};

module.exports.run = async function({ api, event, Users }) {

    try {
        const threadID = event.threadID;

        // Get joined user info
        const addedUser = event.logMessageData.addedParticipants[0];
        const userID = addedUser.userFbId;

        const userName = await Users.getNameUser(userID);

        // Background directory inside Mirai events folder
        const bgDir = __dirname + "/welcome_bg";

        // Scan background directory
        const bgFiles = fs.readdirSync(bgDir).filter(file =>
            file.endsWith(".jpg") || file.endsWith(".png")
        );

        if (!bgFiles.length) {
            return api.sendMessage("⚠ No background images found in /events/welcome_bg/", threadID);
        }

        // Pick random background
        const randomBG = bgFiles[Math.floor(Math.random() * bgFiles.length)];
        const bgPath = path.join(bgDir, randomBG);

        // Temporary paths
        const avatarPath = __dirname + "/cache/avatar.png";
        const finalImage = __dirname + "/cache/welcome.png";

        // Fetch avatar
        const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
        const avt = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(avatarPath, Buffer.from(avt, "utf-8"));

        // Read with Jimp
        const bgImg = await Jimp.read(bgPath);
        const avatar = await Jimp.read(avatarPath);

        // Circle avatar
        avatar.circle();
        avatar.resize(260, 260);

        // Add avatar on bg (customize position here)
        bgImg.composite(avatar, 380, 80);

        // Add text on image
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        bgImg.print(font, 50, 380, `Welcome ${userName}!`);
        bgImg.print(font, 50, 430, `You're the new member of this group`);

        await bgImg.writeAsync(finalImage);

        // Send image to thread
        api.sendMessage({
            body: `✨ Welcome ${userName}!`,
            attachment: fs.createReadStream(finalImage)
        }, threadID);

        // Auto clean
        fs.unlinkSync(finalImage);
        fs.unlinkSync(avatarPath);

    } catch (e) {
        console.log(e);
        return api.sendMessage("❌ Error creating welcome image!", event.threadID);
    }
};
