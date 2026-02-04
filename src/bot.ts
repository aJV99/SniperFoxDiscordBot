import http from 'http';
import {
    TextChannel,
    ReadonlyCollection,
    Client,
    EmbedBuilder,
    Guild,
    Message,
    PartialMessage,
    Interaction,
    GatewayIntentBits,
    Partials,
    AuditLogEvent,
    Events,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

// Configuration imports
import { config } from './config/env';
import {
    SNIPER_FOX_BOT_ID,
    MAX_STORED_MESSAGES,
    INTERACTION_TIMEOUT_MS,
    DELETED_MESSAGE_IMAGE_CHANCE,
    DELETED_MESSAGE_IMAGE_URL,
    EMBED_COLORS,
} from './config/constants';

// Utility imports
import { createSniperFoxEmbed } from './utils/embeds';
import {
    SerializedMessage,
    DeletedMessageEntry,
    EditedMessageEntry,
    GuildData,
    readGuildData,
    addDeletedMessage,
    addEditedMessage,
    initializeStorage,
    addGuild,
    removeGuild,
} from './utils/storage';

// Handler imports
import { handleEasterEggs } from './handlers/easterEggs';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

// Health check server for Render.com (keeps web service alive)
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
            JSON.stringify({
                status: 'ok',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                bot: client.user?.tag || 'Not ready',
            })
        );
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(config.app.port, () => {
    console.log(`[INFO] Health check server running on port ${config.app.port}`);
    console.log('[INFO] Endpoint: /health');
});

client.on(Events.ClientReady, async () => {
    console.log(`[SUCCESS] ${client.user!.tag} has logged in and is ready!`);
    console.log(`[INFO] Connected to ${client.guilds.cache.size} guilds`);
    const list: GuildData[] = client.guilds.cache.map(g => [g.id, [], []]);
    console.log(
        '[DEBUG] Guild list:',
        client.guilds.cache.map(g => [g.name, g.id])
    );

    await initializeStorage(list);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    console.log('[DEBUG] Interaction received:', interaction.type);

    if (!interaction.isChatInputCommand()) {
        console.log('[DEBUG] Not a chat input command, ignoring');
        return;
    }

    const { commandName } = interaction;
    console.log('[DEBUG] Command received:', commandName, 'from guild:', interaction.guildId);

    if (commandName === 'snipe') {
        console.log('[DEBUG] Processing snipe command...');
        try {
            console.log('[DEBUG] Reading data.json...');
            const newList = await readGuildData();
            console.log('[DEBUG] Parsed data, guilds:', newList.length);

            let lastDelMessage: DeletedMessageEntry | undefined;
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === interaction.guildId) {
                    console.log(
                        '[DEBUG] Found guild in data, deleted messages count:',
                        newList[i][1].length
                    );
                    const delList = newList[i][1].length;
                    if (newList[i][1].length === 0) {
                        console.log('[DEBUG] No deleted messages found, replying...');
                        await interaction.reply(
                            'No messages have been deleted since my last reset!'
                        );
                        return;
                    }
                    lastDelMessage = newList[i][1][delList - 1];
                    console.log('[DEBUG] Last deleted message:', lastDelMessage);
                    break;
                }
            }

            if (!lastDelMessage) {
                console.log('[DEBUG] Guild not found in data or no messages');
                return;
            }

            console.log('[DEBUG] Building embed...');

            const exampleEmbed = createSniperFoxEmbed(
                EMBED_COLORS.SNIPE,
                "Here's the last deleted message ",
                'You did it. You son of a bitch. You caught their deleted message!',
                interaction.user.tag
            ).addFields(
                { name: 'Who?', value: `<@${lastDelMessage[0].authorId}>` },
                { name: 'What?', value: `"${lastDelMessage[0].content}"` },
                { name: 'Where?', value: `<#${lastDelMessage[0].channelId}>` },
                {
                    name: 'When?',
                    value: `${new Date(lastDelMessage[0].createdTimestamp).toString()}`,
                },
                { name: 'But who did the deed of delete?', value: `${lastDelMessage[1]}` }
            );
            if (lastDelMessage[2] != null) {
                exampleEmbed
                    .addFields({
                        name: 'The below image was attached',
                        value: 'and we got that too...',
                        inline: false,
                    })
                    .setImage(lastDelMessage[2]);
            } else {
                try {
                    const url = new URL(lastDelMessage[0].content);
                    exampleEmbed
                        .addFields({
                            name: 'The below image was attached',
                            value: 'and we got that too...',
                            inline: false,
                        })
                        .setImage(url.href);
                } catch (_) {
                    console.log('Didnt work');
                }
            }
            console.log('[DEBUG] Sending reply...');
            await interaction.reply({ embeds: [exampleEmbed] });
            console.log('[DEBUG] Reply sent successfully!');
        } catch (err) {
            console.error('[ERROR] Error in snipe command:', err);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(
                        'An error occurred while fetching the deleted message.'
                    );
                } else {
                    await interaction.reply(
                        'An error occurred while fetching the deleted message.'
                    );
                }
            } catch (replyErr) {
                console.error('[ERROR] Failed to send error message:', replyErr);
            }
        }
    } else if (commandName === 'last10') {
        try {
            const newList = await readGuildData();

            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === interaction.guildId) {
                    if (newList[i][1].length === 0) {
                        await interaction.reply(
                            'No messages have been deleted since my last reset!'
                        );
                        return;
                    } else {
                        const exampleEmbed = createSniperFoxEmbed(
                            EMBED_COLORS.LAST10_LIST,
                            'Pick an old deleted message',
                            'Select an deleted message you want to view and type its corresponding number in chat. (from oldest to most recent)',
                            interaction.user.tag
                        );

                        for (let j = 0; j < newList[i][1].length; j++) {
                            exampleEmbed.addFields({
                                name: (j + 1).toString(),
                                value: `<@${newList[i][1][j][0].authorId}> in <#${newList[i][1][j][0].channelId}> **${Math.round((new Date().getTime() - newList[i][1][j][0].createdTimestamp) / 60000)} minutes** ago`,
                            });
                        }

                        await interaction.reply({ embeds: [exampleEmbed] });
                        console.log('Reply sent.');

                        const filter = (message: Message) => {
                            return message.author.id === interaction.user.id;
                        };
                        const channel = interaction.channel as TextChannel;
                        const collector = channel.createMessageCollector({
                            filter,
                            max: 1,
                            time: INTERACTION_TIMEOUT_MS,
                        });

                        collector.on('collect', (message: Message) => {
                            console.log(`Collected ${message.content}`);
                        });

                        collector.on(
                            'end',
                            async (collected: ReadonlyCollection<string, Message>) => {
                                console.log(`Collected ${collected.size} items`);
                                if (collected.size === 0) {
                                    const exampleEmbed = new EmbedBuilder()
                                        .setColor('#d56724')
                                        .setAuthor({
                                            name: 'SniperFox',
                                            iconURL:
                                                'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg',
                                        })
                                        .setDescription(
                                            `<@${interaction.user.id}>, youre a dumbass. You didnt answer put any number in chat. Try \`/last10\` again`
                                        )
                                        .setTimestamp()
                                        .setFooter({
                                            text: `Requested by ${interaction.user.tag}`,
                                        });
                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                    return;
                                }
                                const numberAsked = Number(collected.at(0)?.content);
                                if (
                                    Number.isInteger(numberAsked) &&
                                    numberAsked > 0 &&
                                    numberAsked <= newList[i][1].length
                                ) {
                                    const num = numberAsked - 1;
                                    const exampleEmbed = new EmbedBuilder()
                                        .setColor('#32cd32')
                                        .setTitle(
                                            `Here's the deleted message you requested - #${numberAsked}`
                                        )
                                        .setAuthor({
                                            name: 'SniperFox',
                                            iconURL:
                                                'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg',
                                        })
                                        .setDescription(
                                            'GOTTA GO... slow? Took you long enough but you got their deleted message'
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: `Requested by ${interaction.user.tag}` })
                                        .addFields(
                                            {
                                                name: 'Who?',
                                                value: `<@${newList[i][1][num][0].authorId}>`,
                                            },
                                            {
                                                name: 'What?',
                                                value: `"${newList[i][1][num][0].content}"`,
                                            },
                                            {
                                                name: 'Where?',
                                                value: `<#${newList[i][1][num][0].channelId}>`,
                                            },
                                            {
                                                name: 'When?',
                                                value: `${new Date(newList[i][1][num][0].createdTimestamp).toString()}`,
                                            },
                                            {
                                                name: 'But who did the deed of delete?',
                                                value: `${newList[i][1][num][1]}`,
                                            }
                                        );
                                    if (newList[i][1][num][2] != null) {
                                        exampleEmbed
                                            .addFields({
                                                name: 'The below image was attached',
                                                value: 'and we got that too...',
                                                inline: false,
                                            })
                                            .setImage(newList[i][1][num][2]!);
                                    } else {
                                        try {
                                            const url = new URL(newList[i][1][num][0].content);
                                            exampleEmbed
                                                .addFields({
                                                    name: 'The below image was attached',
                                                    value: 'and we got that too...',
                                                    inline: false,
                                                })
                                                .setImage(url.href);
                                        } catch (_) {
                                            console.log('Didnt work');
                                        }
                                    }
                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                } else {
                                    const exampleEmbed = new EmbedBuilder()
                                        .setColor('#d56724')
                                        .setAuthor({
                                            name: 'SniperFox',
                                            iconURL:
                                                'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg',
                                        })
                                        .setDescription(
                                            `<@${interaction.user.id}>, youre a dumbass. You didnt enter a valid number. Try \`/last10\` again`
                                        )
                                        .setTimestamp()
                                        .setFooter({
                                            text: `Requested by ${interaction.user.tag}`,
                                        });
                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                }
                            }
                        );
                        break;
                    }
                }
            }
        } catch (err) {
            console.error('Error in last10 command:', err);
            await interaction.reply('An error occurred while fetching deleted messages.');
        }
    } else if (commandName === 'snipedit') {
        try {
            const newList = await readGuildData();

            let lastEditMessage: EditedMessageEntry | undefined;
            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === interaction.guildId) {
                    const editList = newList[i][2].length;
                    if (newList[i][2].length === 0) {
                        await interaction.reply(
                            'No messages have been edited since my last reset!'
                        );
                        return;
                    }
                    lastEditMessage = newList[i][2][editList - 1];
                    console.log(lastEditMessage);
                    break;
                }
            }

            if (!lastEditMessage) return;

            const exampleEmbed = new EmbedBuilder()
                .setColor('#7e21ce')
                .setTitle("Here's the last edited message ")
                .setAuthor({
                    name: 'SniperFox',
                    iconURL:
                        'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg',
                })
                .setDescription('Damnnn bro you caught that mfer who said something sus in chat')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .addFields(
                    { name: 'Who?', value: `<@${lastEditMessage[0].authorId}>` },
                    {
                        name: 'What did they originally say?',
                        value: `"${lastEditMessage[0].content}"`,
                    },
                    {
                        name: 'What did they change it to?',
                        value: `"${lastEditMessage[1].content}"`,
                    },
                    { name: 'Where?', value: `<#${lastEditMessage[0].channelId}>` },
                    {
                        name: 'When did they send the message?',
                        value: `${new Date(lastEditMessage[0].createdTimestamp).toString()}`,
                    },
                    {
                        name: 'When did they edit the message?',
                        value: `${new Date(lastEditMessage[0].editedTimestamp!).toString()}`,
                    }
                );

            await interaction.reply({ embeds: [exampleEmbed] });
            console.log('Reply sent.');
        } catch (err) {
            console.error('Error in snipedit command:', err);
            await interaction.reply('An error occurred while fetching the edited message.');
        }
    } else if (commandName === 'edit10') {
        try {
            const newList = await readGuildData();

            for (let i = 0; i < newList.length; i++) {
                if (newList[i][0] === interaction.guildId) {
                    if (newList[i][2].length === 0) {
                        await interaction.reply(
                            'No messages have been edited since my last reset!'
                        );
                        return;
                    } else {
                        const exampleEmbed = createSniperFoxEmbed(
                            EMBED_COLORS.EDIT10_LIST,
                            'Pick an old edited message',
                            'Select an edited message you want to view and type its corresponding number in chat. (from oldest to most recent)',
                            interaction.user.tag
                        );

                        for (let j = 0; j < newList[i][2].length; j++) {
                            exampleEmbed.addFields({
                                name: (j + 1).toString(),
                                value: `<@${newList[i][2][j][0].authorId}> in <#${newList[i][2][j][0].channelId}> **${Math.round((new Date().getTime() - newList[i][2][j][0].createdTimestamp) / 60000)} minutes** ago`,
                            });
                        }

                        await interaction.reply({ embeds: [exampleEmbed] });
                        console.log('Reply sent.');

                        const filter = (message: Message) => {
                            return message.author.id === interaction.user.id;
                        };
                        const channel = interaction.channel as TextChannel;
                        const collector = channel.createMessageCollector({
                            filter,
                            max: 1,
                            time: INTERACTION_TIMEOUT_MS,
                        });

                        collector.on('collect', (message: Message) => {
                            console.log(`Collected ${message.content}`);
                        });

                        collector.on(
                            'end',
                            async (collected: ReadonlyCollection<string, Message>) => {
                                console.log(`Collected ${collected.size} items`);
                                if (collected.size === 0) {
                                    const exampleEmbed = createSniperFoxEmbed(
                                        EMBED_COLORS.EDIT10_ERROR,
                                        '',
                                        `<@${interaction.user.id}>, youre a dumbass. You didnt answer put any number in chat. Try \`/edit10\` again`,
                                        interaction.user.tag
                                    );
                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                    return;
                                }
                                const numberAsked = Number(collected.at(0)?.content);
                                if (
                                    Number.isInteger(numberAsked) &&
                                    numberAsked > 0 &&
                                    numberAsked <= newList[i][2].length
                                ) {
                                    const num = numberAsked - 1;
                                    const exampleEmbed = createSniperFoxEmbed(
                                        EMBED_COLORS.EDIT10_LIST,
                                        `Here's the edited message you requested - #${numberAsked}`,
                                        'im gonna make you an offer you cant refuse',
                                        interaction.user.tag
                                    ).addFields(
                                        {
                                            name: 'Who?',
                                            value: `<@${newList[i][2][num][0].authorId}>`,
                                        },
                                        {
                                            name: 'What did they originally say?',
                                            value: `"${newList[i][2][num][0].content}"`,
                                        },
                                        {
                                            name: 'What did they change it to?',
                                            value: `"${newList[i][2][num][1].content}"`,
                                        },
                                        {
                                            name: 'Where?',
                                            value: `<#${newList[i][2][num][0].channelId}>`,
                                        },
                                        {
                                            name: 'When?',
                                            value: `${new Date(newList[i][2][num][0].createdTimestamp).toString()}`,
                                        }
                                    );

                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                } else {
                                    const exampleEmbed = createSniperFoxEmbed(
                                        EMBED_COLORS.EDIT10_LIST,
                                        '',
                                        `<@${interaction.user.id}>, youre a dumbass. You didnt enter a valid number. Try \`/edit10\` again`,
                                        interaction.user.tag
                                    );
                                    await interaction.editReply({ embeds: [exampleEmbed] });
                                    console.log('Reply sent.');
                                }
                            }
                        );
                        break;
                    }
                }
            }
        } catch (err) {
            console.error('Error in edit10 command:', err);
            await interaction.reply('An error occurred while fetching edited messages.');
        }
    } else if (commandName === 'help') {
        const exampleEmbed = new EmbedBuilder()
            .setColor('#cf1a24')
            .setTitle('SniperFox Bot Commands List')
            .setAuthor({
                name: 'SniperFox',
                iconURL:
                    'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg',
            })
            .setDescription("here's your help, you useless forgetful git")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .addFields(
                {
                    name: "*In case you didn't know, Sniping is retrieving a deleted message*",
                    value: '\u200B',
                },
                { name: '`/snipe`', value: 'Snipe the last deleted message' },
                { name: '`/last10`', value: 'Snipe one of the last 10 deleted messages' },
                {
                    name: '`/snipedit`',
                    value: 'Snipe the last edited message to see what it originally was',
                },
                { name: '`/edit10`', value: 'Snipe one of the last 10 edited messages' },
                { name: '`/help`', value: "Mfer u know this. You're here" }
            );

        interaction
            .reply({ embeds: [exampleEmbed] })
            .then(() => console.log('Reply sent.'))
            .catch(console.error);
    }
});

client.on(Events.GuildCreate, async (guild: Guild) => {
    try {
        await addGuild(guild.id);
    } catch (err) {
        console.error('Error updating data.json on guild create:', err);
        throw err;
    }

    const commands = [
        new SlashCommandBuilder()
            .setName('snipe')
            .setDescription('what can i say except undelete this'),
        new SlashCommandBuilder()
            .setName('last10')
            .setDescription('feelin cute, might undelete this later'),
        new SlashCommandBuilder()
            .setName('snipedit')
            .setDescription('dont go back on your words fam'),
        new SlashCommandBuilder()
            .setName('edit10')
            .setDescription('everything is forever on the internet ;)'),
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('help me SniperFox Kenobi, youre my only hope'),
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(config.discord.botToken);

    try {
        await rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands });
        console.log('Successfully registered application commands.');
    } catch (err) {
        console.error('Error registering commands:', err);
    }
});

client.on(Events.GuildDelete, async (guild: Guild) => {
    try {
        await removeGuild(guild.id);
    } catch (err) {
        console.error('Error updating data.json on guild delete:', err);
        throw err;
    }
});

client.on(Events.MessageDelete, async (message: Message | PartialMessage) => {
    console.log('[DEBUG] MessageDelete event triggered');

    // Fetch the full message if it's partial
    if (message.partial) {
        console.log('[DEBUG] Message is partial, fetching...');
        try {
            await message.fetch();
            console.log('[DEBUG] Partial message fetched successfully');
        } catch (error) {
            console.error('[ERROR] Error fetching partial message:', error);
            return;
        }
    }

    // Type guard to ensure we have a full message
    if (!message.content || !message.author) {
        console.log('[DEBUG] Message has no content or author, skipping');
        return;
    }

    if (
        Number.isInteger(Number(message.content)) &&
        Number(message.content) > 0 &&
        Number(message.content) <= MAX_STORED_MESSAGES
    ) {
        return console.log('SniperFox deleted a message');
    }
    // FIXED: Corrected probability - was d > 0.79 (21% chance), now d < 0.2 (20% chance)
    const d = Math.random();
    if (d < DELETED_MESSAGE_IMAGE_CHANCE) {
        message.channel.isSendable() && message.channel.send(DELETED_MESSAGE_IMAGE_URL);
    }
    console.log(
        'Deleted Message: ' +
            `[${message.author.tag}]: "${message.content}" at ${new Date(message.createdTimestamp).toString()}`
    );
    console.log(`${message.guildId}`);

    let whoDel = `*You need to give <@${SNIPER_FOX_BOT_ID}> permissions to View Audit Logs to see this.*`;
    try {
        if (!message.guild) return;
        const fetchedLogs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageDelete,
        });
        const deletionLog = fetchedLogs.entries.first();
        if (!deletionLog)
            return console.log(
                `A message by ${message.author.tag} was deleted, but no relevant audit logs were found.`
            );
        const { executor, target } = deletionLog;
        if (target && message.author && target.id === message.author.id) {
            console.log(`A message by ${message.author.tag} was deleted by ${executor?.tag}.`);
            whoDel = `<@${executor?.id}>`;
        } else {
            console.log(
                `A message by ${message.author.tag} was deleted, but we don't know by who.`
            );
            whoDel = `<@${message.author.id}>`;
        }
    } catch (error) {
        console.log(error);
    }
    let image: string | null = null;
    if (message.attachments.size > 0) {
        console.log(message.attachments.first()?.url);
        image = message.attachments.first()?.url || null;
    }

    try {
        // Serialize the message to save only the data we need
        const serializedMessage: SerializedMessage = {
            authorId: message.author.id,
            authorTag: message.author.tag,
            content: message.content || '',
            channelId: message.channelId,
            createdTimestamp: message.createdTimestamp,
            editedTimestamp: message.editedTimestamp,
        };

        console.log('[DEBUG] Serialized message:', serializedMessage);

        await addDeletedMessage(message.guildId!, serializedMessage, whoDel, image);
    } catch (err) {
        console.error('[ERROR] Error saving deleted message:', err);
    }
});

client.on(
    Events.MessageUpdate,
    async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        // Fetch partial messages
        if (oldMessage.partial) {
            try {
                await oldMessage.fetch();
            } catch (error) {
                console.error('Error fetching partial old message:', error);
                return;
            }
        }
        if (newMessage.partial) {
            try {
                await newMessage.fetch();
            } catch (error) {
                console.error('Error fetching partial new message:', error);
                return;
            }
        }

        // Type guard to ensure we have full messages
        if (!oldMessage.author || !newMessage.author) {
            console.log('Message has no author, skipping');
            return;
        }

        if (oldMessage.author.id === SNIPER_FOX_BOT_ID) {
            return console.log('SniperFox edited a message');
        }
        console.log(
            'Message: ' +
                `[${oldMessage.author.tag}]: "${oldMessage.content}" at ${new Date(oldMessage.createdTimestamp).toString()}`
        );
        console.log(
            'Edited Message: ' +
                `[${newMessage.author.tag}]: "${newMessage.content}" at ${new Date(newMessage.createdTimestamp).toString()}`
        );
        console.log(`${oldMessage.guildId}`);

        try {
            // Serialize both old and new messages
            const serializedOldMessage: SerializedMessage = {
                authorId: oldMessage.author.id,
                authorTag: oldMessage.author.tag,
                content: oldMessage.content || '',
                channelId: oldMessage.channelId,
                createdTimestamp: oldMessage.createdTimestamp,
                editedTimestamp: oldMessage.editedTimestamp,
            };

            const serializedNewMessage: SerializedMessage = {
                authorId: newMessage.author.id,
                authorTag: newMessage.author.tag,
                content: newMessage.content || '',
                channelId: newMessage.channelId,
                createdTimestamp: newMessage.createdTimestamp,
                editedTimestamp: newMessage.editedTimestamp,
            };

            console.log(
                '[DEBUG] Serialized edit - Old:',
                serializedOldMessage.content,
                'New:',
                serializedNewMessage.content
            );

            await addEditedMessage(oldMessage.guildId!, serializedOldMessage, serializedNewMessage);
        } catch (err) {
            console.error('[ERROR] Error saving edited message:', err);
        }
    }
);

// THESNIPED - Easter Eggs Handler
client.on(Events.MessageCreate, handleEasterEggs);

client.login(config.discord.botToken);
