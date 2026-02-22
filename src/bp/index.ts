import { lib, game, ui, get, ai, _status } from "noname";
import { createApp } from "vue";
import bp from "./components/index.vue";
let openBpDialog = () => {
	game.pause2();
	let bpBg = ui.create.div(document.body, ".wy-bpBg");
	let app = createApp(bp);
	app.mount(bpBg);
	ui.click.wuyu_bpClose = () => {
		app.unmount();
		bpBg.remove();
	};
};

export { openBpDialog };
