/**
 * Data persistence utilities
 * Handles reading/writing message data with support for both local file and GitHub Gist
 */

import { readFile, writeFile } from 'fs/promises';
import { DATA_FILE_PATH, MAX_STORED_MESSAGES } from '../config/constants';
import { config } from '../config/env';
import { readFromGist, writeToGist, migrateToGist } from './gistStorage';

export interface SerializedMessage {
    authorId: string;
    authorTag: string;
    content: string;
    channelId: string;
    createdTimestamp: number;
    editedTimestamp: number | null;
}

export type DeletedMessageEntry = [SerializedMessage, string, string | null];
export type EditedMessageEntry = [SerializedMessage, SerializedMessage];
export type GuildData = [string, DeletedMessageEntry[], EditedMessageEntry[]];

/**
 * Reads guild data from storage (Gist or local file)
 */
export async function readGuildData(): Promise<GuildData[]> {
    try {
        if (config.app.useGistStorage) {
            return await readFromGist();
        } else {
            const data = await readFile(DATA_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('[ERROR] Error reading guild data:', err);

        // Fallback to local file if Gist fails
        if (config.app.useGistStorage) {
            console.log('[INFO] Falling back to local file...');
            try {
                const data = await readFile(DATA_FILE_PATH, 'utf-8');
                return JSON.parse(data);
            } catch (fallbackErr) {
                console.error('[ERROR] Fallback also failed:', fallbackErr);
            }
        }

        throw err;
    }
}

/**
 * Writes guild data to storage (Gist or local file)
 */
export async function writeGuildData(data: GuildData[]): Promise<void> {
    try {
        if (config.app.useGistStorage) {
            await writeToGist(data);
        } else {
            const jsonData = JSON.stringify(data, null, 2);
            await writeFile(DATA_FILE_PATH, jsonData);
        }
    } catch (err) {
        console.error('[ERROR] Error writing guild data:', err);

        // Fallback to local file if Gist fails
        if (config.app.useGistStorage) {
            console.log('[INFO] Falling back to local file...');
            const jsonData = JSON.stringify(data, null, 2);
            await writeFile(DATA_FILE_PATH, jsonData);
        }

        throw err;
    }
}

/**
 * Adds a deleted message to the guild's history
 * Maintains FIFO queue with MAX_STORED_MESSAGES limit
 */
export async function addDeletedMessage(
    guildId: string,
    message: SerializedMessage,
    deleter: string,
    image: string | null
): Promise<void> {
    const data = await readGuildData();

    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === guildId) {
            console.log('[DEBUG] Found guild, adding deleted message');

            // Remove oldest if at capacity
            if (data[i][1].length >= MAX_STORED_MESSAGES) {
                data[i][1].shift();
            }

            data[i][1].push([message, deleter, image]);
            console.log('[DEBUG] Guild now has', data[i][1].length, 'deleted messages');
            break;
        }
    }

    await writeGuildData(data);
    console.log('[SUCCESS] JSON data saved - Message Deleted');
}

/**
 * Adds an edited message to the guild's history
 * Maintains FIFO queue with MAX_STORED_MESSAGES limit
 */
export async function addEditedMessage(
    guildId: string,
    oldMessage: SerializedMessage,
    newMessage: SerializedMessage
): Promise<void> {
    const data = await readGuildData();

    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === guildId) {
            console.log('[DEBUG] Found guild, adding edited message');

            // Remove oldest if at capacity
            if (data[i][2].length >= MAX_STORED_MESSAGES) {
                data[i][2].shift();
            }

            data[i][2].push([oldMessage, newMessage]);
            console.log('[DEBUG] Guild now has', data[i][2].length, 'edited messages');
            break;
        }
    }

    await writeGuildData(data);
    console.log('[SUCCESS] JSON data saved - Message Edited');
}

/**
 * Initializes storage with guild list if empty
 * Also handles migration from local file to Gist if configured
 */
export async function initializeStorage(guildList: GuildData[]): Promise<void> {
    try {
        // Try to read existing data
        let existingData: GuildData[] = [];
        let hasLocalData = false;
        let hasGistData = false;

        // Check local file
        try {
            const localFileData = await readFile(DATA_FILE_PATH, 'utf-8');
            existingData = JSON.parse(localFileData);
            hasLocalData = existingData.length > 0;
            console.log('[DEBUG] Local file has', existingData.length, 'guilds');
        } catch {
            console.log('[INFO] No local data file found');
        }

        // Check Gist if enabled
        if (config.app.useGistStorage) {
            try {
                const gistData = await readFromGist();
                hasGistData = gistData.length > 0;
                console.log('[DEBUG] Gist has', gistData.length, 'guilds');

                // If Gist has data, use it
                if (hasGistData) {
                    existingData = gistData;
                }
            } catch (err) {
                console.log('[INFO] No Gist data found or error reading:', err);
            }
        }

        // Migration: If local file has data but Gist doesn't, migrate
        if (config.app.useGistStorage && hasLocalData && !hasGistData) {
            console.log('[INFO] Migrating local data to Gist...');
            await migrateToGist(existingData);
        }

        // Initialize if no data exists
        if (existingData.length === 0) {
            console.log('[INFO] Initializing storage with connected guilds...');
            await writeGuildData(guildList);
            console.log('[SUCCESS] Storage initialized with', guildList.length, 'guilds');
        } else {
            console.log('[INFO] Storage already contains guild data');
        }
    } catch (error) {
        console.error('[ERROR] Error during storage initialization:', error);
        console.log('[INFO] Creating new storage...');
        await writeGuildData(guildList);
        console.log('[SUCCESS] Storage created with', guildList.length, 'guilds');
    }
}

/**
 * Adds a new guild to storage
 */
export async function addGuild(guildId: string): Promise<void> {
    const data = await readGuildData();
    data.push([guildId, [], []]);
    await writeGuildData(data);
    console.log('[SUCCESS] Guild added to storage');
}

/**
 * Removes a guild from storage
 */
export async function removeGuild(guildId: string): Promise<void> {
    const data = await readGuildData();

    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === guildId) {
            data.splice(i, 1);
            break;
        }
    }

    await writeGuildData(data);
    console.log('[SUCCESS] Guild removed from storage');
}
