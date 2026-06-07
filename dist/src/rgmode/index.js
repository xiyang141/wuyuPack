import { lib, game } from "noname";
import { mode } from "./mode/index.js";
import { config } from "./mode/config.js";
const initSht = () => {
  lib.init.css(lib.assetURL + "extension/无语包/src/rgmode", "index");
};
const addSht = () => {
  game.addMode("wyRg", mode, {
    translate: "自用肉鸽",
    config
  });
};
export {
  addSht,
  initSht
};
