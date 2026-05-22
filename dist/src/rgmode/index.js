import { lib, game } from "noname";
import { characters } from "./character.js";
import { translates } from "./translate.js";
import { skills } from "./skill.js";
import { mode } from "./mode/index.js";
import { config } from "./mode/config.js";
const initSht = () => {
  lib.init.css(lib.assetURL + "extension/无语包/src/rgmode", "index");
};
const addSht = () => {
  game.import("character", () => {
    return {
      name: "wyrg",
      character: characters,
      skill: skills,
      translate: translates
    };
  });
  game.addMode("wyRg", mode, {
    translate: "自用肉鸽",
    config
  });
};
export {
  addSht,
  initSht
};
