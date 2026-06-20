import { lib, game, ui, get, ai, _status } from "noname";

export const dynamicTranslates: {
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
			return `有角色使用${suitStr}${typeStr}的牌时，移除记录。<span class = 'bluetext'>此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害</span>。`;
		}
		return `有角色使用${suitStr}${typeStr}的牌时，移除记录。<span class = 'firetext'>此牌结算后将其交给任意一名角色</span>。`;
	},
	twsaoting(player) {
		const state = player.storage.twsaoting;
		if (!state) {
			return "转换技，你可以将一张伤害牌当<span class = 'bluetext'>【酒】</span>使用。当你以此法使用牌指定已受伤角色为目标后，你摸一张牌。";
		}
		return "转换技，你可以将一张伤害牌当<span class = 'firetext'>【决斗】</span>使用。当你以此法使用牌指定已受伤角色为目标后，你摸一张牌。";
	},
	twhujv(player) {
		const state = player.storage.twhujv;
		if (!state) {
			return `锁定技，转换技，<span class = 'bluetext'>①你令有${get.poptip("twjianyan")}的角色手牌上限+1；</span>②你令有${get.poptip("twjizhi")}的角色使用【杀】的次数+1。`;
		}
		return `锁定技，转换技，①你令有${get.poptip("twjianyan")}的角色手牌上限+1；<span class = 'firetext'>②你令有${get.poptip("twjizhi")}的角色使用【杀】的次数+1。</span>`;
	},
	twsuzhen(player) {
		const state = player.storage.twsaoting;
		if (!state) {
			return "转换技，你可以将一张非伤害牌当<span class = 'bluetext'>【杀】</span>使用。当你以此法使用牌指定未受伤角色为目标后，你摸一张牌。";
		}
		return "转换技，你可以将一张非伤害牌当<span class = 'firetext'>【无中生有】</span>使用。当你以此法使用牌指定未受伤角色为目标后，你摸一张牌。";
	},
	wuyu_dandao(player) {
		const { draw, recover, skills, skill, zhanfas, zhanfa, phase, zhan, add, maxhp, effectCount, baseDamage, kanpo, judge, niepan, change } = player.getStorage("wuyu_dandao");
		return `你视为拥有以下效果:<br>
	1.每回合首次失去某种牌时/每回合首次成为某种牌的目标后/濒死时,你摸${draw}张牌然后重铸两张牌或获得${draw}点护甲,若这两张牌:<br>
		1.颜色相同:回复${recover}点体力并获得${recover}点护甲(未受伤额外获得1点护甲)<br>
		2.类型相同:从${skills}个技能中选择${skill}个获得<br>
		3.花色相同:从${zhanfas}个战法中选择${zhanfa}个获得<br>
		4.以上皆相同:令丹道一个效果数字+${add}<br>
		5.点数相同:视为拥有一张装备牌的效果(不会失效且独立)<br>
		6.牌名字数相同:本回合结束时执行一个自定义${phase}个阶段的回合<br>
		7.牌名相同:防止本回合受到伤害与体力流失<br>
		8.为伤害牌:获得${zhan}枚“斩”,使用牌时可移去'斩'令非自身目标本回合:1.装备失效;2.技能失效;3.无法获得护甲;4.无法回复体力;5.无法获得牌<br>
		9.皆不满足:增加${maxhp}点体力上限<br>
	2.免疫即死<br>
	3.不会被操控<br>
	4.使用牌无距离次数限制且不可响应<br>
	5.每回合限${change}次,体力值变化时视为使用一张牌库牌<br>
	6.使用牌额外结算${effectCount}次<br>
	7.使用牌基础数值+${baseDamage}点<br>
	8.每回合限${kanpo}次,任意角色使用牌时,可令其无效<br>
	9.每回合限${judge}次,任意角色判定结果确定时,可终止判定并获得判定牌<br>
	10.每回合限${niepan}次,死亡时将体力调整至体力上限并获得等量护甲<br>
	11.使用牌不受影响<br>
	12.用牌不能改变/转移/取消<br>
	13.伤害不能减少/转移/取消<br>
	14.回复不能减少/转移/取消<br>
	15.回合/阶段不能跳过/终止<br>
	16.触发技不会无效/失去<br>
	17.出牌阶段限x次和每回合限x次的技能无限制<br>
	`;
	},
};
