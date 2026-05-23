import { lib, game, ui, get, ai, _status } from "noname";
import type { GameEvent, Player } from "@/library";

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
				await player.gain({ cards: cards, animate: "draw" });
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
		check(card) {
			const num = ui.selected.cards.length;
			if (num > 3) {
				return -1;
			}
			if (!num) {
				return 1;
			}
			const cards = ui.selected.cards.slice();
			const type = get.info("juhun").getType(cards.add(card));
			if (type) {
				return 1;
			}
			return -1;
		},
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
		async content(event, trigger, player) {
			const { cards } = event;
			await player.discard({ cards: cards });
			const type = get.info("juhun").getType(cards);
			if (type == "duizi") {
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
			} else if (type == "santiao") {
				const targets = [player.getPrevious(), player.getNext()];
				await game.doAsyncInOrder(targets, async target => {
					await player.gainPlayerCard({
						target: target,
						position: "he",
					});
				});
			} else if (type == "zhadan") {
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
			} else if (type == "shunzi") {
				const {
					targets: [target],
				} = await player
					.chooseTarget({
						prompt: "将一名角色随机两张牌变为扑克牌。",
					})
					.forResult();
				const cards = target.getCards("h").randomGets(2);
				target.addGaintag(cards, "juhun");
			}
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
						player.addGaintag(cards, "juhun");
					} else if (event.triggername == "phaseEnd") {
						player.removeGaintag("juhun", cards);
					}
				},
			},
		},
		ai: {
			order: 13,
			result: {
				player: 5,
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
			if (player.storage.rongbian_skill) {
				return;
			}
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
							if (lib.skill[skill].ai?.neg || lib.skill[skill].ai?.combo) {
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
			if (get.type2(event.card, false) != "equip") {
				return false;
			}
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
					return evt.hs.some(card => card.storage.rongbian_female);
				},
				async content(event, trigger, player: Player) {
					const cards = player.getCards("h");
					const skills = cards.map(card => card.storage.romgbian_skill).filter(skill => player.hasSkill(skill, null, false, true));
					player.addAdditionalSkill("rongbian", skills);
					trigger.getl(player).hs.forEach(card => {
						card.fix();
						card.remove();
						card.destroyed = true;
						game.log(card, "被销毁了");
					});
				},
			},
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (get.type2(card, false) == "equip") {
						return 10;
					}
					return 0;
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
			check(button) {
				const player = get.player();
				const card = get.autoViewAs({ name: button.link[2], isCard: false });
				return Math.max(...game.players.map(curr => get.effect(curr, card, player, player)));
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
						return 6 - get.value(card);
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
		hiddenCard(player, name) {
			if (["basic", "trick"].includes(get.type(name, null, false))) {
				return Boolean(player.countCards("h", card => card.storage.rongbian_female));
			}
		},
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
		ai: {
			order(item, player) {
				const cards = [],
					cards2 = [];
				const list = player.getCards("h");
				list.forEach(card => {
					if (card.storage.rongbian_female) cards2.push(card);
					else cards.push(card);
				});
				const nodis = cards2.filter(card => lib.filter.cardDiscardable(card, player, "phaseDiscard"));
				const num = cards2.length - nodis.length - player.getHandcardLimit();
				if (num < 0) {
					return 0;
				}
				if (cards2.some(c => get.value(c) < 1)) {
					return 10;
				}
				if (cards.some(c => !player.hasUseTarget(c))) {
					return 10;
				}
				return 0;
			},
			result: {
				player: 10,
			},
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
		ai: {
			order: 10,
			result: {
				player(player, target) {
					return 10 + target.countCards("e");
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
		addFuyue(cards, player) {
			const list = lib.inpile.filter(name => {
				if (!["basic", "trick"].includes(get.type(name, null, false))) {
					return false;
				}
				const card = get.autoViewAs({ name: name });
				return player.hasUseTarget(card, false, false);
			});
			for (let card of cards) {
				const name = list.filter(i => card.name != i).randomGet();
				const tag = "fuyue_tag_" + name;
				if (!lib.translate[tag]) {
					game.broadcastAll(tag => (lib.translate[tag] = `赋乐-${get.translation(name)}`), tag);
				}
				player.addGaintag([card], tag);
			}
		},
		forced: true,
		async content(event, trigger, player) {
			const cards = player.getCards("h");
			get.info("fuyue").addFuyue(cards, player);
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
					cardname(card, player, current) {
						const event = get.event();
						const leach = event.filterCard;
						const card2 = get.autoViewAs({ name: current, isCard: true }, [card]);
						if (typeof leach == "function" && !leach(card2, player)) {
							const tag = card.gaintag.find(tag => tag.startsWith("fuyue_tag_"));
							if (tag) {
								const name = tag.slice(10);
								const cardx = get.autoViewAs({ name: name, isCard: true }, [card]);
								if (leach(cardx, player)) {
									return name;
								}
							}
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
					const loseEvt = player.getHistory("lose", evt => evt.type == "use" && evt.getParent("useCard") == event)?.[0];
					if (loseEvt) {
						const card2 = loseEvt.cards[0];
						const tags = loseEvt.gaintag_map[card2.cardid];
						return tags && tags.some(tag => tag.startsWith("fuyue_tag_"));
					}
					return false;
				},
				async cost(event, trigger, player) {
					const loseEvt = player.getHistory("lose", evt => evt.type == "use" && evt.getParent("useCard") == trigger)?.[0];
					const name = loseEvt.gaintag_map[loseEvt.cards[0].cardid].find(tag => tag.startsWith("fuyue_tag_")).slice(10);
					const { bool } = await player
						.chooseBool({
							prompt: `是否将${get.translation(trigger.card)}改为${get.translation(name)}`,
							ai(event, player) {
								const card = get.autoViewAs({ name: name, isCard: true }, trigger.cards);
								const targets = get.event().fuyue_targets;
								const num = targets.reduce((num, target) => num + get.effect(target, card, player, player), 0);
								return num > 0;
							},
						})
						.set("fuyue_targets", trigger.targets)
						.forResult();
					event.result = {
						bool: bool,
					};
				},
				async content(event, trigger, player) {
					const loseEvt = player.getHistory("lose", evt => evt.type == "use" && evt.getParent("useCard") == trigger)?.[0];
					const name = loseEvt.gaintag_map[loseEvt.cards[0].cardid].find(tag => tag.startsWith("fuyue_tag_")).slice(10);
					const [suit, number] = get.cardInfo(trigger.card);
					const card = get.autoViewAs({ name: name, isCard: true, suit: suit, number: number }, trigger.cards);
					game.log(player, "将", trigger.card, "改为", card);
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
			return list.length && list.length % 2 == 0;
		},
		mod: {
			aiOrder(player, card, num) {
				const list = game.getAllGlobalHistory("useCard", evt => evt.player == player).slice();
				const isFu = card.gaintag?.some(tag => tag.startsWith("fuyue_tag_"));
				let names = [],
					names2 = [];
				if (isFu && list.length && list.length % 2 == 0) {
					const tag = card.gaintag.find(tag => tag.startsWith("fuyue_tag_"));
					names.push(card.name, tag.slice(10));
					const evt = list.at(-2);
					const cardx = evt.card;
					const isCard = get.is.ordinaryCard(card);
					if (isCard) {
						const tags = game.getAllGlobalHistory("everything", evt => evt.name == "lose" && evt.type == "use" && evt.player == player && evt.getParent("useCard") == list[0])?.[0].gaintag_map[cardx.cards[0].cardid] || [];
						if (tags.some(tag => tag.startsWith("fuyue_tag_"))) {
							const name = [cardx.cards[0].name].concat(tags.map(tag => tag.slice(10)));
							names2.push(cardx.cards[0].name, name);
						}
					}
				}
				if (names.some(name => names2.includes(name))) {
					return 114;
				}
			},
		},
		forced: true,
		async content(event, trigger, player) {
			const list = game.getAllGlobalHistory("useCard", evt => evt.player == player).slice(-2);
			const card = list[0].card,
				card2 = list[1].card;
			const doubleCard = get.is.ordinaryCard(card) && get.is.ordinaryCard(card2);
			let noDouble = true;
			if (doubleCard) {
				const tags = game.getAllGlobalHistory("everything", evt => evt.name == "lose" && evt.type == "use" && evt.player == player && evt.getParent("useCard") == list[0])?.[0].gaintag_map[card.cards[0].cardid] || [],
					tags2 = game.getAllGlobalHistory("everything", evt => evt.name == "lose" && evt.type == "use" && evt.player == player && evt.getParent("useCard") == list[1])?.[0].gaintag_map[card2.cards[0].cardid] || [];
				if (tags.some(tag => tag.startsWith("fuyue_tag_")) && tags2.some(tag => tag.startsWith("fuyue_tag_"))) {
					const names = [card.cards[0].name].concat(tags.map(tag => tag.slice(10)));
					const names2 = [card2.cards[0].name].concat(tags2.map(tag => tag.slice(10)));
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
								get.info("fuyue").addFuyue(gain, player);
							}
						}
					}
				}
			}
			if (noDouble && player.getCards("h").some(card => !card.gaintag.some(tag => tag.startsWith("fuyue_tag_")))) {
				const { cards, bool } = await player
					.chooseCard({
						position: "h",
						selectCard: [1, 2],
						prompt: "将至多两张手牌标记为“赋”。",
						filterCard(card, player) {
							return !card.gaintag.some(tag => tag.startsWith("fuyue_tag_"));
						},
					})
					.forResult();
				if (bool) {
					get.info("fuyue").addFuyue(cards, player);
				}
			}
		},
	},
	//新杀谋诸葛亮
	jingmou: {
		marktext: "☯",
		mark: true,
		intro: {
			content(storage, player) {
				const info = player.storage.jingmou_note;
				let suitStr, typeStr;
				if (info?.suit) {
					suitStr = info.suit.map(suit => get.translation(suit)).join("、");
					typeStr = info.type.map(type => get.translation(type)).join("、");
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
		},
		trigger: {
			global: ["useCard"],
		},
		filter(event, player) {
			const card = event.card;
			const type = get.type2(card, false);
			const suit = get.suit(card, false);
			const storage = player.storage.jingmou_note;
			if (!storage?.suit) {
				return false;
			}
			return storage.suit.includes(suit) || storage.type.includes(type);
		},
		async cost(event, trigger, player) {
			const state = player.storage.jingmou;
			const source = trigger.player;
			const card = trigger.card;
			const str = state ? `${get.translation(card)}结算后你可将其交给任意一名角色` : `令${get.translation(card)}无效并可弃置一张同花色牌对${get.translation(source)}造成1点火焰伤害`;
			event.result = await player
				.chooseBool({
					prompt: str,
					ai(event, player) {
						const source = get.event().jingmou_source;
						const state = get.event().jingmou_state;
						const card = get.event().jingmou_card;
						if (state) {
							return card.cards.length > 0;
						} else {
							return get.attitude(player, source) < 0;
						}
					},
				})
				.set("jingmou_state", state)
				.set("jingmou_source", source)
				.set("jingmou_card", card)
				.forResult();
		},
		async content(event, trigger, player) {
			const state = player.storage.jingmou;
			const source = trigger.player;
			const card = trigger.card;
			player.changeZhuanhuanji("jingmou");
			const info = player.storage.jingmou_note;
			const suit = get.suit(card, false);
			const type = get.type2(card, false);
			const noted = player.storage.jingmou_noted || { suit: [], type: [] };
			if (info.suit.includes(suit)) {
				info.suit.remove(suit);
				noted.suit.add(suit);
			} else {
				info.type.remove(type);
				noted.type.add(type);
			}
			player.setStorage("jingmou_used", noted);
			if (player.hasSkill("dingnan", null, false, true) && noted.suit.length == 4 && noted.type.length == 3) {
				await player.addSkills(["dingnan"]);
			}
			player.setStorage("jingmou_note", info);
			if (state) {
				const cards = player.getStorage("jingmou_gain");
				cards.push(card);
				player.setStorage("jingmou_gain", cards);
			} else {
				game.log(player, "令", card, "无效");
				trigger.targets.length = 0;
				trigger.all_excluded = true;
				const { cards } = await player
					.chooseCard({
						prompt: `弃置一张${get.translation(suit)}的手牌并对${get.translation(source)}造成1点火焰伤害`,
						position: "h",
						filterCard(card, player, event) {
							const suit = get.event().jingmou_suit;
							return get.suit(card, player) == suit && lib.filter.cardDiscardable(card, player);
						},
						ai(card) {
							return 10 - get.value(card);
						},
					})
					.set("jingmou_suit", suit)
					.forResult();
				if (cards?.length) {
					await player.discard({
						cards: cards,
					});
					await source.damage({
						num: 1,
						source: player,
						nature: "fire",
					});
				}
			}
		},
		derivation: ["dingnan"],
		group: ["jingmou_change", "jingmou_note", "jingmou_gain"],
		subSkill: {
			note: {
				trigger: {
					global: ["phaseUseBegin"],
				},
				filter(event, player) {
					const storage = player.storage.jingmou_note;
					if (!storage) {
						return true;
					}
					const list = storage.suit.concat(storage.type);
					return !list.length;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseCard({
							prompt: "你可弃置任意张牌并秘密记录其中包含的一种花色与牌类型。有角色使用与你记录的花色或类型相同的牌时，移除该记录。阳：此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害；阴：此牌结算后将其交给任意一名角色。若你移除过所有花色与类型，你获得“定南”",
							position: "he",
							selectCard: [1, Infinity],
							filterCard: lib.filter.cardDiscardable,
							ai(card) {
								const cards = ui.selected.cards;
								const types = cards.map(cards => get.type2(cards, false));
								const type = get.type2(card, false);
								if (!types.includes(type)) {
									return 10;
								}
								return 0;
							},
						})
						.forResult();
				},
				async content(event, trigger, player) {
					const cards = event.cards;
					const suits = cards.map(card => get.suit(card, false)).toUniqued();
					const types = cards.map(card => get.type2(card, false));
					await player.discard({ cards: cards });
					const { links } = await player
						.chooseButton({
							forced: true,
							createDialog: ["选择一种花色记录", [suits.map(suit => [suit, get.translation(suit)]), "tdnodes"]],
						})
						.forResult();
					const note = { suit: links, type: types };
					player.setStorage("jingmou_note", note);
				},
			},
			gain: {
				trigger: {
					global: ["useCardAfter"],
				},
				filter(event, player) {
					const cards = player.getStorage("jingmou_gain");
					return cards.includes(event.card);
				},
				direct: true,
				async content(event, trigger, player) {
					const card = trigger.card;
					const { targets } = await player
						.chooseTarget({
							prompt: `将${get.translation(card)}交给任意一名角色`,
							ai(target) {
								const player = get.player();
								return get.attitude(player, target);
							},
						})
						.forResult();
					const cards = card.cards.filterInD("o").concat(card.cards.filterInD("d"));
					if (cards.length && targets.length) {
						await player.give(cards, targets[0], true);
					}
				},
			},
			change: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				prompt2(event, player) {
					return "切换【靖谋】为状态" + (player.storage.dcsbjunmou ? "阳" : "阴");
				},
				check: () => Math.random() > 0.5,
				async content(event, trigger, player) {
					player.changeZhuanhuanji("jingmou");
				},
			},
		},
	},
	guyi: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		init(player, skill) {
			player.addSkill("guyi_lose");
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		async content(event, trigger, player) {
			await player.draw({
				num: 1,
				gaintag: ["guyi_tag"],
			});
		},

		group: ["guyi_round"],
		subSkill: {
			tag: {},
			lose: {
				trigger: {
					player: ["loseAfter"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				charlotte: true,
				forced: true,
				filter(event, player) {
					const evt = event.getl(player);
					const tagMap = evt.gaintag_map;
					return (
						evt.hs &&
						Object.values(tagMap)
							.flat()
							.some(tag => tag == "guyi_tag")
					);
				},
				mod: {
					aiOrder(player, card) {
						if (card?.hasGaintag?.("guyi_tag")) {
							return 13;
						}
					},
				},
				async content(event, trigger, player) {
					const num = Math.min(player.getRoundHistory("useSkill", evt => evt.skill == event.name).length, 7);
					const top = get.cards(num, true);
					await game.cardsGotoOrdering(top);
					const next = player.chooseToMove_new({ prompt: "孤熠", forced: true });
					next.set("list", [
						["牌堆顶", top],
						["获得", []],
					]);
					next.set("filterOk", list => {
						return list[1].length == 1;
					});
					next.set("processAI", list => {
						const cards = list[0][1];
						const canUse = cards.filter(card => player.hasUseTarget(card));
						let choice = canUse;
						if (canUse.length == 0) {
							choice = cards;
						}
						const values = choice.map(card => get.value(card));
						const max = Math.max(...values);
						const card = choice.find(card => get.value(card) == max);
						cards.remove(card);
						return [cards, [card]];
					});
					const {
						moved: [tops, gains],
					} = await next.forResult();
					await player.gain({ cards: gains, animate: "draw", gaintag: ["guyi_tag"] });
					tops.reverse();
					await game.cardsGotoPile(tops, () => ui.cardPile.firstChild);
					game.updateRoundNumber();
					await game.delay();
				},
				ai: {
					effect: {
						player(card) {
							if (card?.hasGaintag?.("guyi_tag")) {
								return 13;
							}
						},
					},
				},
			},
			round: {
				trigger: {
					global: ["roundEnd"],
				},
				forced: true,
				filter(event, player) {
					const note = {};
					game.players.forEach(curr => {
						const num = curr.getRoundHistory("sourceDamage").reduce((num, evt) => (num += evt.num), 0);
						note[curr.playerid] = num;
					});
					const num = note[player.playerid];
					return game.players.every(curr => note[curr.playerid] <= num);
				},
				async content(event, trigger, player) {
					await player.draw({
						num: 1,
						gaintag: ["guyi_tag"],
					});
				},
			},
		},
	},
	dingnan: {
		enable: "phaseUse",
		usable: 1,
		selectTarget: [1, Infinity],
		filterTarget: true,
		filterCard: false,
		selectCard: -1,
		multitarget: true,
		multiline: true,
		async content(event, trigger, player) {
			await game.doAsyncInOrder(event.targets, async target => {
				const { bool } = await target
					.chooseToRespond({
						filterCard(card, player, event) {
							return card.name == "sha";
						},
						ai(card) {
							const player = get.player();
							const source = get.event().dingnan_source;
							return -get.damageEffect(player, source, player);
						},
					})
					.set("dingnan_source", player)
					.forResult();
				if (!bool) {
					await target.damage({ num: 1, source: player });
				}
			});
		},
		ai: {
			order: 10,
			result: {
				target(player, target) {
					return get.damageEffect(target, player, target);
				},
			},
		},
	},
	//谋关羽
	guanwu: {
		trigger: {
			player: ["phaseBegin"],
		},
		filter(event, player) {
			const card = get.cardPile("qinglong", "field");
			return Boolean(card);
		},
		forced: true,
		async content(event, trigger, player) {
			const cards = [];
			const card = get.cardPile("qinglong", "field");
			cards.push(card);
			const owner = get.owner(cards[0]);
			if (owner) {
				await owner.lose({
					cards: cards,
				});
			}
			await player.gain({
				cards: cards,
				animate: "gain2",
			});
		},
		group: ["guanwu_eff"],
		subSkill: {
			eff: {
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					if (event.card.name != "sha") {
						return false;
					}
					return player.getRoundHistory("useCard", evt => get.tag(evt.card, "damage") > 0).length >= 2;
				},
				charlotte: true,
				forced: true,
				async content(event, trigger, player) {
					const num = player.getRoundHistory("useCard", evt => get.tag(evt.card, "damage") > 0).length;
					trigger.baseDamage += num;
				},
			},
		},
	},
	weishi: {
		trigger: {
			target: ["useCardToTargeted"],
		},
		usable: 1,
		filter(event, player) {
			return event.player != player && get.tag(event.card, "damage") < 0;
		},
		async cost(event, trigger, player) {
			const num = Math.ceil(player.countCards("h") / 2);
			event.result = await player
				.chooseCard({
					prompt: `弃置一半手牌（向上取整）令${get.translation(trigger.card)}对你无效`,
					selectCard: num,
					filterCard: lib.filter.cardDiscardable,
					position: "h",
					ai(card) {
						const player = get.player();
						if (player.countCards("h") < 5) {
							return 6 - get.value(card);
						}
						return 0;
					},
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const { cards } = event;
			await player.discard({ cards: cards });
			const evt = trigger.getParent();
			evt.targets.remove(player);
			evt.excluded.add(player);
		},
		group: ["weishi_sha"],
		subSkill: {
			sha: {
				trigger: {
					global: ["useCardAfter"],
				},
				forced: true,
				filter(event, player) {
					return event.player != player && get.tag(event.card, "damage") > 0 && event.targets.includes(player);
				},
				async content(event, trigger, player) {
					const cards = [];
					while (cards.length < 2) {
						const card = get.cardPile(card => get.tag(card, "damage") > 0 && !cards.includes(card));
						if (card) {
							cards.push(card);
						} else {
							break;
						}
					}
					if (cards.length) {
						await player.gain({
							cards: cards,
							animate: "gain2",
						});
					}
					await player
						.chooseToUse({
							prompt: `是否对${get.translation(trigger.player)}使用一张杀？`,
							filterCard(card, player, event) {
								if (get.name(card) != "sha") {
									return false;
								}
								return lib.filter.filterCard(card, player);
							},
							filterTarget(card, player, target) {
								const source = get.event().sourcex;
								if (target != source && !ui.selected.targets.includes(source)) {
									return false;
								}
								return Boolean(lib.filter.targetEnabled(card, player, target));
							},
							ai1(card) {
								return -get.value(card);
							},
							ai2(target) {
								const player = get.player();
								return get.effect(target, { name: "sha" }, player, player);
							},
						})
						.set("sourcex", trigger.player)
						.set("logSkill", "weishi")
						.set("complexSelect", true);
				},
			},
		},
	},
	jvao: {
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			const list = get.inpileVCardList(info => info[2] == "sha" || info[0] == "trick");
			const targets = game.filterPlayer(curr => player.inRange(curr));
			return list.some(info => {
				const card = get.autoViewAs({
					name: info[2],
					nature: info[3],
				});
				return targets.some(target => player.canUse(card, target, false, false));
			});
		},
		chooseButton: {
			dialog(event, player) {
				const list = get.inpileVCardList(info => info[2] == "sha" || info[0] == "trick");
				return ui.create.dialog("选择一张牌对任意攻击范围内其他角色使用", [list, "vcard"]);
			},
			check(button) {
				return Math.random() - 0.5;
			},
			backup(links, player) {
				return {
					selectCard: -1,
					filterCard: false,
					selectTarget: [1, Infinity],
					jvao_card: links[0],
					multitarget: true,
					multiline: true,
					filterTarget(card, player, target) {
						const info = get.info("jvao_backup").jvao_card;
						const card2 = get.autoViewAs({
							name: info[2],
							nature: info[3],
						});
						return player.inRange(target) && player.canUse(card2, target, false, false);
					},
					ai2(target) {
						const player = get.player();
						const info = get.info("jvao_backup").jvao_card;
						const card = get.autoViewAs({
							name: info[2],
							nature: info[3],
						});
						const num = get.effect(target, card, player, player);
						const att = get.attitude(player, target);
						if (num > 0) {
							return att;
						} else {
							return -att;
						}
					},
					prompt: `视为对攻击范围内任意其他角色使用${get.translation(links[0][2])}`,
					async content(event, trigger, player) {
						const targets = event.targets;
						const info = get.info("jvao_backup").jvao_card;
						const card = get.autoViewAs({
							name: info[2],
							nature: info[3],
						});
						await player.useCard({
							card: card,
							targets: targets,
						});
					},
				};
			},
		},
		ai: {
			order: 10,
			result: {
				player: 3,
			},
		},
	},
	//邓晚棠
	daijia: {
		trigger: {
			player: ["damageAfter"],
			global: ["roundStart"],
		},
		filter(event, player) {
			if (event.name == "damage") {
				return !player.hasHistory("damage", evt => evt != event);
			}
			return true;
		},
		mark: true,
		marktext: "黛",
		intro: {
			content: "expansion",
		},
		onremove: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseCard({
					prompt: "你可弃置任意张手牌并回复1点体力，然后随机从牌堆或弃牌堆将等量张红色牌置于武将牌上，称为“黛”。其他角色使用牌指定你为目标时，你可获得两张“黛”。",
					selectCard: [1, Infinity],
					filterCard: lib.filter.cardDiscardable,
					position: "h",
					ai(card) {
						const player = get.player();
						const value = get.value(card);
						if (player.isDamaged()) {
							return 1;
						}
						const cards = player.getCards("h");
						const num = cards.filter(card => get.color(card) == "red").length;
						const num2 = cards.filter(card => get.color(card) == "black").length;
						const color = get.color(card);
						if (player.hasSkill("chengchong")) {
							if (color == "red") {
								return num - num2 > 3 ? 6 - value : 0;
							} else {
								return 12 - value;
							}
						}
						return ui.selected.cards.length < 2 ? 6 - value : 0;
					},
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const { cards } = event;
			await player.discard({ cards: cards });
			await player.recover();
			const list = [];
			const num = cards.length;
			while (list.length < num) {
				const card = get.cardPile(card => !list.includes(card) && get.color(card, false) == "red", null, "random");
				if (card) {
					list.push(card);
				} else {
					break;
				}
			}
			if (list.length) {
				await player.addToExpansion({
					cards: list,
					animate: "gain2",
					gaintag: ["daijia"],
				});
			}
		},
		group: ["daijia_eff"],
		subSkill: {
			tag: {},
			eff: {
				trigger: {
					target: ["useCardToTargeted"],
				},
				forced: true,
				filter(event, player) {
					return event.player != player && player.getExpansions("daijia").length > 0;
				},
				async content(event, trigger, player) {
					const cards = player.getExpansions("daijia").randomGets(2);
					await player.gain({
						cards: cards,
						animate: "draw",
					});
				},
			},
		},
	},
	chengchong: {
		forced: true,
		group: ["chengchong_gain", "chengchong_lose"],
		subSkill: {
			gain: {
				trigger: {
					player: ["gainAfter"],
					global: ["loseAsyncAfter"],
				},
				forced: true,
				filter(event, player) {
					if (event.getParent(2).name == "chengchong_gain" || _status.currentPhase == player) {
						return false;
					}
					const gain = event.getg(player);
					const cards = player.getCards("h");
					const num = cards.filter(card => get.color(card) == "red").length;
					const num2 = cards.filter(card => get.color(card) == "black").length;
					return num > num2 && gain.length > 0;
				},
				async content(event, trigger, player) {
					await player.draw({ num: 2 });
				},
			},
			lose: {
				trigger: {
					player: ["useCard"],
				},
				filter(event, player) {
					const cards = player.getCards("h");
					const num = cards.filter(card => get.color(card) == "red").length;
					const num2 = cards.filter(card => get.color(card) == "black").length;
					return num > num2;
				},
				mod: {
					aiOrder(player, card) {
						if (get.color(card, false) == "black") {
							return 13;
						}
					},
				},
				forced: true,
				async content(event, trigger, player) {
					const card = await player.getCards("h", card => get.color(card, false) == "black" && lib.filter.cardDiscardable(card, player)).randomGet();
					await player.discard({ cards: [card] });
				},
			},
		},
	},
	//陆文漪
	caiyun: {
		enable: "phaseUse",
		usable: 1,
		filterTarget: function (card, player, target) {
			return target != player;
		},
		selectTarget: 1,
		filterCard: false,
		selectCard: -1,
		init(player) {
			if (!player.storage.caiyun_eff) {
				player.storage.caiyun_eff = {
					basic: [],
					trick: [],
					equip: [],
				};
			}
			player.addSkill("caiyun_eff");
		},
		prompt: "你可选择一名其他角色并与其各从牌堆随机获得1张指定类型的牌，然后直到你的下个回合开始，你与其使用该类型的牌时，从牌堆随机获得2张与使用的牌类型不同的牌(每人至多两次)。",
		async content(event, trigger, player) {
			const {
				targets: [target],
			} = event;
			const {
				links: [type],
			} = await player
				.chooseButton({
					forced: true,
					createDialog: ["你可选择一名其他角色并与其各从牌堆随机获得1张指定类型的牌，然后直到你的下个回合开始，你与其使用该类型的牌时，从牌堆随机获得2张与使用的牌类型不同的牌(每人至多两次)", [["basic", "trick", "equip"].map(i => [i, get.translation(i)]), "tdnodes"]],
					ai(buttom) {
						return Math.random() - 1;
					},
				})
				.forResult();
			const info = player.getStorage("caiyun_eff");
			info[type].add(target);
			player.setStorage("caiyun_eff", info);
			player.addTempSkill("caiyun_del", { player: ["phaseBegin"] });
			const gainer = [player, target];
			await game.doAsyncInOrder(gainer, async current => {
				const gain = [];
				const card = get.cardPile(card => get.type2(card, false) == type);
				if (card) {
					gain.push(card);
					await current.gain({
						cards: gain,
						animate: "gain2",
					});
				}
			});
		},
		subSkill: {
			eff: {
				trigger: {
					global: ["useCard"],
				},
				filter(event, player) {
					const user = event.player;
					const type = get.type2(event.card, false);
					const id = user.playerid;
					const info = player.getStorage("caiyun_eff_count");
					if (info[id] > 1) {
						return false;
					}
					const note = player.getStorage("caiyun_eff")?.[type];
					return (note.length && user == player) || note.includes(user);
				},
				init(player) {
					const info = {};
					game.players.forEach(curr => {
						const id = curr.playerid;
						info[id] = 0;
					});
					player.setStorage("caiyun_eff_count", info);
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					const user = trigger.player;
					const id = user.playerid;
					const info = player.getStorage("caiyun_eff_count");
					info[id]++;
					player.setStorage("caiyun_eff_count", info);
					const type = get.type2(trigger.card, false);
					const cards = [];
					const types = ["basic", "trick", "equip"].remove(type);
					types.forEach(t => {
						const card = get.cardPile(c => get.type2(c, false) == t);
						if (card) {
							cards.push(card);
						}
					});
					if (cards.length) {
						await user.gain({
							cards: cards,
							animate: "gain2",
						});
					}
				},
			},
			del: {
				charlotte: true,
				onremove(player) {
					const info = player.getStorage("caiyun_eff_count");
					game.players.forEach(curr => {
						const id = curr.playerid;
						info[id] = 0;
					});
					player.storage.caiyun_eff = {
						basic: [],
						trick: [],
						equip: [],
					};
					player.setStorage("caiyun_eff_count", info);
				},
			},
		},
		ai: {
			order: 10,
			result: {
				player: 3,
				target: 3,
			},
		},
	},
	qieyan: {
		trigger: {
			global: ["useCardAfter"],
		},
		forced: true,
		filter(event, player) {
			return event.player != player;
		},
		init(player) {
			player.addSkill("qieyan_del");
		},
		mod: {
			globalTo(from, to, num) {
				const add = to.storage.qieyan_count || 0;
			},
		},
		async content(event, trigger, player) {
			const user = trigger.player;
			const num = get.distance(user, player);
			const bool = user.inRange(player);
			let add = player.storage.qieyan_count || 0;
			add += 1;
			player.setStorage("qieyan_count", add);
			const bool2 = user.inRange(player);
			if (bool && !bool2) {
				await player.recover({ num: 1 });
				await player.draw({ num: 2 });
			}
		},
		group: ["qieyan_eff"],
		subSkill: {
			eff: {
				trigger: {
					global: ["useCardBeore"],
				},
				forced: true,
				filter(event, player) {
					const user = event.player;
					const num = get.distance(user, player);
					return num == 1 && !event.directHit.includes(player);
				},
				async content(event, trigger, player) {
					trigger.directHit.push(player);
				},
			},
			del: {
				trigger: {
					global: ["phaseAfter"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					player.setStorage("qieyan_count", 0);
				},
			},
		},
	},
};
