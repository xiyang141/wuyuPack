import { lib, game, _status, ui } from "noname";
import { playerFuncs } from "./element/player.js";
import { content } from "./element/content.js";
import { getFuncs } from "./get.js";
import { rgTrans } from "./rgTrans.js";
import { battleStart, battleEnd } from "./rgGame.js";
import { createApp } from "vue";
import _sfc_main from "./index.vue.js";
const mode = {
  name: "wyrg",
  splash: lib.assetURL + "extension/无语包/src/rgmode/image/mode.jpg",
  init() {
    _status.mode = "wyrg";
    lib.translate.wyrg_player = lib.config.connect_nickname;
    _status.wyrgMode = {
      loadHome() {
        const bg = ui.create.div(document.body, ".wy-modeBg");
        const app = createApp(_sfc_main);
        app.mount(bg);
        this.close = () => {
          bg.remove();
          app.unmount();
        };
      }
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
    }
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
    content
  }
};
export {
  mode
};
