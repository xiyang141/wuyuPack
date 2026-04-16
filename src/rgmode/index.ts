import { lib, game, ui, get, ai, _status } from "noname";
import { characters } from "./character";
import { translates } from "./translate";
import { skills } from "./skill";
import { mode,config } from "./mode";

const initSht = () => {
	lib.init.css(lib.assetURL + "extension/无语包/src/rgmode", "index");
};

const addSht = () => {
	game.import("character", () => {
		return {
			name: "wyrg",
			character: characters,
			skill: skills,
			translate: translates,
		};
	});
	game.addMode("wyRg", mode, {
		translate: "自用肉鸽",
		config: config,
	});
};

export { initSht, addSht };
