import { lib, game, ui, get, ai, _status } from "noname";

const playerFuncs = {
	dieAfter() {
		if (game.zhu.isDead()) {
			_status.wyrgFighting = false;
		} else if (game.players.length == 1) {
			_status.wyrgFighting = false;
		}
	},
};

export { playerFuncs };
