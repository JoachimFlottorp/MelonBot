import { EPermissionLevel } from '../Typings/enums.js';
import { CommandModel, TCommandContext, CommandResult, ArgType } from '../Models/Command.js';
import Got from './../tools/Got.js';

interface ApiResponse {
	success: boolean;
	request_id: string;
	timestamp: string;
	data: {
		markov: string;
	} | null;
	error?: string;
}

const API_URL = 'https://staging.melon095.live/api/markov';

const makeReq = async (channel: string, seed?: string): Promise<ApiResponse> => {
	return Got('json')
		.get(API_URL, {
			searchParams: {
				channel,
				seed,
			},
			throwHttpErrors: false,
		})
		.json();
};

export default class extends CommandModel {
	Name = 'markov';
	Ping = false;
	Description = 'Generate markov chains based of chat';
	Permission = EPermissionLevel.VIEWER;
	OnlyOffline = false;
	Aliases = [];
	Cooldown = 5;
	Params = [[ArgType.String, 'channel']];
	Flags = [];
	Code = async (ctx: TCommandContext): Promise<CommandResult> => {
		const channel = (ctx.data.Params.channel as string) || ctx.channel.Name;
		const seed = ctx.input.join(' ');

		const res = await makeReq(channel, seed);

		if (!res.success) {
			console.error('Failed to query markov', { res });

			return {
				Success: false,
				Result: res.error || 'Failed to query markov',
			};
		}

		if (!res.data) {
			return {
				Success: false,
				Result: 'No data returned',
			};
		}

		return {
			Success: true,
			Result: `🔮 ${res.data.markov}`,
		};
	};
	LongDescription = async (prefix: string) => [
		`Generate markov chains based of chat`,
		``,
		`**Usage**: ${prefix}markov [seed]`,
		``,
		`**Example**: ${prefix}markov`,
		`**Example**: ${prefix}markov forsen`,
		`**Example**: ${prefix}markov --channel=forsen`,
	];
}
