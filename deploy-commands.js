export function newServer() { 
	const { SlashCommandBuilder } = require('@discordjs/builders');
	const { REST } = require('@discordjs/rest');
	const { Routes } = require('discord-api-types/v9');
	const { clientId, guildId, token } = require('./config.json');

	const commands = [
		new SlashCommandBuilder().setName('snipe').setDescription('what can i say except undelete this'),
		new SlashCommandBuilder().setName('last10').setDescription('feelin cute, might undelete this later'),
		new SlashCommandBuilder().setName('help').setDescription('help me SniperFox Kenobi, youre my only hope'),
	]
		.map(command => command.toJSON());

	const rest = new REST({ version: '9' }).setToken(token);

	rest.put(Routes.applicationCommands(clientId), { body: commands })
		.then(() => console.log('Successfully registered application commands.'))
		.catch(console.error);
}