import { game } from "noname";
import { erudaInit } from "./src/eruda/index.js";
import { initcharacter } from "./src/character/index.js";
import { initSkin } from "./src/skin/index.js";
import { initCharacterCard } from "./src/charactercard/index.js";
import { createBp, bpInit } from "./src/bp/index.js";
import { initSht, addSht } from "./src/rgmode/index.js";
game.import("extension", () => {
  return {
    name: "无语包",
    connect: true,
    connectBanned: [],
    precontent(config, pack) {
      if (navigator.userAgent.includes("Android")) {
        erudaInit();
      }
      initSkin();
      initCharacterCard();
      bpInit();
      initSht();
      addSht();
    },
    prepare(config, pack) {
    },
    content(config, pack) {
    },
    arenaReady(config, pack) {
      initcharacter();
      createBp();
    },
    translate: {
      wuyupack: "无语包"
    },
    config: {},
    help: {},
    package: {
      intro: "即兴",
      author: "无语",
      diskURL: "",
      forumURL: "",
      version: "1.0"
    },
    files: {}
  };
});
