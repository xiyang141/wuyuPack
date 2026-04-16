import { lib, game, ui, get, ai, _status } from "noname";
import { erudaInit } from "./src/eruda/index";
import { initcharacter } from "./src/character";
import { initSkin } from "./src/skin";
import { initCharacterCard } from "./src/charactercard";
import { bpInit, createBp } from "./src/bp";
import { initSht, addSht } from "./src/rgmode/index";

game.import("extension", () => {
	return {
		name: "无语包",
		connect: true,
		connectBanned: [],
		precontent(config, pack) {
			if (navigator.userAgent.includes("Android")) {
				erudaInit();
			}
			initSkin();
			initCharacterCard();
			bpInit();
			initSht();
			addSht();
		},
		prepare(config, pack) {},
		content(config, pack) {
			initcharacter();
		},
		arenaReady(config, pack) {
			createBp();
		},
		translate: {
			wuyupack: "无语包",
		},
		config: {},
		help: {},
		package: {
			intro: "即兴",
			author: "无语",
			diskURL: "",
			forumURL: "",
			version: "1.0",
		},
		files: {},
	};
});
