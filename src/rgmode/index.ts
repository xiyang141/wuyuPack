import { lib, game, ui, get, ai, _status } from "noname";
import { mode, config } from "./mode";

const initSht = () => {
	lib.init.css(lib.assetURL + "extension/无语包/src/rgmode", "index");
};

const addSht = () => {
	game.addMode("wyRg", mode, {
		translate: "自用肉鸽",
		config: config,
	});
};

export { initSht, addSht };
