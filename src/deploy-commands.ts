/**
 * Deploy slash commands to Discord
 * Run with: pnpm deploy
 */

import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { config } from './config/env';

const commands = [
    new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('what can i say except undelete this'),
    new SlashCommandBuilder()
        .setName('last10')
        .setDescription('feelin cute, might undelete this later'),
    new SlashCommandBuilder().setName('snipedit').setDescription('dont go back on your words fam'),
    new SlashCommandBuilder()
        .setName('edit10')
        .setDescription('everything is forever on the internet ;)'),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('help me SniperFox Kenobi, youre my only hope'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.discord.botToken);

console.log('[INFO] Deploying slash commands...');
console.log(`[INFO] Client ID: ${config.discord.clientId}`);
console.log(`[INFO] Commands: ${commands.length} total`);

rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands })
    .then(() => {
        console.log('[SUCCESS] Successfully registered application commands.');
        console.log(
            '[INFO] Commands registered globally. They may take up to 1 hour to propagate.'
        );
    })
    .catch(error => {
        console.error('[ERROR] Failed to register commands:', error);
        process.exit(1);
    });
