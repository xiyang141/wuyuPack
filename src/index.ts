import { lib, game, ui, get, ai, _status } from "noname";
import { createApp } from "vue";
import bp from "./bp/index.vue";

let initCss = () => {
	lib.init.css(lib.assetURL + "extension/无语包/src/bp", "index");
	lib.init.css(lib.assetURL + "extension/无语包/src/charactercard", "index");
};

let initSkin = () => {
	_status.wySkin = {};
};

let bpInit = () => {
	if (lib.config.extension_无语包_wybp) {
		game.saveExtensionConfig("无语包", "wybp", {
			plan: "plan0",
			plans: {
				plan0: "方案一",
			},
			plan0: [],
			ai: [],
		});
	}
};
let openBp = () => {
	game.pause2();
	let bpBg = ui.create.div(document.body, ".wy-bpBg");
	let app = createApp(bp);
	app.mount(bpBg);
	ui.click.wuyu_bpClose = () => {
		app.unmount();
		bpBg.remove();
	};
};

let createBp = () => {
	ui.create.system("禁将", () => {
		openBp();
	});
};

export { createBp, bpInit, initCss, initSkin };
