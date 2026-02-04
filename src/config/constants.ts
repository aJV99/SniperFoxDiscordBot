/**
 * Application-wide constants and configuration values
 */

// Bot Configuration
export const SNIPER_FOX_BOT_ID = '967171515063865384';
export const MAX_STORED_MESSAGES = 10;

// File Paths
export const DATA_FILE_PATH = 'data.json';

// Interaction Timeouts
export const INTERACTION_TIMEOUT_MS = 30000; // 30 seconds

// Random Event Probabilities
export const DELETED_MESSAGE_IMAGE_CHANCE = 0.2; // 20% chance to send image on delete

// Discord Assets
export const ICON_URL =
    'https://cdn.discordapp.com/attachments/772192764175581196/968955529315639336/SniperFoxPfp.jpg';
export const DELETED_MESSAGE_IMAGE_URL =
    'https://cdn.discordapp.com/attachments/973383667797852190/978065845269971004/unknown.png';

// Embed Colors
export const EMBED_COLORS = {
    SNIPE: '#32cd32', // Green
    LAST10_LIST: '#d56724', // Orange
    SNIPE_EDIT: '#7e21ce', // Purple
    EDIT10_LIST: '#0000f7', // Blue
    EDIT10_ERROR: '#f70000', // Red
    HELP: '#cf1a24', // Dark red
} as const;
