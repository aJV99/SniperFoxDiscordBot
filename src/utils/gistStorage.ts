/**
 * GitHub Gist storage adapter
 * Provides persistent storage using GitHub Gists API
 */

import { config } from '../config/env';
import type { GuildData } from './storage';

const GIST_API_URL = 'https://api.github.com/gists';
const GIST_FILENAME = 'SniperFoxData.json';

/**
 * Reads data from GitHub Gist
 */
export async function readFromGist(): Promise<GuildData[]> {
    try {
        const response = await fetch(`${GIST_API_URL}/${config.github.gistId}`, {
            headers: {
                Authorization: `Bearer ${config.github.token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'SniperFox-Discord-Bot',
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const gist = (await response.json()) as { files?: { [key: string]: { content?: string } } };
        const fileContent = gist.files?.[GIST_FILENAME]?.content;

        if (!fileContent) {
            console.log('[GIST] No data found, initializing with empty array');
            return [];
        }

        return JSON.parse(fileContent);
    } catch (err) {
        console.error('[ERROR] Failed to read from Gist:', err);
        throw err;
    }
}

/**
 * Writes data to GitHub Gist
 */
export async function writeToGist(data: GuildData[]): Promise<void> {
    try {
        const response = await fetch(`${GIST_API_URL}/${config.github.gistId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${config.github.token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'SniperFox-Discord-Bot',
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(data, null, 2),
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        console.log('[SUCCESS] Data saved to Gist');
    } catch (err) {
        console.error('[ERROR] Failed to write to Gist:', err);
        throw err;
    }
}

/**
 * Migrates data from local file to Gist
 */
export async function migrateToGist(localData: GuildData[]): Promise<void> {
    console.log('[INFO] Migrating local data to Gist...');
    await writeToGist(localData);
    console.log('[SUCCESS] Migration complete!');
}
