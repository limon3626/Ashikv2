const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.3.0",
    credits: "Modified by ChatGPT for Ashik",
    description: "Welcome system with colorful text, borders, box, and join date",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "canvas": "",
        "axios": "",
        "jimp": ""
    }
};

// Ensure cache folder exists
module.exports.onLoad = function () {
    const cachePath = path.join(__dirname, "cache", "welcome_bg");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
};

// Jimp-based Avatar Fetch
async function getAvatar(uid) {
    try {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return await Jimp.read(response.data);
    } catch (err) {
        console.log("Avatar Load Error:", err);
        return await Jimp.read("https://i.imgur.com/8Km9tLL.png"); // default avatar
    }
}

// Random color array for username
const nameColors = ["#00ff00", "#ffa500", "#ff0000", "#ffff00", "#0000ff", "#800080", "#000000"];

// Function to draw bordered text
function drawTextWithBorder(ctx, text, x, y, font, fillColor, borderColor = "#000000") {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.lineWidth = 6;
    ctx.strokeStyle = borderColor;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
}

module.exports.run = async function ({ api, event }) {
    const threadID = event.threadID;
    const added = event.logMessageData.addedParticipants;

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const memberCount = threadInfo.participantIDs.length;
        const threadName = threadInfo.threadName || "this group";

        for (const user of added) {
            const name = user.fullName;
            const uid = user.userFbId || user.userId;

            // Fetch avatar using Jimp
            const avatarJimp = await getAvatar(uid);
            const avatarBuffer = await avatarJimp.getBufferAsync(Jimp.MIME_PNG);
            const avatar = await Canvas.loadImage(avatarBuffer);

            // Background (choose random or default)
            const bgFolder = path.join(__dirname, "cache", "welcome_bg");
            const bgFiles = fs.readdirSync(bgFolder);
            let bg;
            if (bgFiles.length > 0) {
                const randomBG = bgFiles[Math.floor(Math.random() * bgFiles.length)];
                bg = await Canvas.loadImage(path.join(bgFolder, randomBG));
            } else {
                bg = await Canvas.loadImage("https://i.imgur.com/Z9Z9Z9Z.png");
            }

            // Canvas Setup
            const canvas = Canvas.createCanvas(1280, 720);
            const ctx = canvas.getContext("2d");

            // Draw background
            ctx.drawImage(bg, 0, 0, 1280, 720);

            // Box overlay for text
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(140, 350, 1000, 300);

            // Circular avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(640, 230, 150, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 490, 80, 300, 300);
            ctx.restore();

            // --- Text Styling ---

            // "Welcome to" → green, bold, with border
            drawTextWithBorder(ctx, "Welcome to", 640, 430, "bold 60px Arial Black", "#00ff00");

            // Group name → bigger, bold, green with border
            drawTextWithBorder(ctx, threadName, 640, 500, "bold 65px Arial Black", "#00ff00");

            // Username → colorful with border
            const userColor = nameColors[Math.floor(Math.random() * nameColors.length)];
            drawTextWithBorder(ctx, name, 640, 580, "bold 70px Arial Black", userColor);

            // "You are member #" → stylish, italic, shadow, border
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 10;
            drawTextWithBorder(ctx, `You are member #${memberCount}`, 640, 650, "italic 45px Arial", "#ff69b4");

            // Join Date → below, smaller, white, border
            const joinDate = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY
            drawTextWithBorder(ctx, `Joined on: ${joinDate}`, 640, 700, "italic 35px Arial", "#ffffff");

            // Save final image
            const finalPath = path.join(__dirname, "cache", `welcome_${uid}.png`);
            fs.writeFileSync(finalPath, canvas.toBuffer());

            // Send message
            api.sendMessage({
                body: `✨ Welcome ${name} ✨`,
                attachment: fs.createReadStream(finalPath)
            }, threadID, () => fs.unlinkSync(finalPath));
        }
    } catch (error) {
        console.log(error);
    }
};
