import { lib, game, ui, get, ai, _status } from "noname";

export const skill: {
	[key: string]: Skill;
} = {
	pozhen: {
		trigger: {
			source: "damageAfter",
		},
		init(player, skill) {
			player.addSkill("pozhen_num");
		},
		filter: (event, player) => {
			const history = player.getHistory("custom", evt => evt.name == "pozhen_choose")[0]?.data;
			return event.player != player && (!history || history?.length < 3);
		},
		async cost(event, trigger, player) {
			const result = await trigger.player
				.chooseButton({
					createDialog: [
						"选择一项",
						[
							[
								["num", `令${get.translation(player)}本回合对你使用牌无距离次数限制`],
								["give", `交给${get.translation(player)}一个区域的所有牌`],
								["lose", "调整体力上限至1并失去所有技能"],
							],
							"textbutton",
						],
					],
					filterButton(button) {
						let player = get.player();
						if (button.link == "give") {
							return player.countCards("hej") > 0;
						}
						const history = player.getHistory("custom", evt => evt.name == "pozhen_choose")[0]?.data;
						return !history?.includes(button.link);
					},
					forced: true,
					ai(button) {
						const player = get.player(),
							source = get.event().source;
						if (button.link == "num") {
							const num = source.getcardUsable("sha"),
								cards = source.getCards("h"),
								sha = source.hasUsableCard("sha");
							_status.pozhen = {
								use: sha,
								has: num > 0 || cards.length > 3,
								res: false,
							};
							_status.pozhen.res = _status.pozhen.has && !_status.pozhen.use;
							return _status.pozhen.res ? 3 : 5;
						} else if (button.link == "give") {
							if (get.attitude(player, source) < 0) {
								if (!_status.pozhen.res) {
									let bool = [0, 0];
									for (let card of player.getCards("hej")) {
										if (card.name == "zhuge" && source.canEquip(card)) {
											bool[0] = 1;
										} else if (card.name == "sha") {
											bool[1] = 1;
										}
									}
									if (bool[0] && !bool[1] && _status.pozhen.has) {
										return 3;
									} else if (bool[1] && !bool[0] && !_status.pozhen.use) {
										return 3;
									}
									return 2;
								} else {
									return player.hasUsableCard("shan") ? 3 : 5;
								}
							} else {
								return player.countCards("j") > 0 ? 5 : 3;
							}
						} else if (button.link == "lose") {
							return 1;
						}
					},
				})
				.set("source", player)
				.forResult();
			event.result = {
				bool: result.bool,
				cost_data: {
					links: result.links,
				},
			};
		},
		async content(event, trigger, player) {
			const result = event.cost_data.links[0];
			const history = trigger.player.getHistory("custom");
			const choose = history.filter(evt => evt.name == "pozhen_choose")[0]?.data;
			if (choose?.length) {
				choose.add(result);
			} else {
				history.push({
					name: "pozhen_choose",
					data: [result],
				});
			}
			if (result == "num") {
				const history = player.getHistory("custom");
				const choose = history.filter(evt => evt.name == "pozhen_num")[0]?.data;
				if (choose?.length) {
					choose.add(trigger.player);
				} else {
					history.push({
						name: "pozhen_num",
						data: [trigger.player],
					});
				}
			} else if (result == "give") {
				const result = await trigger.player
					.chooseButton({
						createDialog: [
							`令${get.translation(player)}获得你一个区域所有牌`,
							[
								[
									["h", "手牌"],
									["e", "装备区"],
									["j", "判定区"],
								],
								"textbutton",
							],
						],
						filterButton(button) {
							let player = get.player();
							return player.countCards(button.link);
						},
						forced: true,
						ai(button) {
							const player = get.player();
							return -player.countCards(button.link);
						},
					})
					.forResult();
				const cards = trigger.player.getCards(result.links[0]);
				await player.gain({
					cards: cards,
				});
			} else if (result == "lose") {
				await trigger.player.loseMaxHp(trigger.player.maxHp - 1);
				await trigger.player.removeSkills(trigger.player.getSkills(null, false, false));
			}
		},
		subSkill: {
			num: {
				mod: {
					cardUsableTarget(card, player, target, result) {
						let history = player.getHistory("custom", evt => evt.name == "pozhen_num")[0]?.data;
						if (history?.includes(target)) {
							return true;
						}
					},
					targetInRange(card, player, target, result) {
						let history = player.getHistory("custom", evt => evt.name == "pozhen_num")[0]?.data;
						if (history?.includes(target)) {
							return true;
						}
					},
				},
			},
		},
	},
	daoge: {
		enable: ["chooseToUse"],
		filter(event, player) {},
		hiddenCard(player, name) {},
		chooseButton: {
			dialog(event, player) {},
		},
	},
};
