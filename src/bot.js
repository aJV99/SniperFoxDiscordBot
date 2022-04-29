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
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`).join('\n');
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`);
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
        
            // parse JSON object
            const newList = JSON.parse(data.toString());
        
            // print JSON object
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
	} else if (commandName === 'last10') {
		await fs.readFile('data.json', 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }
        
            // parse JSON object
            const newList = JSON.parse(data.toString());
        
            // print JSON object
            console.log(newList);
            
            var temp = [];
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === `${interaction.guildId}`) {
                    // const delList = newList[i][1].length;
                    if (newList[i][1].length === 0) {
                        return interaction.reply("No messages have been deleted since my last reset!")
                    } else {
                        interaction.reply("You requested the last 10 messages");
                    // for (let j = 0; j < newList[i][1].length; j++) {
                    //     var newVar = newList[i][1][j];
                    //     temp.push({ value: `<@${newVar.authorId}> said "${newVar.content}" at ${Date(newVar.createdTimestamp)} in <#${newVar.channelId}>` });
                        // temp.push(`<@${newVar.authorId}> said "${newVar.content}" at ${Date(newVar.createdTimestamp)} in <#${newVar.channelId}>`);
                        // var lastDelMessage = temp.join("\n");
                        // console.log(lastDelMessage);
                    
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
                            (j+1).toString(), `<@${newList[i][1][j].authorId}> in <#${newList[i][1][j].channelId}> **${Math.round(((new Date()).getTime() - newList[i][1][j].createdTimestamp)/60000)} minutes** ago` 
                        )
                    }
                    interaction.channel.send({ embeds: [exampleEmbed], ephemeral: true })
                        .then(() => console.log('Reply sent.'))
                        .catch(console.error);

                        const filter = (message) => {
                            return message.author.id === interaction.user.id;
                        };
                        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });
            
                        collector.on('collect', message => {
                            console.log(`Collected ${message.content}`);
                            // newList[i][1].pop();
                        });
            
                        collector.on('end', collected => {
                            console.log(`Collected ${collected.size} items`);
                            if (collected.size == 0) {
                                return interaction.channel.send(`<@${interaction.user.id}>, youre a dumbass. You didnt answer put any number in chat`);
                            }
                            console.log(collected.at(0).content);
                            const numberAsked = Number(collected.at(0).content);
                            console.log("!!!!!!!!!!!!!!!!" + newList[i][1].length);
                            if (Number.isInteger(numberAsked) && numberAsked > 0 && numberAsked <= newList[i][1].length) {
                                const num = numberAsked - 1;
                                console.log(newList[i][1]);
                                interaction.channel.send(`<@${newList[i][1][num].authorId}> said "${newList[i][1][num].content}" at ${Date(newList[i][1][num].createdTimestamp)} in <#${newList[i][1][num].channelId}>`);
                            } else {
                                interaction.channel.send(`<@${interaction.user.id}>, youre a dumbass. You didnt enter a valid number. ` + "Try `/last10` again");
                            }
                            
                        }); 
                    break;}
                }
            }
        }); 
	// } else if (commandName === 'trial3') {
	// 	await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
	}
});

client.on('guildCreate', (guild) => {
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`).join('\n');
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`);
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
    
        // parse JSON object
        const newList = JSON.parse(data.toString());
    
        // print JSON object
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

})

client.on('guildDelete', (guild) => {
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`).join('\n');
    // var list = client.guilds.cache.map(g => `${g.name} : ${g.id}`);
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
    
        // parse JSON object
        const newList = JSON.parse(data.toString());
    
        // print JSON object
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
    if (message.author.id  === 967171515063865384) {
        return console.log("SniperFox deleted a message");
    }
    console.log("Deleted Message: " + `[${message.author.tag}]: "${message.content}" at ${Date(message.createdTimestamp)}`);
    console.log(`${message.guildId}`);
    fs.readFile('data.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
    
        // parse JSON object
        const newList = JSON.parse(data.toString());
    
        // print JSON object
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

client.on('message', (message) => {
    if (message.content.toUpperCase() === '<@967171515063865384> HELP') {
        fs.readFile('data.json', 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }
        
            // parse JSON object
            const newList = JSON.parse(data.toString());
        
            // print JSON object
            console.log(newList);
    
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === `${message.guildId}`) {
                    if (newList[i][1] === null) {
                        return message.reply("No messages have been deleted since my last reset!")
                    }
                    var lastDelMessage = newList[i][1];
                    break;
                }
            }
            message.reply(`<@${lastDelMessage.authorId}> said "${lastDelMessage.content}" at ${Date(lastDelMessage.createdTimestamp)} in <#${lastDelMessage.channelId}>`); 
        }); 
    }
    if (message.content.toUpperCase() === 'HELLO THERE') {
        message.reply("General Kenobi");
    } 
    if (message.content.toUpperCase() === 'SHAZ') {
        message.reply("Shaz sucks");
    } 
    if (message.content.toUpperCase() === 'VAPE') {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967874867548553286/vapegabriel.gif");
    } 
    if (message.content.toUpperCase() === 'NIGEED') {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967438006506094652/Screenshot_20220423-155223_Instagram.jpg");
    } 
    if (message.author.id == "159985870458322944") {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967723087376289792/Oh_No.mp4");
    }
    if (message.content.toUpperCase() === "GABRIEL") {
        message.reply("wasn't gabriel an angel? this gabriel the demon");
    }
    if (message.content.toUpperCase() === "SHEGO") {
        message.reply("https://tenor.com/view/lets-go-hair-wind-kim-possible-blow-kiss-gif-16086426");
    }
})

client.login(process.env.DISCORDJS_BOT_TOKEN);
