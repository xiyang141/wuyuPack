import { lib, game, ui, get, ai, _status } from "noname";
import { character } from "./character";
import { characterSort } from "./characterSort";
import { initSkill } from "./skill";
import { translate } from "./translate";
import { voice } from "./voice";

let characterInit1 = () => {
	game.import("character", () => {
		return {
			name: "wuyu_pack",
			connect: true,
			character: {
				...character,
			},
			characterSort: {
				wuyu_pack: characterSort,
			},
			translate: {
				...translate,
				...voice,
			},
		};
	});
};

let characterInit2 = () => {
	let wuyu_poptip = [
		{
			id: "wuyu_liandan",
			name: "炼丹",
			type: "character",
			info: "将两张牌置入弃牌堆，根据这两张牌获得效果",
		},
	];
	wuyu_poptip.forEach(item => lib.poptip.add(item));
	lib.namePrefix.set("语", { showName: "语", color: "#c516f6ff" });
};

export { characterInit1, characterInit2, initSkill };
