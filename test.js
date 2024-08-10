require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const app = express();
const token = process.env.TOKEN || '7408945050:AAHCZBZD8l2kaBSZGIGTTe_L_FtEKqamIxY';
const bot = new Telegraf(token);

// Web App Link
const web_link = 'https://lunarapp.thelunarcoin.com/';
const Telegram = 'https://t.me/yourlunar_bot';

// Start Handler
bot.start(async (ctx) => {
  try {
    const startPayload = ctx.startPayload || '';
    const userId = ctx.chat.id.toString(); // Ensure userId is a string
    const urlSent = `${web_link}?ref=${startPayload}&userId=${userId}`;
    const user = ctx.message.from;
    const userName = user.username ? `@${user.username.replace(/[-.!]/g, '\\$&')}` : user.first_name;

    const messageText = `
    *Hey, ${userName}* Prepare for an out-of-this-world adventure! 🌌🚀
    
    🚀 Let the lunar adventure begin! 🚀
        `;

    await ctx.replyWithMarkdown(messageText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Launch", web_app: { url: urlSent } }],
          [{ text: "Join Community", url: Telegram }]
        ]
      }
    });

    let refUserId = '001'; // Default referral ID

    if (startPayload.startsWith('ref_')) {
      refUserId = startPayload.split('_')[1];
      if (refUserId === userId) {
        refUserId = '001'; // Use default if referral ID is same as user ID
      }
    }

    try {
      await axios.put('https://lunarapp.thelunarcoin.com/testbackend/api/squad/add', {
        refUserId: refUserId.toString(), // Ensure refUserId is a string
        newUserId: userId.toString(), // Ensure newUserId is a string
        newUserName: userName.toString() // Ensure newUserName is a string
      });
      
    } catch (apiError) {
      console.error('Error sending referral data to API:', apiError);
    }
  } catch (error) {
    console.error('Error in start handler:', error);
  }
});

// Referral Command Handler
bot.command('referral', async (ctx) => {
  const referralCode = Math.random().toString(36).substring(7);
  ctx.reply(`Your referral code is: ${referralCode}`);
});

bot.command('totalusers', async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const totalUsers = await bot.telegram.getChatMembersCount(chatId);
    await ctx.reply(`Total number of users in this chat: ${totalUsers}`);
  } catch (error) {
    console.error('Error retrieving total users:', error);
    await ctx.reply('Error retrieving total users. Please try again later.');
  }
});


// Express server setup
app.use(express.json());

// Launch the bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch(error => {
  console.error('Error launching bot:', error);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = bot;
