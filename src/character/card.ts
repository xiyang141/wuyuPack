import { lib, game, ui, get, ai, _status } from "noname";

export const card = {
	juhun_duizi: {
		fullskin: true,
		type: "doudizhu",
		multitarget: true,
		enable: true,
		async content(event, trigger, player: Player) {
			const cards = get.inpileVCardList(info => {
				if (info[0] != "basic") {
					return false;
				}
				const card = get.autoViewAs({ name: info[2] });
				return player.hasUseTarget(card, null, false);
			});
			const {
				links: [link],
			} = await player
				.chooseButton({
					createDialog: ["视为使用一张基本牌", [cards, "vcard"]],
				})
				.forResult();
			const card = get.autoViewAs({ name: link[2], isCard: false });
			await player.chooseUseTarget({
				card: card,
				nodistance: true,
				addCount: false,
			});
		},
	},
	juhun_santiao: {
		fullskin: true,
		type: "doudizhu",
		multitarget: true,
		enable: true,
		async content(event, trigger, player: Player) {
			const targets = [player.getPrevious(), player.getNext()];
			await game.doAsyncInOrder(targets, async target => {
				await player.gainPlayerCard({
					target: target,
					position: "he",
				});
			});
		},
	},
	juhun_zhadan: {
		fullskin: true,
		type: "doudizhu",
		multitarget: true,
		enable: true,
		async content(event, trigger, player: Player) {
			const {
				targets: [target],
			} = await player
				.chooseTarget({
					prompt: "选择一名角色对其造成2点伤害",
				})
				.forResult();
			await target.damage({
				source: player,
				num: 2,
			});
		},
	},
	juhun_shunzi: {
		fullskin: true,
		type: "doudizhu",
		multitarget: true,
		enable: true,
		async content(event, trigger, player: Player) {
			const {
				targets: [target],
			} = await player
				.chooseTarget({
					prompt: "将一名角色随机两张牌变为扑克牌。",
				})
				.forResult();
			const cards = target.getCards("h").randomGets(2);
			target.addGaintag(cards, "juhun");
		},
	},
};
