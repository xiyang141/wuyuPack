import { lib, game, ui, get, ai, _status } from "noname";

const skills = {
	wyrg_tongqi: {
		trigger: {
			player: ["damageBegin", "loseHpBegin"],
		},
		getIndex(event, player) {
			return event.num;
		},
		async content(event, trigger, player) {
			const targets = player.getFriends().concat(player);
			await game.doAsyncInOrder(targets, async target => {
				await target.draw();
			});
		},
	},
};

export { skills };
