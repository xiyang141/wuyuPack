import { lib, game, ui, get, ai, _status } from "noname";
import { erudaInit } from "./src/eruda/index";
import { initCharacter } from "./src/character";
import { initSkin } from "./src/skin";
import { initCharacterCard } from "./src/charactercard";
import { bpInit, createBp } from "./src/bp";
import { initSht, addSht } from "./src/rgmode/index";
import { initSweet } from "./src/sweet/index";

game.import("extension", () => {
	return {
		name: "无语包",
		connect: true,
		editable: false,
		connectBanned: [],
		precontent(config, pack) {
			if (navigator.userAgent.includes("Android") && lib.config.extension_无语包_wuyupack_eruda) {
				erudaInit();
			}
			if (lib.config.extension_无语包_wuyupack_character) {
				initCharacter();
			}
			if (lib.config.extension_无语包_wuyupack_bp) {
				initSkin();
				initCharacterCard();
				bpInit();
			}
			if (lib.config.extension_无语包_wuyupack_sht) {
				initSht();
				addSht();
			}
			if (lib.config.extension_无语包_wuyupack_sweet) {
				initSweet();
			}
		},
		prepare(config, pack) {},
		content(config, pack) {},
		arenaReady(config, pack) {
			if (lib.config.extension_无语包_wuyupack_bp) {
				createBp();
			}
		},
		translate: {
			wuyupack: "无语包",
		},
		config: {
			wuyupack_eruda: {
				name: "调试功能",
				init: false,
			},
			wuyupack_bp: {
				name: "禁将功能",
				init: false,
			},
			wuyupack_sht: {
				name: "肉鸽模式",
				init: false,
			},
			wuyupack_character: {
				name: "部分武将",
				init: false,
			},
			wuyupack_sweet: {
				name: "自用功能",
				init: false,
			},
		},
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
