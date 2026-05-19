import { lib, game, ui, get, ai, _status } from "noname";
import type { GameEvent, Player } from "@/library";
import { card } from "./card";
import { content } from "../rgmode/mode/element";

export const skill: {
	[key: string]: Skill;
} = {
	//武张飞
	zisheng: {
		trigger: {
			player: ["useCard"],
		},
		filter(event, player) {
			const card = event.card;
			const num = get.number(card, false);
			const cardx = get.cardPile(card => get.number(card) == 3);
			return cardx && ["6", "9", "12"].includes(num.toString());
		},
		async cost(event, trigger, player) {
			const list = [];
			while (true) {
				const card = get.cardPile(card => get.number(card) == 3 && !list.includes(card));
				if (card) {
					list.push(card);
				} else {
					break;
				}
			}
			const cards = list.randomSort().randomGets(3);
			const { bool, links } = await player
				.chooseButton({
					prompt: "恣胜",
					createDialog: ["恣胜：选择一张点数为3的牌获得", [cards, "card"]],
					ai(button) {
						return get.value(button.link);
					},
				})
				.forResult();
			event.result = {
				bool: bool,
				cost_data: {
					cards: links,
				},
			};
		},
		async content(event, trigger, player) {
			const cards = event.cost_data.cards;
			await player.gain({ cards: cards, animate: "gain2" });
		},
		group: ["zisheng_damage"],
		subSkill: {
			damage: {
				trigger: {
					player: ["gainAfter"],
					global: ["loseAfter", "loseAsyncAfter"],
				},
				prompt2: "对其造成等同于你获得或弃置其牌数的伤害",
				check(event, player, name, indexedData) {
					const target = indexedData?.[0];
					if (!target) {
						return 0;
					}
					return get.damageEffect(target, player, player);
				},
				getIndex(event, player) {
					if (event.name == "gain") {
						if (event.source) {
							return [[event.source, event.cards.length]];
						} else {
							return 0;
						}
					} else {
						if (event.type != "discard") {
							return 0;
						}
						if ((event.discarder || event.getParent(2)?.player) != player) {
							return 0;
						}
						return game
							.filterPlayer(target => target != player)
							.map(target => [target, event.getl(target).cards2.length])
							.filter(map => map[1] > 0);
					}
				},
				filter(event, player, name, indexedData) {
					return Boolean(indexedData);
				},
				async content(event, trigger, player) {
					const map = event.indexedData;
					await map[0].damage({ num: map[1] });
				},
			},
		},
	},
	xianlue: {
		enable: "phaseUse",
		selectCard: -1,
		filterCard: false,
		selectTarget: 1,
		filterTarget: function (card, player, target) {
			if (!target.hasHistory("damage") && !target.hasHistory("lose")) {
				return false;
			}
			return !(player.getStorage("xianlue_used") || []).includes(target);
		},
		init(player) {
			player.addSkill("xianlue_used");
		},
		filter(event, player) {
			return game.hasPlayer(target => {
				if (target == player) {
					return false;
				}
				if (!target.hasHistory("damage") && !target.hasHistory("lose")) {
					return false;
				}
				return !(player.getStorage("xianlue_used") || []).includes(target);
			});
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			const list = player.storage.xianlue_used || [];
			list.add(target);
			player.setStorage("xianlue_used", list);
			const cards = target.getCards("h");
			const note = cards.map(card => get.number(card) || 0);
			const numbers = player.storage.xianlue_note || [];
			numbers.addArray(note);
			player.setStorage("xianlue_note", numbers);
			await player.viewCards(`${get.translation(target)}的手牌`, cards);
			const sub = player.storage.xianlue_dying || 0;
			if (numbers.length >= 13 - sub) {
				let count = player.storage.xianlue_count || 0;
				player.refreshSkill("haoxian");
				player.setStorage("xianlue_note", []);
				await player.draw({ num: count + 2 });
				player.setStorage("xianlue_count", ++count);
			}
		},
		group: ["xianlue_dying", "xianlue_eff"],
		subSkill: {
			used: {
				charlotte: true,
				mark: true,
				forced: true,
				popup: false,
				intro: {
					mark(dialog, storage, player) {
						const numbers = player.getStorage("xianlue_note") || [];
						dialog.addText(`本回合已对${get.translation(storage).split("、")}使用过【显略】`);
						dialog.addText(`已记录点数: ${numbers.join("、")}`);
					},
				},
				trigger: {
					player: "phaseAfter",
				},
				async content(event, trigger, player) {
					player.setStorage("xianlue_used", []);
				},
			},
			dying: {
				audio: "xianlue",
				trigger: {
					source: "dying",
				},
				forced: true,
				filter(event, player) {
					return event.reason?.name == "damage";
				},
				async content(event, trigger, player) {
					let num = player.storage.xianlue_dying || 0;
					num += 3;
					player.setStorage("xianlue_dying", num);
				},
			},
			eff: {
				audio: "xianlue",
				trigger: {
					player: "useCard",
				},
				mod: {
					targetInRange(card, player) {
						const num = get.number(card);
						const numbers = player.storage.xianlue_note || [];
						if (numbers.includes(num)) {
							return true;
						}
					},
				},
				filter(event, player) {
					const card = event.card;
					const num = get.number(card);
					const numbers = player.storage.xianlue_note || [];
					return numbers.includes(num);
				},
				forced: true,
				async content(event, trigger, player) {
					game.log(player, "令牌", event.card, "不可响应");
					trigger.directHit.addArray(game.players);
				},
			},
		},
		ai: {
			order: 10,
			result: {
				player: 10,
			},
		},
	},
	haoxian: {
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		selectCard: -1,
		filterCard: false,
		selectTarget: -1,
		filterTarget: false,
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const dis = [];
			while (true) {
				const card = get.cardPile(card => get.number(card) == 3 && !dis.includes(card), "discardPile");
				if (!card) {
					break;
				} else {
					dis.push(card);
				}
			}
			if (dis.length) {
				game.log(player, `将${get.cnNumber(dis.length)}张牌置入了牌堆`);
				const next = game.cardsGotoPile(dis);
				next.set("insert_index", () => {
					return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
				});
				await next;
			}
			const targets = game.filterPlayer(target => target != player && target.countCards("h", card => get.number(card) == 3) > 0);
			await game.doAsyncInOrder(event.targets, async target => {
				const cards = target.getCards("h").filter(card => get.number(card) == 3);
				if (cards.length) {
					await player.gain({ cards: cards, animate: "gain2" });
				}
			});
		},
		ai: {
			order: 10,
			result: {
				player(player) {
					const list = [];
					const dis = Array.from(ui.discardPile.childNodes);
					list.addArray(dis);
					const num1 = list.filter(card => get.number(card) == 3).length;
					const num2 = game.findPlayer(target => target != player && target.isMaxHandcard(true))?.countCards("h");
					if (num1 && num1 > 0 && Math.random() < 0.5) {
						return 10;
					}
					if (num1 && num1 > 3) {
						return 10;
					}
					if (num2 && num2 > 5 && Math.random() < 0.5) {
						return 10;
					}
				},
			},
		},
	},
	//牛头马面
	dianbu: {
		trigger: {
			player: ["phaseBefore", "enterGame"],
		},
		filter(event, player) {
			return game.phaseNumber == 0 || event.name != "phase";
		},
		forced: true,
		async content(event, trigger, player) {
			const cards = [];
			while (cards.length < 13) {
				const card = get.cardPile2(c => !cards.includes(c));
				if (card) {
					cards.push(card);
				} else {
					break;
				}
			}
			if (cards.length) {
				await player.gain({ cards: cards, animate: "gain2" });
			}
		},
		group: ["dianbu_effect"],
		subSkill: {
			used: {},
			effect: {
				trigger: {
					player: ["useCard"],
				},
				forced: true,
				filter(event, player) {
					const name = event.card.name;
					const used = player.getStorage("dianbu_used") || [];
					return name.startsWith("juhun_") && !used.includes(name);
				},
				mod: {
					ignoredHandcard(card, player) {
						return card.hasGaintag("dianbu_noMax");
					},
					cardDiscardable(card, player, name) {
						if (name == "phaseDiscard" && card.hasGaintag("dianbu_noMax")) {
							return false;
						}
					},
				},
				async content(event, trigger, player) {
					const name = trigger.card.name;
					const used = player.getStorage("dianbu_used") || [];
					used.push(name);
					player.setStorage("dianbu_used", used);
					const card = get.autoViewAs({ name: "wuzhong" });
					const next = player.useCard({
						card: card,
						targets: [player],
					});
					player
						.when({
							player: ["gainAfter"],
						})
						.filter((event, player) => {
							return event.getParent("useCard") == next;
						})
						.step(async (event, trigger, player) => {
							const cards = trigger.cards.filter(card => get.owner(card) == player);
							player.addGaintag(cards, "dianbu_noMax");
						});
					await next;
					if (name == "juhun_zhadan") {
						player.setStorage("dianbu_used", []);
					}
				},
			},
		},
	},
	juhun: {
		enable: ["chooseToUse"],
		init(player) {
			game.players.forEach(curr => curr.addSkill("juhun_effect"));
		},
		selectCard: [1, Infinity],
		filterCard(card, player) {
			return Boolean(game.checkMod(card, player, true, "cardEnabled", []));
		},
		selectTarget: -1,
		filterTarget: false,
		lose: false,
		delay: false,
		discard: false,
		filterOk() {
			const cards = ui.selected.cards;
			return get.info("juhun").getType(cards);
		},
		getType(cards) {
			const numbers = cards.map(card => get.number(card));
			if (numbers.some(number => typeof number != "number")) {
				return false;
			}
			const len = numbers.toUniqued().length;
			if (cards.length == 2 && numbers.toUniqued().length == 1) {
				return "duizi";
			} else if (cards.length == 3 && numbers.toUniqued().length == 1) {
				return "santiao";
			} else if (cards.length == 4 && numbers.toUniqued().length == 1) {
				return "zhadan";
			} else if (
				cards.length == 5 &&
				numbers.every((number, i, list) => {
					return number - list[i - 1] == 1;
				})
			) {
				return "shunzi";
			}
			return false;
		},
		filter(event, player) {
			if (_status.currentPhase != player || event.type != "phase") {
				return false;
			}
			const cards = player.getCards("h");
			const numbers = cards.map(card => get.number(card));
			const dsz = numbers.some(number => get.numOf(numbers, number) > 1);
			const list = numbers.filter(i => typeof i == "number").sort();
			let sz;
			if (list.length < 5) {
				sz = false;
			} else {
				sz = list.every((i, j) => i - list[j - 1] == 1);
			}
			return dsz || sz;
		},
		viewAs(cards, player) {
			const type = get.info("juhun").getType(cards);
			if (!type) return null;
			return {
				name: `juhun_${type}`,
			};
		},
		subSkill: {
			effect: {
				trigger: {
					player: ["phaseBegin", "phaseEnd"],
				},
				popup: false,
				forced: true,
				charlotte: true,
				mod: {
					cardname(card, player, currentname) {
						if (card.hasGaintag("juhun")) {
							return "hschenzhi_poker";
						}
					},
				},
				filter(event, player, name) {
					return player.hasSkill("juhun", null, false, false);
				},
				async content(event, trigger, player) {
					const cards = player.getCards("h");
					if (event.triggername == "phaseBegin") {
						player.removeGaintag("juhun", cards);
					} else if (event.triggername == "phaseEnd") {
						player.addGaintag(cards, "juhun");
					}
				},
			},
		},
	},
	//花木兰
	rongbian: {
		trigger: {
			player: ["useCard"],
		},
		forced: true,
		init(player, skill) {
			if (!_status.characterlist) {
				game.initCharacterList();
			}
			if (player.storage.rongbian_skill) return;
			const skillMap = {};
			const list = [];
			for (let char of _status.characterlist) {
				const info = get.character(char);
				if (info.sex == "female" && char != "huamulan") {
					const skills = info.skills;
					if (skills?.length) {
						skillMap[char] = skills;
						list.addArray(skills);
					}
				}
			}
			player.setStorage("rongbian_allSkill", list);
			player.setStorage("rongbian_skill", skillMap);
		},
		createCard(name, skill, player) {
			if (!lib.card["rongbian_" + name]) {
				if (lib.translate[name + "_ab"]) {
					lib.translate["rongbian_" + name] = lib.translate[name + "_ab"];
				} else {
					lib.translate["rongbian_" + name] = lib.translate[name];
				}
				const info = lib.character[name];
				const card = {
					fullimage: true,
					image: "character:" + name,
					type: "character",
					cardPrompt(card, player) {
						const skill = card.storage.romgbian_skill;
						let cardPrompt = "";
						if (lib.skill[skill].nobracket) {
							cardPrompt += '<div class="skilln">' + get.translation(skill) + '</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill)) + "</span></div><br><br>";
						} else {
							const translation = lib.translate[skill + "_ab"] || get.translation(skill).slice(0, 2);
							cardPrompt += '<div class="skill">【' + translation + '】</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill)) + "</span></div><br><br>";
						}
						return cardPrompt;
					},
					ai: {
						value(card) {
							const skill = card.storage.romgbian_skill;
							if (lib.skill[skill].ai.neg || lib.skill[skill].ai.combo) {
								return 0;
							}
							return get.skillInfoTranslation(skill).length;
						},
					},
				};
				lib.translate["rongbian_" + name + "_info"] = "一张女将牌";
				lib.card["rongbian_" + name] = card;
			}
			const card = game.createCard("rongbian_" + name, lib.suit.randomGet(), get.rand(1, 13));
			card.storage.romgbian_skill = skill;
			card.storage.rongbian_owner = player;
			card.storage.rongbian_female = true;
			return card;
		},
		filter(event, player) {
			if (get.type2(event.card, false) != "equip") return false;
			const list = player.storage.rongbian_allSkill;
			return list?.length && list.some(skill => !player.hasSkill(skill, null, false, true));
		},
		async content(event, trigger, player) {
			const skillMap = player.storage.rongbian_skill;
			const list = Object.keys(skillMap);
			const chars = list.filter(char => skillMap[char].some(skill => !player.hasSkill(skill, null, false, true)));
			const char = chars.randomGet();
			const skill = skillMap[char].filter(skill => !player.hasSkill(skill, null, false, true)).randomGet();
			const createCard = get.info("rongbian").createCard;
			const card = createCard(char, skill, player);
			await player.gain(card, "gain2");
			player.addAdditionalSkill("rongbian", skill, true);
		},
		group: ["rongbian_effect"],
		subSkill: {
			effect: {
				trigger: {
					player: ["loseAfter"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				forced: true,
				filter(event, player) {
					const evt = event.getl(player);
					return evt.cards2.some(card => card.storage.rongbian_female);
				},
				async content(event, trigger, player: Player) {
					const cards = trigger.getl(player).cards2;
					const skills = cards.map(card => card.storage.romgbian_skill).filter(skill => player.hasSkill(skill, null, false, true));
					player.removeAdditionalSkill("rongbian", skills);
					cards.forEach(card => {
						card.fix();
						card.remove();
						card.destoryed = true;
						game.log(card, "被销毁了");
					});
				},
			},
		},
	},
	hml_liedan: {
		enable: ["chooseToUse"],
		filter(event, player) {
			if (!player.countCards("hes", card => card.storage.rongbian_female)) {
				return false;
			}
			return (
				get.inpileVCardList(
					info =>
						["basic", "trick"].includes(info[0]) &&
						event.filterCard(
							{
								name: info[2],
								storage: {
									hml_liedan: true,
								},
							},
							player,
							event
						)
				).length > 0
			);
		},
		chooseButton: {
			dialog(event, player) {
				const dialog = ui.create.dialog(
					"烈胆",
					[
						get.inpileVCardList(
							info =>
								["basic", "trick"].includes(info[0]) &&
								event.filterCard(
									{
										name: info[2],
										storage: {
											hml_liedan: true,
										},
									},
									player,
									event
								)
						),
						"vcard",
					],
					"hidden"
				);
				return dialog;
			},
			backup(links) {
				return {
					viewAs: {
						name: links[0][2],
						storage: {
							hml_liedan: true,
						},
					},
					filterCard: card => card.storage.rongbian_female,
					filterTarget(card, player, target) {
						return Boolean(lib.filter.targetEnabled(card, player, target));
					},
					ai1(card) {
						return get.value(card);
					},
					position: "hes",
					async precontent(event, trigger, player) {
						event.getParent().addCount = false;
						await player.draw(2);
					},
				};
			},
			prompt(links) {
				return "将一张女将牌当无距离和次数限制的基本牌或锦囊牌使用，然后摸两张牌";
			},
		},
		locked: false,
		mod: {
			cardUsable(card) {
				if (card?.storage?.hml_liedan) {
					return Infinity;
				}
			},
			targetInRange(card) {
				if (card?.storage?.hml_liedan) {
					return Infinity;
				}
			},
		},
		subSkill: {
			backup: {},
		},
	},
	tijun: {
		limited: true,
		enable: "phaseUse",
		filterCard: false,
		selectCard: -1,
		filterTarget(card, player, target) {
			return target.sex == "male" && target.countCards("e") > 0;
		},
		init(player) {
			player.addSkill("tijun_refresh");
		},
		filter(event, player) {
			return game.hasPlayer(target => target.sex == "male" && target.countCards("e") > 0);
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			const cards = event.targets[0].getCards("e");
			player.setStorage("tijun_refresh", event.targets);
			await player.gain({
				cards: cards,
				animate: "gain2",
			});
		},
		subSkill: {
			refresh: {
				trigger: {
					source: ["dieAfter"],
				},
				filter(event, player) {
					return !player.storage.tijun_refresh?.includes(event.player);
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					player.refreshSkill("tijun");
				},
			},
		},
	},
	//乐曹植
	fuyue: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		async content(event, trigger, player) {
			const cards = player.getCards("h");
			const list = lib.inpile.filter(name => {
				if (get.type2(name) == "equip") {
					return false;
				}
				const card = get.autoViewAs({ name: name });
				return player.hasUseTarget(card, false, false);
			});
			for (let card of cards) {
				const name = list.randomGet();
				const tag = "fuyue_tag_" + name;
				if (!lib.translate[tag]) {
					game.broadcastAll(tag => (lib.translate[tag] = `赋乐-${get.translation(name)}`), tag);
				}
				player.addGaintag([card], tag);
			}
		},
		group: ["fuyue_effect"],
		subSkill: {
			tag: {},
			effect: {
				mod: {
					ignoredHandcard(card, player) {
						if (card.gaintag.some(tag => tag.startsWith("fuyue_tag_"))) {
							return true;
						}
					},
					cardDiscardable(card, player, name) {
						if (name == "phaseDiscard" && card.gaintag.some(tag => tag.startsWith("fuyue_tag_"))) {
							return false;
						}
					},
				},
				trigger: {
					player: ["useCard1"],
				},
				filter(event, player) {
					const card = event.card;
					if (!card.isCard || !card.cards?.length) {
						return false;
					}
					const tags = card.cards[0].gaintag;
					return tags.some(tag => tag.startsWith("fuyue_tag_"));
				},
				async cost(event, trigger, player) {
					const tags = trigger.card.cards[0].gaintag.filter(tag => tag.startsWith("fuyue_tag_"));
					const names = tags.map(tag => tag.slice(10));
					const { links, bool } = await player
						.chooseButton({
							createDialog: [`将${get.translation(trigger.card)}的效果改为以下一张牌：`, [[names, "vcard"]]],
						})
						.forResult();
					event.result = {
						bool: bool,
						cost_data: {
							links: links,
						},
					};
				},
				async content(event, trigger, player) {
					const { links } = event.cost_data;
					const name = links[0][2];
					const card = get.autoViewAs({ name: name, isCard: true }, trigger.cards);
					trigger.card = card;
				},
			},
		},
	},
	wenlan: {
		trigger: {
			player: ["useCardAfter"],
		},
		filter(event, player) {
			const list = game.getAllGlobalHistory("useCard", evt => evt.player == player);
			return list.length % 2 == 0;
		},
		forced: true,
		async content(event, trigger, player) {
			const list = game.getAllGlobalHistory("useCard", evt => evt.player == player).slice(-2);
			const card = list[0].card;
			const card2 = list[1].card;
			const bool1 = get.is.ordinaryCard(card) && card.cards[0].gaintag.some(tag => tag.startsWith("fuyue_tag_"));
			const bool2 = get.is.ordinaryCard(card2) && card2.cards[0].gaintag.some(tag => tag.startsWith("fuyue_tag_"));
			let noDouble = true;
			if (bool1 && bool2) {
				const names = card.cards[0].gaintag.filter(tag => tag.startsWith("fuyue_tag_")).map(tag => tag.slice(10));
				const names2 = card2.cards[0].gaintag.filter(tag => tag.startsWith("fuyue_tag_")).map(tag => tag.slice(10));
				if (names.some(name => names2.includes(name))) {
					noDouble = false;
					const cards = [];
					const list = names.concat(names2);
					while (cards.length < 2) {
						const gain = get.cardPile(card => list.includes(get.name(card, false)) && !cards.includes(card));
						cards.push(gain);
						if (!gain) {
							break;
						}
					}
					if (cards.length > 0) {
						await player.gain({ cards: cards, animate: "gain2" });
						const gain = cards.filter(c => get.owner(c) == player);
						if (gain.length > 0) {
							const cardnames = lib.inpile.filter(name => {
								if (get.type2(name) == "equip") {
									return false;
								}
								const card = get.autoViewAs({ name: name });
								return player.hasUseTarget(card, false, false);
							});
							for (let c of gain) {
								const name = cardnames.randomGet();
								const tag = "fuyue_tag_" + name;
								if (!lib.translate[tag]) {
									game.broadcastAll(tag => (lib.translate[tag] = `赋乐-${get.translation(name)}`), tag);
								}
								player.addGaintag([c], tag);
							}
						}
					}
				}
			}
			if (noDouble && player.getCards("h").some(card => !card.gaintag.some(tag => tag.startsWith("fuyue_tag_")))) {
				const { cards } = await player
					.chooseCard({
						position: "h",
						selectCard: [1, 2],
						prompt: "将至多两张手牌标记为“赋”。",
						filterCard(card, player) {
							return !card.gaintag.some(tag => tag.startsWith("fuyue_tag_"));
						},
					})
					.forResult();
				if (cards.length > 0) {
					const cardnames = lib.inpile.filter(name => {
						if (get.type2(name) == "equip") {
							return false;
						}
						const card = get.autoViewAs({ name: name });
						return player.hasUseTarget(card, false, false);
					});
					for (let c of cards) {
						const name = cardnames.randomGet();
						const tag = "fuyue_tag_" + name;
						if (!lib.translate[tag]) {
							game.broadcastAll(tag => (lib.translate[tag] = `赋乐-${get.translation(name)}`), tag);
						}
						player.addGaintag([c], tag);
					}
				}
			}
		},
	},
};
