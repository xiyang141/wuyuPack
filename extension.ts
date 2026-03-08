import { lib, game, ui, get, ai, _status } from "noname";
import { erudaInit } from "./src/eruda/index";
import { bpInit, createBp, initCss } from "./src/index.js";
import { characterInit1, characterInit2, initSkill } from "./src/character/index";

game.import("extension", () => {
	return {
		name: "无语包",
		connect: true,
		connectBanned: [],
		precontent(config, pack) {
			initCss();
			erudaInit();
			bpInit();
			characterInit1();
			initSkill();
		},
		prepare(config, pack) {},
		content(config, pack) {},
		arenaReady(config, pack) {
			characterInit2();
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
