import { BaseEventSubHandler } from './EventSub.Base.js';
import { IPubModAdd } from 'Singletons/Redis/Data.Types.js';

export default class EventSubConnect extends BaseEventSubHandler<IPubModAdd> {
	public constructor(protected Message: IPubModAdd) {
		super(Message);
	}

	protected override _handle(message: IPubModAdd): void {
		console.log('EventSubModAdd', { message });

		if (message.user_id !== Bot.ID) {
			return;
		}

		const chl = Bot.Twitch.Controller.channels.find(
			(c) => c.Id === message.broadcaster_user_id,
		);

		if (!chl) {
			console.warn('EventSub.ModAdd: Channel not found', {
				message,
			});
			return;
		}

		chl.setMod();
	}
}
