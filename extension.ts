import { lib, game, ui, get, ai, _status } from "noname";
import { erudaInit } from "./src/eruda/index";
import { openBpDialog } from "./src/bp/index.js";

game.import("extension", () => {
	return {
		name: "无语包",
		connect: true,
		connectBanned: [],
		precontent(config, pack) {
			lib.init.css(lib.assetURL + "extension/无语包/src", "index");
			erudaInit();
			if (!lib.config.extension_无语包_wybp) {
				game.saveExtensionConfig("无语包", "wybp", {
					plan: "plan0",
					plans: {
						plan0: "方案一",
					},
					plan0: {
						char: [],
						sort: [],
						pack: [],
					},
					ai: {
						char: [],
						sort: [],
						pack: [],
					},
					forbid: {
						char: [],
						sort: [],
						pack: [],
					},
				});
			}
		},
		prepare(config, pack) {},
		content(config, pack) {},
		arenaReady(config, pack) {
			ui.create.system("禁将", () => {
				openBpDialog();
			});
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
