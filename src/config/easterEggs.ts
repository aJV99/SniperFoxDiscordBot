/**
 * Easter egg configuration
 * Defines trigger conditions and responses for special messages
 */

import { Message } from 'discord.js';
import { getRandomGif } from '../utils/gifCache';
import { config } from './env';

export interface EasterEgg {
    trigger: string;
    response: string;
    requiresSpecialGuild?: boolean; // If true, only works in guilds listed in SPECIAL_GUILD_IDS env var
    userId?: string;
    type: 'exact' | 'startsWith' | 'includes' | 'word';
    customHandler?: (message: Message) => void | Promise<void>;
}

export const EASTER_EGGS: EasterEgg[] = [
    // Global easter eggs (work in any server)
    {
        trigger: 'HELLO THERE',
        response: 'General Kenobi',
        type: 'exact',
    },
    {
        trigger: 'SHEGO',
        response: 'https://tenor.com/view/lets-go-hair-wind-kim-possible-blow-kiss-gif-16086426',
        type: 'word',
    },
    {
        trigger: 'LEAN',
        response: 'https://i.kym-cdn.com/photos/images/original/002/311/048/281.jpg',
        type: 'word',
    },
    {
        trigger: 'GOOFY',
        response: 'goofy ahh uncle :skull:',
        type: 'word',
    },
    {
        trigger: 'BA',
        response: 'stfu sheep',
        type: 'word',
    },
    {
        trigger: 'BM',
        response: '', // Handled by custom handler
        type: 'word',
        customHandler: message => {
            const startTime = '00:00:00';
            const endTime = '11:00:00';
            const currentDate = new Date();

            const startDate = new Date(currentDate.getTime());
            startDate.setHours(Number(startTime.split(':')[0]));
            startDate.setMinutes(Number(startTime.split(':')[1]));
            startDate.setSeconds(Number(startTime.split(':')[2]));

            const endDate = new Date(currentDate.getTime());
            endDate.setHours(Number(endTime.split(':')[0]));
            endDate.setMinutes(Number(endTime.split(':')[1]));
            endDate.setSeconds(Number(endTime.split(':')[2]));

            const valid = startDate < currentDate && endDate > currentDate;

            if (valid) {
                message.reply(
                    'https://cdn.discordapp.com/attachments/973383667797852190/975175462160564254/itsdatboyo-01102021-0001.mp4'
                );
            } else {
                message.reply(
                    'You silly silly boi. it aint morning any more. Try the `ba` command.'
                );
            }
        },
    },

    // Special guild easter eggs (requires guild ID in SPECIAL_GUILD_IDS env var)
    {
        trigger: 'HMM',
        response:
            'https://media.discordapp.net/attachments/782318550668148817/950797718337495071/abs.gif',
        requiresSpecialGuild: true,
        userId: '766238802917457931',
        type: 'word',
    },
    {
        trigger: 'NUNCHLAX',
        response: 'No matter what the crime or evidence, Jamal definitely did it',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'JAMAL',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/982266350938501210/calmdown.mp4',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'VAPE',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974444218426736660/vapegabriel.gif',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'NIGEED',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974441802230796349/SmartSelect_20220512-234342_Instagram.jpg',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'GABRIEL',
        response: "wasn't gabriel an angel? this gabriel a demon",
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'HAMZA',
        response: 'https://tenor.com/view/gacha-heat-gif-16974782483004850675',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'JONATHAN',
        response: 'https://tenor.com/view/jonathan-funny-hogsmoss-fortnite-chungus-gif-17799912',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'UMAR',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974457690619248670/umarhehe.mp4',
        requiresSpecialGuild: true,
        type: 'word',
    },
    {
        trigger: 'SIU',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974443635598827530/muchas_gracias.mp4',
        requiresSpecialGuild: true,
        type: 'includes',
    },

    // Kirk easter egg - random Giphy GIF with smart caching
    {
        trigger: 'KIRK',
        response: '', // Handled by custom handler
        type: 'includes',
        customHandler: async message => {
            try {
                const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

                // Use cached GIF system to reduce API calls and avoid repeats
                const gifUrl = await getRandomGif(
                    'charlie kirk',
                    config.giphy.apiKey,
                    GIPHY_ENDPOINT
                );
                await message.reply(gifUrl);
            } catch (error) {
                console.error('[ERROR] Failed to fetch Kirk GIF:', error);
                // Fallback to a classic Kirk GIF
                message.reply('https://giphy.com/embed/86xysQ3mgsJ9nQemb4');
            }
        },
    },
];
