import { ui, lib, game } from "noname";
import { createApp } from "vue";
import _sfc_main from "./index.vue.js";
const bpInit = () => {
  lib.init.css(lib.assetURL + "extension/无语包/src/bp", "style");
  if (!lib.config.extension_无语包_wybp) {
    game.saveExtensionConfig("无语包", "wybp", {
      plan: "plan0",
      plans: {
        plan0: "方案一"
      },
      plan0: [],
      ai: []
    });
  }
};
const openBp = () => {
  game.pause2();
  const bpBg = ui.create.div(document.body, ".wy-bpBg");
  const app = createApp(_sfc_main);
  app.mount(bpBg);
  ui.click.wybpClose = () => {
    app.unmount();
    bpBg.remove();
  };
};
const createBp = () => {
  ui.create.system("禁将", () => {
    openBp();
  });
};
export {
  bpInit,
  createBp,
  openBp
};
