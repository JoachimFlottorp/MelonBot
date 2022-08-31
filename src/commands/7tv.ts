import { EPermissionLevel } from '../Typings/enums.js';
import { CommandModel, TCommandContext, CommandResult } from '../Models/Command.js';
import gql, { EmoteSearchFilter } from '../SevenTVGQL.js';

export default class extends CommandModel {
	Name = '7tv';
	Ping = true;
	Description = 'Search 7TV emotes';
	Permission = EPermissionLevel.VIEWER;
	OnlyOffline = false;
	Aliases = [];
	Cooldown = 5;
	Params = [
		{
			name: 'index',
			type: 'string',
		},
		{
			name: 'exact',
			type: 'boolean',
		},
	];
	Flags = [];
	Code = async (ctx: TCommandContext): Promise<CommandResult> => {
		if (['add', 'remove'].includes(ctx.input[0])) {
			return {
				Success: true,
				Result: 'Use the remove / add comamnd instead :)',
			};
		}

		if (ctx.input[0] === undefined) {
			return {
				Success: false,
				Result: 'Please provide a search term',
			};
		}

		const filter: EmoteSearchFilter = {};
		if (ctx.data.Params.exact) {
			filter.exact_match = true;
		}

		let emotes;
		try {
			emotes = await gql
				.SearchEmoteByName(ctx.input.join(' '), filter)
				.then((res) => res.emotes);
		} catch (error) {
			return {
				Success: false,
				Result: `7TV Error: ${error}`,
			};
		}

		if (emotes.items.length === 0) {
			return {
				Success: false,
				Result: 'No emotes found :(',
			};
		}

		if (emotes.items.length > 1) {
			const index = ctx.data.Params['index']
				? parseInt(ctx.data.Params['index'] as string)
				: 0;

			// split the emotes into chunks of 5
			const chunks = [];
			for (let i = 0; i < emotes.items.length; i += 5) {
				chunks.push(emotes.items.slice(i, i + 5));
			}

			let message;
			// send based off index
			if (index < chunks.length) {
				message = chunks[index]
					.map((emote) => `${emote.name} - https://7tv.app/emotes/${emote.id}`)
					.join(' ');
			} else {
				message = `Index out of range (0-${chunks.length - 1})`;
			}

			return {
				Success: true,
				Result: message,
			};
		}
		return {
			Success: true,
			Result: `'${emotes.items[0].name}' - https://7tv.app/emotes/${emotes.items[0].id}`,
		};
	};
	LongDescription = async (prefix: string) => [
		`Searches up to 100 7TV emotes.`,
		`**Usage**: ${prefix}7tv <search term>`,
		`**Example**: ${prefix}7tv Apu`,
		`**Example**: ${prefix}7tv Apu --exact`,
		'',
		'Will return the first 5 emotes it can find',
		'If you want to see more, use the index parameter',
		`**Example**: ${prefix}7tv Apu --index=1`,
	];
}
