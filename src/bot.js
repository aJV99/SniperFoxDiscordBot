const fs = require('fs');
require('dotenv').config();

const { Client, MessageEmbed } = require('discord.js');
const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES"
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} has logged into`)
    var list = console.log(client.guilds.cache.map(g => [`${g.name}`,`${g.id}`]));
    var list = client.guilds.cache.map(g => [`${g.id}`, []]);

    if (list) {
        console.log(list);
    } else {
        console.log("Something went wrong");
    }

    const data = JSON.stringify(list);
    fs.writeFile('data.json', data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    });
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'snipe') {
		await fs.readFile('data.json', 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }
        
            const newList = JSON.parse(data.toString());
        
            console.log(newList);
    
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === `${interaction.guildId}`) {
                    const delList = newList[i][1].length;
                    if (newList[i][1].length === 0) {
                        return interaction.reply("No messages have been deleted since my last reset!")
                    }
                    var lastDelMessage = newList[i][1][delList-1];
                    console.log(lastDelMessage);
                    break;
                }
            }
            const exampleEmbed = new MessageEmbed()
                .setColor('#32cd32')
                .setTitle(`Here's the last deleted message `)
                .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
                .setDescription('You did it. You son of a bitch. You caught their deleted message!')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .addFields(
                    { name: `Who?`, value: `<@${lastDelMessage.authorId}>` },
                    { name: `What?`, value: `"${lastDelMessage.content}"` },
                    { name: `Where?`, value: `<#${lastDelMessage.channelId}>` },
                    { name: `When?`, value: `${Date(lastDelMessage.createdTimestamp)}` },
                );

            interaction.reply({ embeds: [exampleEmbed] })
            .then(() => console.log('Reply sent.'))
            .catch(console.error);
        }); 
	} else if (commandName === 'last10') {
		fs.readFile('data.json', 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }

            const newList = JSON.parse(data.toString());

            console.log(newList);

            var temp = [];
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === `${interaction.guildId}`) {
                    if (newList[i][1].length === 0) {
                        return interaction.reply("No messages have been deleted since my last reset!");
                    } else {
                        // interaction.reply("You requested the last 10 messages");
                        console.log(temp);

                        const exampleEmbed = new MessageEmbed()
                            .setColor('#d56724')
                            .setTitle('Pick an old deleted message')
                            .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
                            .setDescription('Select an deleted message you want to view and type its corresponding number in chat. (from oldest to most recent)')
                            .setTimestamp()
                            .setFooter({ text: `Requested by ${interaction.user.tag}` });

                        console.log(newList[i][1]);

                        for (let j = 0; j < newList[i][1].length; j++) {
                            exampleEmbed.addField(
                                (j + 1).toString(), `<@${newList[i][1][j].authorId}> in <#${newList[i][1][j].channelId}> **${Math.round(((new Date()).getTime() - newList[i][1][j].createdTimestamp) / 60000)} minutes** ago`
                            );
                        }

                        interaction.reply({ embeds: [exampleEmbed] })
                            .then(() => console.log('Reply sent.'))
                            .catch(console.error);

                        const filter = (message) => {
                            return message.author.id === interaction.user.id;
                        };
                        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

                        collector.on('collect', message => {
                            console.log(`Collected ${message.content}`);
                            // if (interaction.guild.me.permissions.has("MANAGE_MESSAGES", true)) {
                            //     if (Number.isInteger(Number(message.content)) && Number(message.content) > 0 && Number(message.content) <= 10) {
                            //         message.delete();
                            //     }
                            // }
                        });

                        collector.on('end', collected => {
                            console.log(`Collected ${collected.size} items`);
                            if (collected.size == 0) {
                                const exampleEmbed = new MessageEmbed()
                                    .setColor('#d56724')
                                    .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
                                    .setDescription(`<@${interaction.user.id}>, youre a dumbass. You didnt answer put any number in chat. ` + "Try `/last10` again")
                                    .setTimestamp()
                                    .setFooter({ text: `Requested by ${interaction.user.tag}` });
                                return interaction.editReply({ embeds: [exampleEmbed] })
                                    .then(() => console.log('Reply sent.'))
                                    .catch(console.error);
                            }
                            console.log(collected.at(0).content);
                            const numberAsked = Number(collected.at(0).content);
                            console.log(newList[i][1].length);
                            if (Number.isInteger(numberAsked) && numberAsked > 0 && numberAsked <= newList[i][1].length) {
                                const num = numberAsked - 1;
                                console.log(newList[i][1]);
                                const exampleEmbed = new MessageEmbed()
                                    .setColor('#32cd32')
                                    .setTitle(`Here's the deleted message you requested - #${numberAsked}`)
                                    .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
                                    .setDescription('GOTTA GO... slow? Took you long enough but you got their deleted message')
                                    .setTimestamp()
                                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                                    .addFields(
                                        { name: `Who?`, value: `<@${newList[i][1][num].authorId}>` },
                                        { name: `What?`, value: `"${newList[i][1][num].content}"` },
                                        { name: `Where?`, value: `<#${newList[i][1][num].channelId}>` },
                                        { name: `When?`, value: `${Date(newList[i][1][num].createdTimestamp)}` }
                                    );

                                interaction.editReply({ embeds: [exampleEmbed] })
                                    .then(() => console.log('Reply sent.'))
                                    .catch(console.error);
                            } else {
                                const exampleEmbed = new MessageEmbed()
                                    .setColor('#d56724')
                                    .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
                                    .setDescription(`<@${interaction.user.id}>, youre a dumbass. You didnt enter a valid number. ` + "Try `/last10` again")
                                    .setTimestamp()
                                    .setFooter({ text: `Requested by ${interaction.user.tag}` });
                                interaction.editReply({ embeds: [exampleEmbed] })
                                    .then(() => console.log('Reply sent.'))
                                    .catch(console.error);
                            }
                        });
                        break;
                    }
                }
            }
        }); 
	} else if (commandName === 'help') {
        const exampleEmbed = new MessageEmbed()
            .setColor('#cf1a24')
            .setTitle(`SniperFox Bot Commands List`)
            .setAuthor({ name: 'SniperFox', iconURL: 'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg' })
            .setDescription(`here's your help, you useless forgetful git`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .addFields(
                { name: `*In case you didn't know, Sniping is retrieving a deleted message*`, value: '\u200B' },
                { name: '`/snipe`', value: 'Snipe the last deleted message' },
                { name: '`/last10`', value: 'Snipe one of the last 10 deleted messages' },
                { name: '`/help`', value: `Mfer u know this. You're here` },
            );

        interaction.reply({ embeds: [exampleEmbed] })
            .then(() => console.log('Reply sent.'))
            .catch(console.error);
    }
});

client.on('guildCreate', (guild) => {
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        const newList = JSON.parse(data.toString());
        console.log(newList);
        newList.push([guild.id, []]);
        console.log(newList);
        const newData = JSON.stringify(newList);
        fs.writeFile('data.json', newData, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON data is saved.");
        });   
    });
    const { SlashCommandBuilder } = require('@discordjs/builders');
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');
    const { clientId, guildId, token } = require('./config.json');

    const commands = [
        new SlashCommandBuilder().setName('snipe').setDescription('what can i say except undelete this'),
        new SlashCommandBuilder().setName('last10').setDescription('feelin cute, might undelete this later'),
        new SlashCommandBuilder().setName('help').setDescription('help me SniperFox Kenobi, youre my only hope'),
    ]
        .map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(token);

    rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
})

client.on('guildDelete', (guild) => {
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        const newList = JSON.parse(data.toString());
        console.log(newList);
        for( var i = 0; i < newList.length; i++){ 
            if ( newList[i][0] === guild.id) { 
                newList.splice(i, 1); 
            }
        }
        console.log(newList);
        const newData = JSON.stringify(newList);
        fs.writeFile('data.json', newData, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON data is saved.");
        });
    });
})

client.on('messageDelete', (message) => {
    if (Number.isInteger(Number(message.content)) && Number(message.content) > 0 && Number(message.content) <= 10) {
        return console.log("SniperFox deleted a message");
    }
    console.log("Deleted Message: " + `[${message.author.tag}]: "${message.content}" at ${Date(message.createdTimestamp)}`);
    console.log(`${message.guildId}`);
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        const newList = JSON.parse(data.toString());
        console.log(newList);
        for (let i = 0; i < newList.length; i++) {
            if (newList[i][0] === `${message.guildId}`) {
                if (newList[i][1].length == 10) {
                    newList[i][1].shift();
                }
                newList[i][1].push(message);
                break;
            }
        }
        console.log(newList);
        const newData = JSON.stringify(newList);
        fs.writeFile('data.json', newData, (err) => {
            if (err) {
                throw err;
            }
            console.log("JSON data is saved - Message Deleted");
        }); 
    });
}) 

client.on('messageCreate', (message) => {
    if (message.content.toUpperCase() === '<@967171515063865384> HELP') {
        fs.readFile('data.json', 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }
            const newList = JSON.parse(data.toString());
            console.log(newList);
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === `${interaction.guildId}`) {
                    const delList = newList[i][1].length;
                    if (newList[i][1].length === 0) {
                        return interaction.reply("No messages have been deleted since my last reset!")
                    }
                    var lastDelMessage = newList[i][1][delList-1];
                    console.log(lastDelMessage);
                    break;
                }
            }
            interaction.reply(`<@${lastDelMessage.authorId}> said "${lastDelMessage.content}" at ${Date(lastDelMessage.createdTimestamp)} in <#${lastDelMessage.channelId}>`); 
        });
    }
    let words = message.content.toUpperCase().split(" ");
    if (message.content.toUpperCase() === 'HELLO THERE') {
        message.reply("General Kenobi");
    } 
    if (message.content.startsWith("GG") && (message.author.id == "159985870458322944")) {
        message.reply("https://cdn.discordapp.com/attachments/973383667797852190/974278951792967710/Oh_No.mp4");
    }
    if (message.content.toUpperCase() === "SHEGO") {
        message.reply("https://tenor.com/view/lets-go-hair-wind-kim-possible-blow-kiss-gif-16086426");
    }
    for (var i=0; i < words.length; i++) {
        if ((words[i] === "LEAN") && (message.author.id != "967171515063865384")) {
            message.reply("https://i.kym-cdn.com/photos/images/original/002/311/048/281.jpg");
        }
        if ((words[i] === "GOOFY") && (message.author.id != "967171515063865384")) {
            message.reply("goofy ahh uncle :skull:");
        }
        if ((words[i] === "CHIPMUNK") && (message.author.id != "967171515063865384")) {
            message.reply("https://tenor.com/view/odpay-2b2t-odpay2b2t-gif-22649641");
        }
    }
    // QM COMPSCI SERVER
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === 'SHAZ') {
        message.reply("Shaz sucks just as much as Sam");
    } 
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === 'JAMAL') {
        message.reply("No matter what the crime or evidence, Jamal definitely did it");
    } 
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === 'VAPE') {
        message.reply("https://cdn.discordapp.com/attachments/973383667797852190/974444218426736660/vapegabriel.gif");
    } 
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === 'NIGEED') {
        message.reply("https://cdn.discordapp.com/attachments/973383667797852190/974441802230796349/SmartSelect_20220512-234342_Instagram.jpg");
    } 
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === "GABRIEL") {
        message.reply("wasn't gabriel an angel? this gabriel a demon");
    }
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === "HAMZA") {
        message.reply("https://tenor.com/view/avarose-ava-rose-avarxse-gif-20781977");
    }
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === "JONATHAN") {
        message.reply("https://tenor.com/view/jonathan-funny-hogsmoss-fortnite-chungus-gif-17799912");
    }
    if (message.guildId == 754295468913066017 && message.content.toUpperCase() === "SAM") {
        message.reply("Sam sucks just as much as Shaz");
    }
    if (message.guildId == 754295468913066017 && message.content.toUpperCase().includes() === "SIU") {
        message.reply("https://cdn.discordapp.com/attachments/973383667797852190/974443635598827530/muchas_gracias.mp4");
    }
})

client.login(process.env.DISCORDJS_BOT_TOKEN);
