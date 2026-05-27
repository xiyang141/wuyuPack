import { lib, game, ui, get, ai, _status } from "noname";

const dynamicTranslate: {
	[key: string]: (player: Player) => string;
} = {
	jingmou(player) {
		const info = player.storage.jingmou_note;
		const storage = player.storage.jingmou;
		let suitStr, typeStr;
		if (info?.suit) {
			suitStr = get.translation(info.suit);
			typeStr = get.translation(info.type);
			if (suitStr.length) {
				suitStr = suitStr + "或";
			}
		} else {
			suitStr = "与你记录相同花色或";
			typeStr = "类型";
		}
		if (!storage) {
			return `有角色使用${suitStr}${typeStr}的牌时，移除记录。此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害`;
		}
		return `有角色使用${suitStr}${typeStr}的牌时，移除记录。此牌结算后将其交给任意一名角色。`;
	},
	taohuai(player) {
		const storage = player.storage.taohuai;
		return `你使用牌后，若此牌点数为你手牌中: ${storage ? "最小" : "最大"},你摸一张牌。否则你可弃置一张牌`;
	},
};

export { dynamicTranslate };
