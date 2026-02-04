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
    guildId?: string;
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
        type: 'exact',
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

    // QM COMPSCI SERVER specific easter eggs (Guild ID: 772192764175581194)
    {
        trigger: 'HMM',
        response:
            'https://media.discordapp.net/attachments/782318550668148817/950797718337495071/abs.gif',
        guildId: '772192764175581194',
        userId: '766238802917457931',
        type: 'exact',
    },
    {
        trigger: 'NUNCHLAX',
        response: 'No matter what the crime or evidence, Jamal definitely did it',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'JAMAL',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/982266350938501210/calmdown.mp4',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'VAPE',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974444218426736660/vapegabriel.gif',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'NIGEED',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974441802230796349/SmartSelect_20220512-234342_Instagram.jpg',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'GABRIEL',
        response: "wasn't gabriel an angel? this gabriel a demon",
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'HAMZA',
        response: 'https://tenor.com/view/gacha-heat-gif-16974782483004850675',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'JONATHAN',
        response: 'https://tenor.com/view/jonathan-funny-hogsmoss-fortnite-chungus-gif-17799912',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'UMAR',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974457690619248670/umarhehe.mp4',
        guildId: '772192764175581194',
        type: 'exact',
    },
    {
        trigger: 'SIU',
        response:
            'https://cdn.discordapp.com/attachments/973383667797852190/974443635598827530/muchas_gracias.mp4',
        guildId: '772192764175581194',
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
