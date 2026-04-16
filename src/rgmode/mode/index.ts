import { lib, game, ui, get, ai, _status } from "noname";
import { config } from "./config";
import { playerFuncs, content } from "./element";
import { getFuncs } from "./get";
import { rgTrans } from "./rgTrans";
import { battleStart, battleEnd } from "./rgGame";
import { createApp } from "vue";
import App from "./index.vue";

const mode = {
	name: "wyrg",
	splash: lib.assetURL + "extension/无语包/src/rgmode/image/mode.jpg",
	init() {
		_status.mode = "wyrg";
		lib.translate.wyrg_player = lib.config.connect_nickname;
		_status.wyrgMode = {
			loadHome() {
				const bg = ui.create.div(document.body, ".wy-modeBg");
				const app = createApp(App);
				app.mount(bg);
				this.close = () => {
					bg.remove();
					app.unmount();
				};
			},
		};
		_status.wyrgMode.loadHome();
	},
	start: [
		async (event, trigger, player) => {
			const { promise, resolve } = Promise.withResolvers();
			game.wyrging = resolve;
			await promise;
		},
		async (event, trigger, player) => {
			battleStart();
			await event.trigger("enterGame");
			_status.wyrgFighting = true;
			await game.phaseLoop(game.me);
		},
		(event, trigger, player) => {
			battleEnd();
			event.goto(0);
			_status.wyrgMode.loadHome();
		},
	],
	game: {},
	get: getFuncs,
	skill: {},
	card: {},
	translate: rgTrans,
	element: {
		player: playerFuncs,
		card: {},
		event: {},
		content: content,
	},
};

export { mode, config };
