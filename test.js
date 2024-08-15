require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const app = express();
const token = process.env.TOKEN || '7408945050:AAHCZBZD8l2kaBSZGIGTTe_L_FtEKqamIxY';
const bot = new Telegraf(token);

// Web App Link
const web_link = 'https://lunarapp.thelunarcoin.com/';
const Telegram = 'https://t.me/yourlunar_bot';

// Array to store user data
let users = [];

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

    // Add user data to users array if not already present
    if (!users.find(u => u.userId === userId)) {
      users.push({ userId, userName, urlSent });

      console.log('User added:', userId);
      console.log('Current users array:', users);
    }

    let refUserId = '743737380'; // Default referral ID

    if (startPayload.startsWith('ref_')) {
      refUserId = startPayload.split('_')[1];
      if (refUserId === userId) {
        refUserId = '743737380'; // Use default if referral ID is same as user ID
      }
    }

    // Debugging output
    console.log(`Parsed refUserId: ${refUserId}`);

    // Notify refUserId about the new referral
    if (refUserId !== '743737380') { // Only notify if refUserId is not the default
      try {
        console.log(`Attempting to notify refUserId: ${refUserId}`);
        const refUserChat = await bot.telegram.getChat(refUserId);
        console.log(`Chat details for refUserId ${refUserId}:`, refUserChat);

        await bot.telegram.sendMessage(refUserId, `🎉 Great news! ${userName} just joined using your referral link! 🌕`);
        console.log(`Message sent to refUserId: ${refUserId}`);
      } catch (notifyError) {
        console.error(`Error sending referral notification to refUserId ${refUserId}:`, notifyError);
      }
    }

    // Send referral data to the backend API
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

// Total Users Command Handler
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

// Schedule notifications every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Sending notifications to users array:', users);
  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.userId, 
        `🌟 Hey ${user.userName}! 🌟\n\nDon't miss out on your chance to boost your points! 🚀✨ 
    \nClaim your farm harvest now and maximize your rewards. 
    \nRemember, early birds get the best deals! 🌕💫\n\nJoin our community and stay ahead of the game:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Launch", web_app: { url: user.urlSent } }]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Error sending message to user', user.userId, ':', err);
    }
  }
  console.log("Notifications sent to all users!");
});

// Express server setup
app.use(express.json());

// Launch the bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch(error => {
  console.error('Error launching bot:', error);
});

// Start Express server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = bot;
