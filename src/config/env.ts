/**
 * Environment configuration service
 * Validates and provides type-safe access to environment variables
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates that a required environment variable exists
 * Throws an error with a helpful message if missing
 */
function requireEnv(key: string): string {
    const value = process.env[key];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
                `Please add ${key} to your .env file.\n` +
                `See .env.example for reference.`
        );
    }

    return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * Configuration object with validated environment variables
 * All values are validated on module load - fails fast if config is invalid
 */
export const config = {
    // Discord Configuration
    discord: {
        botToken: requireEnv('DISCORD_BOT_TOKEN'),
        clientId: requireEnv('DISCORD_CLIENT_ID'),
        guildId: getEnv('DISCORD_GUILD_ID', ''), // Optional: only needed for guild-specific command registration
    },

    // GitHub Configuration (for Gist storage)
    github: {
        token: requireEnv('GITHUB_TOKEN'),
        gistId: requireEnv('GITHUB_GIST_ID'),
    },

    // Application Configuration
    app: {
        environment: getEnv('NODE_ENV', 'development'),
        useGistStorage: getEnv('USE_GIST_STORAGE', 'false') === 'true',
    },

    // Giphy Configuration (for easter eggs)
    giphy: {
        apiKey: requireEnv('GIPHY_API_KEY'),
    },
} as const;

/**
 * Type-safe config object
 * Use this throughout your application instead of process.env
 */
export type Config = typeof config;

// Validate configuration on module load
// This ensures the app won't start with invalid config
console.log('[CONFIG] Environment variables validated successfully');
console.log(`[CONFIG] Environment: ${config.app.environment}`);
console.log(`[CONFIG] Storage: ${config.app.useGistStorage ? 'GitHub Gist' : 'Local file'}`);
