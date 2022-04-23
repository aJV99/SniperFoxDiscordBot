require('dotenv').config();

const { Client } = require('discord.js');
const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES"
    ]
});
var lastDelMessage;

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in`)
})

client.on('messageDelete', (message) => {
    console.log("Deleted Message: " + `[${message.author.tag}]: "${message.content}" at ${Date(message.createdTimestamp)}`);
    lastDelMessage = message;
}) 

client.on('message', (message) => {
    if (message.content.toUpperCase() === '<@967171515063865384> HELP') {
        message.reply(`<@${lastDelMessage.author.id}>: "${lastDelMessage.content}" at ${Date(lastDelMessage.createdTimestamp)} in ${lastDelMessage.channel}`);
    }
})

client.on('message', (message) => {
    if (message.content.toUpperCase() === 'FAKE') {
        message.reply("Skill Issue");
    }
})

client.login(process.env.DISCORDJS_BOT_TOKEN);
