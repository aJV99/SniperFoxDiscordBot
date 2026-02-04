/**
 * Easter egg message handler
 * Processes special trigger phrases and responds with configured messages
 */

import { Message } from 'discord.js';
import { EASTER_EGGS } from '../config/easterEggs';
import { SNIPER_FOX_BOT_ID } from '../config/constants';
import { config } from '../config/env';

/**
 * Checks if a message matches an easter egg trigger and responds accordingly
 */
export async function handleEasterEggs(message: Message): Promise<void> {
    // Ignore bot's own messages
    if (message.author.id === SNIPER_FOX_BOT_ID) {
        return;
    }

    const upperContent = message.content.toUpperCase();
    const words = upperContent.split(' ');

    for (const egg of EASTER_EGGS) {
        // Check if easter egg requires a special guild
        if (egg.requiresSpecialGuild) {
            if (!message.guildId || !config.easterEggs.specialGuildIds.includes(message.guildId)) {
                continue;
            }
        }

        // Check user restrictions
        if (egg.userId && message.author.id !== egg.userId) {
            continue;
        }

        let matches = false;

        switch (egg.type) {
            case 'exact':
                matches = upperContent === egg.trigger;
                break;
            case 'startsWith':
                matches = upperContent.startsWith(egg.trigger);
                break;
            case 'includes':
                matches = upperContent.includes(egg.trigger);
                break;
            case 'word':
                matches = words.includes(egg.trigger);
                break;
        }

        if (matches) {
            // Use custom handler if provided
            if (egg.customHandler) {
                await egg.customHandler(message);
            } else if (egg.response) {
                await message.reply(egg.response);
            }

            // Process only the first match
            return;
        }
    }
}
