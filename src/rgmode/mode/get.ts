import { lib, game, ui, get, ai, _status } from "noname";

const getFuncs = {
	rawAttitude(from, to) {
		if (from.side == to.side) {
			return 10;
		} else {
			return -10;
		}
	},
};

export { getFuncs };
