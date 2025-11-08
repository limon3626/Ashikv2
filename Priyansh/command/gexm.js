const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "flux",
    version: "1.1",
    author: "Redwan",
    countDown: 0,
    longDescription: { en: "Generate AI images based on your prompt." },
    category: "image",
    role: 0,
    guide: { en: "Usage: flux <your prompt>" }
  },

  onStart: async function({ api, event, args, message }) {
    // Author check
    if (!this.checkAuthor()) return message.reply("Author verification failed. Command cannot be executed.");

    const prompt = args.join(' ').trim();
    if (!prompt) return message.reply("Please provide a prompt.");

    message.reply("Creating......!", async () => {
      try {
        // API URL
        const url = `https://global-redwans-apis.onrender.com/api/flux?p=${encodeURIComponent(prompt)}&mode=flux`;
        
        const { data } = await axios.get(url);
        const imageUrl = data?.data?.[0]; // API থেকে image URL ধরে নিচ্ছি

        if (!imageUrl) return message.reply("Failed to generate the image. Please try again.");

        // Get image stream
        const stream = await getStreamFromURL(imageUrl, 'generated_image.png');

        // Send image back
        message.reply({ attachment: stream, message: "✅ Image generated successfully!" });

      } catch (err) {
        console.error(err);
        message.reply("Failed to generate the image. Please try again.");
      }
    });
  },

  checkAuthor: function() {
    return this.config.author === "Redwan";
  }
};
