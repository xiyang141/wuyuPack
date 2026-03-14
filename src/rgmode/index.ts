import { lib, game, ui, get, ai, _status } from "noname";

let mode = {
	name: "wyrg",
	splash: lib.assetURL + "extension/无语包/src/rgmode/image/mode.jpg",
	init() {
		try {
			ui.systerm.close();
			console.log("guanbi");
		} catch {
			console.log("function is not define");
		}
	},
	start() {},
};

let config = {};

let addSht = () => {
	game.addMode("wyRg", mode, {
		extension: "无语包",
		translate: "自用肉鸽",
		congig: config,
	});
};

export { addSht };
