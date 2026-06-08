import { lib, game, ui, get, ai, _status } from "noname";
import { contents } from "./content";
import { skills } from "./skill";

export const initSweet = () => {
	for (const content in contents) {
		lib.element.content[content] = contents[content];
	}
	for (const skill in skills) {
		lib.skill[skill] = skills[skill];
	}
	lib.init.css(lib.assetURL + "extension/无语包/src/sweet", "style");
};
