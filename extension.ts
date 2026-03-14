import { lib, game, ui, get, ai, _status } from "noname";
import { erudaInit } from "./src/eruda/index";
import { initCss, bpInit, createBp, initSkin } from "./src/index";
import { addSht } from "./src/rgmode/index";

game.import("extension", () => {
	return {
		name: "无语包",
		connect: true,
		connectBanned: [],
		precontent(config, pack) {
			addSht();
			initCss();
			erudaInit();
			bpInit();
		},
		prepare(config, pack) {},
		content(config, pack) {},
		arenaReady(config, pack) {
			initSkin();
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
