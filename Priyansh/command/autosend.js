const schedule = require('node-schedule');
const moment = require('moment-timezone');
const chalk = require('chalk');

module.exports.config = {
    name: 'autosent',
    version: '10.3.0',
    hasPermssion: 0,
    credits: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    description: 'Send stylish boxed messages automatically',
    commandCategory: 'group messenger',
    usages: '[]',
    cooldowns: 3
};

const emojiStyles = ['💜','💛','💞','💖','💌','🌙','☀️','🌤','🥰','😇','😻','😅','🌃'];
const fontStyles = [
    text => text,
    text => `*${text}*`,
    text => `~${text}~`,
    text => `≛ ${text} ≛`,
];

const messages = [
    { time: '12:00 AM', text: 'Ghuma raat onek hoise' },
    { time: '1:00 AM', text: 'Tumi amake chara 😘' },
    { time: '2:00 AM', text: 'Tumi akhono ghumao nai 😳' },
    { time: '3:00 AM', text: 'Valo hoibo ghum ashle 🌃' },
    { time: '4:00 AM', text: 'Ghum ashle 🌃' },
    { time: '5:00 AM', text: 'Olosh 😹' },
    { time: '6:00 AM', text: 'Assalamu Alaikum ❤️🥀' },
    { time: '7:00 AM', text: 'Uthe jao akhon 🥰' },
    { time: '8:00 AM', text: 'Uthe geso president? 😵' },
    { time: '9:00 AM', text: 'Breakfast kore akhon baby 🙈' },
    { time: '10:00 AM', text: 'Olosh ajke school/collage jabi na? 🙀' },
    { time: '11:00 AM', text: 'Amakeo aktu mone koiro 😻' },
    { time: '12:00 PM', text: 'Sobai valo thako 🌞' },
    { time: '1:00 PM', text: 'Lunch kore neo akhon 😇' },
    { time: '2:00 PM', text: 'Bolo Assalamu Alaikum 💖😇' },
    { time: '3:00 PM', text: 'Akto rest kore neo akhon 😘' },
    { time: '4:00 PM', text: 'Onek gorom ajke 🥵' },
    { time: '5:00 PM', text: 'Sob somoy khushi thako 😇' },
    { time: '6:00 PM', text: 'Akhon ki ajaira thakba 💖' },
    { time: '7:00 PM', text: 'Khushi thakle tomake valo lage 💞' },
    { time: '8:00 PM', text: 'Dinner kore neo 😋' },
    { time: '9:00 PM', text: 'Amr cute baby 💞' },
    { time: '10:00 PM', text: 'Tumi hasho sob somoy ☺️' },
    { time: '11:00 PM', text: 'Bby khabar khaiso tumi? 😻' }
];

// Function to create box style for console
function createBox(message) {
    const lines = message.split('\n');
    const width = Math.max(...lines.map(line => line.length)) + 4;
    const top = '╔' + '═'.repeat(width) + '╗';
    const bottom = '╚' + '═'.repeat(width) + '╝';
    const middle = lines.map(line => '║ ' + line.padEnd(width - 2) + ' ║').join('\n');
    return `${top}\n${middle}\n${bottom}`;
}

module.exports.onLoad = ({ api }) => {
    console.log(chalk.bold.hex("#00c300")("✅ AUTOSENT COMMAND LOADED"));
    console.log(chalk.hex("#ff69b4")("💌 Unique boxed auto messages activated!"));

    messages.forEach(({ time, text }) => {
        const [hour, minute, period] = time.split(/[: ]/);
        let hour24 = parseInt(hour, 10);
        if (period === 'PM' && hour !== '12') hour24 += 12;
        else if (period === 'AM' && hour === '12') hour24 = 0;

        const scheduledTime = moment.tz({ hour: hour24, minute: parseInt(minute, 10) }, 'Asia/Kolkata').toDate();

        schedule.scheduleJob(scheduledTime, () => {
            const emoji = emojiStyles[Math.floor(Math.random() * emojiStyles.length)];
            const font = fontStyles[Math.floor(Math.random() * fontStyles.length)];
            const messageText = font(`${emoji} ${text} ${emoji}`);

            const boxMessage = createBox(messageText);
            const colors = ['green','blue','magenta','yellow','cyan'];
            const color = colors[Math.floor(Math.random()*colors.length)];

            console.log(chalk[color](boxMessage));

            global.data.allThreadID.forEach(threadID => {
                api.sendMessage(messageText, threadID, (err) => {
                    if (err) console.error(chalk.red(`[ERROR] Failed to send to ${threadID}: ${err.message}`));
                    else console.log(chalk.green(`[SUCCESS] Sent to ${threadID}`));
                });
            });
        });
    });
};

module.exports.run = () => {};
