import { lib, game, ui, get, ai, _status } from "noname";
import { createApp } from "vue";
import bp from "./index.vue";

let bpInit = () => {
	lib.init.css(lib.assetURL + "extension/无语包/src/bp", "index");
	if (!lib.config.extension_无语包_wybp) {
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
	ui.click.wybpClose = () => {
		app.unmount();
		bpBg.remove();
	};
};

let createBp = () => {
	ui.create.system("禁将", () => {
		openBp();
	});
};

export { bpInit, openBp, createBp };
