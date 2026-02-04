/**
 * Utility functions for creating Discord embeds
 */

import { EmbedBuilder } from 'discord.js';
import { ICON_URL } from '../config/constants';

/**
 * Creates a standardized SniperFox embed with consistent branding
 */
export function createSniperFoxEmbed(
    color: string,
    title: string,
    description: string,
    requester: string
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(color as any)
        .setTitle(title)
        .setAuthor({ name: 'SniperFox', iconURL: ICON_URL })
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: `Requested by ${requester}` });
}
