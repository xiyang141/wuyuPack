import { lib } from "noname";
import { contents } from "./content.js";
import { skills } from "./skill.js";
const initSweet = () => {
  for (const content in contents) {
    lib.element.content[content] = contents[content];
  }
  for (const skill in skills) {
    lib.skill[skill] = skills[skill];
  }
  lib.init.css(lib.assetURL + "extension/无语包/src/sweet", "style");
};
export {
  initSweet
};
