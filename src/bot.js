const fs = require('fs');
require('dotenv').config();

const { Client } = require('discord.js');
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
    var list = client.guilds.cache.map(g => [`${g.id}`, null]);

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
                    if (newList[i][1] === null) {
                        return interaction.reply("No messages have been deleted since my last reset!")
                    }
                    var lastDelMessage = newList[i][1];
                    break;
                }
            }
            interaction.reply(`<@${lastDelMessage.authorId}> said "${lastDelMessage.content}" at ${Date(lastDelMessage.createdTimestamp)} in <#${lastDelMessage.channelId}>`); 
        }); 
	// } else if (commandName === 'trial2') {
	// 	await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
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

        newList.push([guild.id, null]);

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
                newList[i][1] = message;
                break;
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
        message.reply("is a cutie - <@125225529480708096>");
    } 
    if (message.content.toUpperCase() === 'NIGEED') {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967438006506094652/Screenshot_20220423-155223_Instagram.jpg");
    } 
    if (message.author.id == "159985870458322944") {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967723087376289792/Oh_No.mp4");
    }
    if (message.author.id == "159985870458322944") {
        message.reply("https://cdn.discordapp.com/attachments/772192764175581196/967723087376289792/Oh_No.mp4");
    }
    if (message.author.id === "766238802917457931") {
        message.reply("Yes Lord");
    }
})

client.login(process.env.DISCORDJS_BOT_TOKEN);
