import { lib, game, ui, get, ai, _status } from "noname";

let funcMap = {
	dandaoStorage(player, key, value) {
		game.broadcastAll(
			(player, key, value) => {
				player.storage.wuyu_dandao[key] = value;
			},
			player,
			key,
			value
		);
	},
	dandaoSkill(player, equip, global, self) {
		let event = get.event(),
			skillEvent;
		if (event.skill) {
			skillEvent = event;
		} else if (event.getParent("trigger").skill) {
			skillEvent = event.getParent("trigger");
		} else if (event.getParent("useSkill").skill) {
			skillEvent = event.getParent("useSkill");
		}
		let boo1 = equip && skillEvent?.type == "equip",
			boo2 = !global && skillEvent?.type == "global",
			boo3 = !self && skillEvent?.player == player;
		return !skillEvent || boo1 || boo2 || boo3;
	},
	fixedEvent(player, event, info) {
		let newInfo = info.reduce((newInfo, item) => {
			newInfo[item] = event[item];
			return newInfo;
		}, {});
		newInfo.dandao_player = player;
		event.set("dandao_skill", newInfo);
		info.forEach(item => {
			Object.defineProperty(event, item, {
				get() {
					if (Array.isArray(this.dandao_skill[item])) {
						return [...this.dandao_skill[item]];
					}
					return this.dandao_skill[item];
				},
				set(value) {
					if (get.info("wuyu_dandao").dandaoFunc.dandaoSkill(this.dandao_skill.dandao_player)) {
						this.dandao_skill[item] = value;
					}
				},
			});
		});
	},
	dandaoReplace(obj, key, value, oldInfo, newInfo) {
		let str = value.toString(),
			parm,
			func;
		str = str.replace(new RegExp(`["']${oldInfo}["']`, "g"), `"${newInfo}"`);
		if (key == "filter") {
			str = str.replace(/["']unequip2["']/g, '"dandaoequip"');
			str = str.replace(/["']unequip["']/g, '"dandaoequip"');
		}
		parm = str.match(/\(.*?\)/)[0];
		func = str.slice(str.indexOf(parm));
		parm = parm.slice(1, -1).split(",");
		func = func.slice(func.indexOf("{") + 1, -1);
		Object.defineProperty(obj, key, {
			value: new Function(...parm, func),
			enumerable: true,
			configurable: true,
			writable: true,
		});
	},
	dandaoCreateEquipSkills(skills) {
		let list = [];
		skills.forEach(skill => {
			let skillx = `z_shenbing_${skill}`;
			if (lib.skill[skillx]) {
				list.add(skillx);
			} else {
				let newInfo = get.copy(get.info(skill)),
					func = obj => {
						for (let key in obj) {
							if (!obj.hasOwnProperty(key)) {
								continue;
							}
							let value = obj[key];
							if (get.objtype(value) == "object") {
								if (key == "ai") {
									continue;
								} else {
									func(value);
								}
							} else if (key == "skill_id") {
								obj[key] = `z_shenbing_${value}`;
							} else if (["derivation", "group"].includes(key)) {
								if (typeof value == "string" && value.startsWith(skill + "_")) {
									obj[key] = value.replace(new RegExp(`${skill}_`), `${skillx}_`);
								} else {
									obj[key] = value.map(str => {
										return str.startsWith(skill + "_") ? str.replace(new RegExp(`${skill}_`), `${skillx}_`) : str;
									});
								}
							} else if (typeof value == "function") {
								let str = value.toString();
								if (str.includes(`${skill}`) || str.includes("unequip2") || str.includes("unequip")) {
									get.info("wuyu_dandao").dandaoFunc.dandaoReplace(obj, key, value, `${skill}`, `${skillx}`);
								}
							}
						}
					};
				func(newInfo);
				lib.skill[skillx] = newInfo;
				lib.translate[skillx] = lib.translate[skill];
				game.finishSkill(skillx);
				list.add(skillx);
			}
		});
		return list;
	},
	filterTrigger(event, player, triggername, skill, indexedData) {
		let info = get.info(skill);
		if (!info) {
			console.error(new ReferenceError(`缺少info的技能: ${skill}`));
			return false;
		}
		if (!info.trigger) {
			return false;
		}
		if (
			!Object.keys(info.trigger).some(role => {
				if (role != "global" && player != event[role]) {
					return false;
				}
				let list = [];
				if (typeof info.trigger[role] == "string") {
					list.add(info.trigger[role]);
				} else if (Array.isArray(info.trigger[role])) {
					list.addArray(info.trigger[role]);
				}
				if (list.includes(triggername)) {
					return true;
				}
				let map = lib.relatedTrigger,
					names = Object.keys(map);
				for (let trigger of list.slice()) {
					for (let name2 of names) {
						if (trigger.startsWith(name2)) {
							list.addArray(map[name2].map(i => i + trigger.slice(name2.length)));
						}
					}
				}
				return list.includes(triggername);
			})
		) {
			return false;
		}
		if (info.filter && !info.filter(event, player, triggername, indexedData)) {
			return false;
		}
		if (info.usable !== void 0) {
			let num = info.usable;
			if (typeof num === "function") {
				num = info.usable(skill, player);
			}
			if (typeof num === "number" && (player.getStat("triggerSkill")[skill] ?? 0) >= num) {
				return false;
			}
		}
		if (info.round && info.round - (game.roundNumber - player.storage[skill + "_roundcount"]) > 0) {
			return false;
		}
		return true;
	},
};

Object.freeze(funcMap);

let wuyu_dandao = {
	audio: "ext:无语包/audio/skill:5",
	trigger: {
		player: ["loseAfter", "dyingBegin"],
		global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		target: ["useCardToTargeted"],
	},
	forced: true,
	init(player, skill) {
		let bool = player.name == "wuyu_sunhanhua" || player.name2 == "wuyu_sunhanhua";
		if (bool) {
			let count = lib.config.extension_无语包_wuyu_sunhanhua ?? 0;
			if (count < 200) {
				count++;
				game.saveExtensionConfig("无语包", "wuyu_sunhanhua", count);
			}
		}
		if (!player.storage.wuyu_dandao) {
			player.setStorage("wuyu_dandao", {});
		}
		Object.defineProperty(player, "_trueMe", {
			get() {
				return this;
			},
			set() {},
			configurable: false,
			enumerable: true,
		});
		if (!player.hasSkill("wuyu_dandao_mark")) {
			player.addSkill("wuyu_dandao_mark");
		}
		if (!player.hasSkill("wuyu_dandao_skillNote") && bool) {
			player.addSkill("wuyu_dandao_skillNote");
		}
		if (!player.hasSkill("wuyu_dandao_xianfa") && bool) {
			player.addSkill("wuyu_dandao_xianfa");
		}
	},
	filter(event, player, triggername) {
		if (event.getl) {
			let names = player
				.getHistory("lose", evt => evt != event)
				.map(evt => evt.getl(player).hs)
				.flat()
				.map(card => card.name);
			return event.getl(player).hs.some(card => !names.includes(card.name));
		}
		if (triggername == "useCardToTargeted") {
			return !game.hasGlobalHistory(
				"useCard",
				evt => evt.targets.includes(player) && evt.card.name == event.card.name && evt != event.getParent()
			);
		}
		return true;
	},
	danEffect: [
		{
			name: "fangtian",
			skill: {
				trigger: {
					player: ["useCard2"],
				},
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").fangtian;
				},
				filter(event, player) {
					if (event.card.name != "sha") {
						return false;
					}
					return game.hasPlayer(curr => player.canUse(event.card, curr, false) && !event.targets.includes(curr));
				},
				async cost(event, trigger, player) {
					event.result = await player.chooseTarget(`是否为${get.translation(trigger.card)}增加一个目标`).forResult();
				},
				async content(event, trigger, player) {
					trigger.targets.addArray(event.targets);
					game.log(player, "令", event.targets, "成为了", trigger.card, "的额外目标");
				},
			},
			fenjue: [["sha", "fangtian"]],
			mark: true,
			decs: "每回合限x次,使用杀可多指定一名目标",
			intro(storage, use) {
				return `使用杀可多指定一名目标(${use}/${storage})`;
			},
		},
		{
			name: "guanshi",
			skill: {
				trigger: {
					player: ["useCard"],
				},
				forced: true,
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").guanshi;
				},
				filter(event, player) {
					return event.card.name == "sha";
				},
				async content(event, trigger, player) {
					trigger.directHit.addArray(game.filterPlayer(curr => curr != player));
					game.log(player, "令", trigger.card, "不可被其他角色响应");
				},
			},
			fenjue: [["sha", "guanshi"]],
			mark: true,
			decs: "每回合限x次,使用杀不可被其他角色响应",
			intro(storage, use) {
				return `使用杀不可被其他角色响应(${use}/${storage})`;
			},
		},
		{
			name: "guanxing",
			skill: {
				trigger: {
					global: ["phaseBefore", "roundStart"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					if (event._roundStart) {
						return true;
					}
					return !player.getStorage("wuyu_dandao").guanxing_ban;
				},
				async content(event, trigger, player) {
					if (trigger._roundStart) {
						get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "guanxing_ban", false);
					}
					let count = player.getStorage("wuyu_dandao").guanxing,
						num = player.getRoundHistory("useSkill", evt => evt.skill == event.name).length,
						cards = get.cards(7),
						cardx = get.bottomCards(7).reverse(),
						next = player.chooseToMove();
					game.cardsGotoOrdering(cards.concat(cardx));
					next.set("list", [
						["牌堆顶", cards],
						["牌堆底", cardx],
					]);
					next.set("prompt", "将牌移动到牌堆顶或牌堆底");
					let result = await next.forResult();
					let top = result?.moved?.[0] || [],
						bottom = result?.moved?.[1] || [];
					top.reverse();
					await game.cardsGotoPile(top.concat(bottom), ["top_cards", top], (event, card) => {
						if (event.top_cards.includes(card)) {
							return ui.cardPile.firstChild;
						}
						return null;
					});
					game.addCardKnower(top, player);
					game.addCardKnower(bottom, player);
					player.popup(`${get.cnNumber(top.length)}上${get.cnNumber(bottom.length)}下`);
					await game.delayx();
					if (num >= count) {
						get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "guanxing_ban", true);
					}
				},
			},
			fenjue: [
				["nanman", "trick", "trick"],
				["wanjian", "trick", "trick"],
				["taoyuan", "trick", "trick"],
				["wugu", "trick", "trick"],
			],
			decs: "每轮限x次,任意角色回合开始前,你观看牌堆顶和牌堆底7张牌并任意调换",
			intro(storage, use) {
				return `任意角色回合开始前,你观看牌堆顶和牌堆底7张牌并任意调换`;
			},
			mark: true,
		},
		{
			name: "guohe",
			skill: {
				trigger: {
					player: ["useCardToPlayered"],
				},
				forced: true,
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").guohe;
				},
				filter(event, player) {
					return event.target != player && event.target.countDiscardableCards();
				},
				async content(event, trigger, player) {
					let cards = trigger.target.getDiscardableCards();
					await trigger.target.discard(cards.randomGet());
				},
			},
			fenjue: [
				["equip1", "guohe"],
				["sha", "shunshou"],
				["sha", "equip4"],
			],
			mark: true,
			decs: "每回合限x次,使用牌指定其他角色为目标时弃置其一张牌",
			intro(storage, use) {
				return `使用牌指定其他角色为目标时弃置其一张牌(${use}/${storage})`;
			},
		},
		{
			name: "jiu",
			skill: {
				trigger: {
					player: ["dyingBegin"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").jiu;
					await player.draw(num);
				},
			},
			fenjue: [["jiu", "jiu"]],
			mark: true,
			decs: "进入濒死时摸x张牌",
			intro(storage, use) {
				return `进入濒死时摸${storage}张牌`;
			},
		},
		{
			name: "jiusha",
			skill: {
				forced: true,
				charlotte: true,
				mod: {
					maxHandcard(player, num) {
						return (num += player.getStorage("wuyu_dandao").jiusha);
					},
				},
			},
			fenjue: [["jiu", "sha"]],
			mark: true,
			decs: "手牌上限+x",
			intro(storage, use) {
				return `手牌上限+${storage}`;
			},
		},
		{
			name: "jiushan",
			skill: {
				trigger: {
					player: ["phaseDrawBegin2"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").jiushan;
					trigger.num += num;
				},
			},
			fenjue: [["jiu", "shan"]],
			mark: true,
			decs: "摸牌阶段摸牌数+x",
			intro(storage, use) {
				return `摸牌阶段摸牌数+${storage}`;
			},
		},
		{
			name: "qinggang",
			skill: {
				trigger: {
					player: ["useCard"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					let used = player.hasHistory(
						"useSkill",
						evt => evt.skill == "wuyu_dandao_qinggang" && evt.event.getParent(2).card.name == event.card.name
					);
					return !used && player.hasHistory("useCard", evt => evt.card.name == event.card.name && evt != event);
				},
				marktext: "斩",
				intro: {
					name: "斩",
					mark(dialog, storage, player) {
						let used = player
							.getHistory("useSkill", evt => evt.skill == "wuyu_dandao_qinggang")
							.map(evt => get.translation(evt.event.getParent(2).card.name))
							.join("");
						dialog.addText("已使用:" + used);
					},
					markcount(storage, player) {
						return player.getStorage("wuyu_dandao").qinggangCount;
					},
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").qinggangCount ?? 0;
					num++;
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "qinggangCount", num);
					player.markSkill(event.name);
				},
				group: ["wuyu_dandao_qinggang_effect"],
				subSkill: {
					effect: {
						trigger: {
							player: ["useCard"],
						},
						charlotte: true,
						filter(event, player) {
							let bool = event.targets.length;
							if (event.targets.includes(player)) {
								bool = event.targets.length > 1;
							}
							return bool && player.getStorage("wuyu_dandao").qinggangCount;
						},
						prompt(event, player) {
							return "移去'斩'并对除你以外的目标执行对应效果";
						},
						async content(event, trigger, player) {
							let count = player.getStorage("wuyu_dandao").qinggangCount,
								max = player.getStorage("wuyu_dandao").qinggang;
							let num = Math.min(5, count, max),
								skills = [];
							count -= num;
							get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "qinggangCount", count);
							player.markSkill("wuyu_dandao_qinggang");
							["equip", "fengyin", "baiban", "hujia", "recover"].forEach((name, i) => {
								if (num >= i + 1) {
									skills.add(`wuyu_dandao_qinggang_${name}`);
								}
							});
							trigger.targets.filter(target => target != player).forEach(target => target.addTempSkill(skills, "roundEnd"));
						},
					},
					equip: {
						trigger: {
							player: ["loseAfter"],
							global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
						},
						forced: true,
						charlotte: true,
						filter(event, player) {
							if (event.name == "equip" && event.player == player) {
								return true;
							}
							let evt = event.getl(player);
							return evt && evt.player == player && evt.es?.length;
						},
						marktext: "斩",
						mark: true,
						intro: {
							name: "斩",
							mark(dialog, storage, player) {
								dialog.addText("装备失效");
								if (player.hasSkill("wuyu_dandao_qinggang_fengyin")) {
									dialog.addText("非锁定技失效");
								}
								if (player.hasSkill("wuyu_dandao_qinggang_baiban")) {
									dialog.addText("所有技能失效");
								}
								if (player.hasSkill("wuyu_dandao_qinggang_hujia")) {
									dialog.addText("无法获得护甲");
								}
								if (player.hasSkill("wuyu_dandao_qinggang_recover")) {
									dialog.addText("无法回复体力");
								}
							},
						},
						mod: {
							attackRange(player, num) {
								return num + 1 - player.getEquipRange();
							},
							globalFrom(from, to, distance) {
								let num = 0;
								for (let i of from.getVCards("e")) {
									let info = get.info(i).distance;
									if (!info) continue;
									if (info.globalFrom) num += info.globalFrom;
								}
								return distance - num;
							},
							globalTo(from, to, distance) {
								let num = 0;
								for (let i of to.getVCards("e")) {
									let info = get.info(i).distance;
									if (!info) continue;
									if (info.globalTo) num += info.globalTo;
									if (info.attackTo) num += info.attackTo;
								}
								return distance - num;
							},
						},
						init(player, skill) {
							let skills = player.getSkills("e", true, false);
							player.disableSkill(skill, skills);
						},
						onremove(player, skill) {
							player.enableSkill(skill);
						},
						async content(event, trigger, player) {
							let skills = player.getSkills("e", true, false);
							player.disableSkill(event.name, skills);
						},
					},
					fengyin: {
						trigger: {
							player: ["changeSkillsAfter"],
						},
						forced: true,
						charlotte: true,
						init(player, skill) {
							let skills = player.getSkills(null, false, false).filter(sk => {
								let info = get.info(sk);
								return info && !get.is.locked(sk) && !info.charlotte && get.skillInfoTranslation(sk, player).length;
							});
							player.disableSkill(skill, skills);
						},
						onremove(player, skill) {
							player.enableSkill(skill);
						},
						async content(event, trigger, player) {
							let skills = player.getSkills(null, false, false).filter(sk => {
								let info = get.info(sk);
								return info && !get.is.locked(sk) && !info.charlotte && get.skillInfoTranslation(sk, player).length;
							});
							player.disableSkill(event.name, skills);
						},
					},
					baiban: {
						trigger: {
							player: ["changeSkillsAfter"],
						},
						forced: true,
						charlotte: true,
						init(player, skill) {
							let skills = player.getSkills(null, false, false).filter(sk => {
								let info = get.info(sk);
								return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
							});
							player.disableSkill(skill, skills);
						},
						onremove(player, skill) {
							player.enableSkill(skill);
						},
						async content(event, trigger, player) {
							let skills = player.getSkills(null, false, false).filter(sk => {
								let info = get.info(sk);
								return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
							});
							player.disableSkill(event.name, skills);
						},
					},
					hujia: {
						trigger: {
							player: ["changeHujiaBegin"],
						},
						forced: true,
						charlotte: true,
						filter(event, player) {
							return event.num > 0;
						},
						async content(event, trigger, player) {
							trigger.cancel();
						},
					},
					recover: {
						trigger: {
							player: ["recoverBegin"],
						},
						forced: true,
						charlotte: true,
						filter(event, player) {
							return event.num > 0;
						},
						async content(event, trigger, player) {
							trigger.cancel();
						},
					},
				},
			},
			fenjue: [["qinggang", "sha"]],
			decs: "你使用牌时,若你本回合使用过同名牌且未因此牌名触发此效果,获得一枚'斩'标记;使用牌时移除至多5枚'斩'标记,对除你以外的目标执行对应效果:1.本轮装备失效,2.本轮非锁定技失效,3.本轮所有技能失效,4.本轮不能获得护甲,5.本轮不能回复体力",
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, 0);
			},
			judge(cards, storage) {
				let num = get.player().getStorage("wuyu_dandao").x_cuilian;
				return num >= storage && storage < 5;
			},
			async effect(event, trigger, player) {
				let { skill, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name],
					count = player.getStorage("wuyu_dandao").x_cuilian;
				num++;
				count -= num;
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, num);
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "x_cuilian", count);
			},
		},
		{
			name: "range",
			skill: {
				forced: true,
				charlotte: true,
				mod: {
					targetInRange(card, player, target) {
						return true;
					},
				},
			},
			fenjue: [["equip1", "equip1"]],
			mark: true,
			decs: "使用牌无距离限制",
			intro(storage, use) {
				return "使用牌无距离限制";
			},
			judge(cards, storage) {
				return !storage;
			},
		},
		{
			name: "shashan",
			skill: {
				forced: true,
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						if (typeof num == "number") {
							return (num += player.getStorage("wuyu_dandao").shashan);
						}
					},
				},
			},
			fenjue: [["sha", "shan"]],
			mark: true,
			decs: "使用牌次数+1",
			intro(storage, use) {
				return `使用牌次数+${storage}`;
			},
		},
		{
			name: "shunshou",
			skill: {
				trigger: {
					player: ["loseAfter"],
					global: ["loseAsyncAfter"],
				},
				forced: true,
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").shunshou;
				},
				filter(event, player) {
					return event.getl(player).hs.length;
				},
				async content(event, trigger, player) {
					await player.draw();
				},
			},
			fenjue: [
				["equip2", "guohe"],
				["shan", "shunshou"],
				["shan", "equip3"],
			],
			mark: true,
			decs: "每回合限x次,失去牌时摸一张牌",
			intro(storage, use) {
				return `失去牌时摸一张牌(${use}/${storage})`;
			},
		},
		{
			name: "tao",
			fenjue: [["tao", "tao"]],
			decs: "增加x点体力上限",
			async effect(event, trigger, player) {
				let add = player.getStorage("wuyu_dandao").z3_addnum;
				await player.gainMaxHp(add);
			},
		},
		{
			name: "taoshan",
			skill: {
				trigger: {
					player: ["phaseEnd", "roundStart"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").taoshan;
					await player.changeHujia(num * 2);
				},
			},
			fenjue: [["tao", "shan"]],
			mark: true,
			decs: "每轮开始时/回合结束时,获得2x点护甲",
			intro(storage, use) {
				return `每轮开始时/回合结束时,获得${storage * 2}点护甲`;
			},
		},
		{
			name: "x_cuilian",
			fenjue: [["basic"], ["trick"], ["equip"], ["delay"]],
			judge(cards, storage) {
				let player = get.player();
				if (player.name != "wuyu_sunhanhua" && player.name2 != "wuyu_sunhanhua") {
					return false;
				}
				return get.suit(cards[0], false) == get.suit(cards[1], false) || get.number(cards[0], false) == get.number(cards[1], false);
			},
			mark: true,
			decs: "淬炼",
		},
		{
			name: "z_bingle",
			fenjue: [
				["bingliang", "trick"],
				["lebu", "trick"],
			],
			mark: true,
			skill: {
				trigger: {
					player: ["phaseEnd"],
				},
				charlotte: true,
				filter(event, player) {
					return event.skill != "wuyu_dandao";
				},
				async cost(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_bingle;
					let result = await player
						.chooseButton(
							[
								[
									dialog => {
										let num = get.event().dandaoArgs.num,
											list = get.event().dandaoArgs.list;
										for (let i = 0; i < num; i++) {
											dialog.add("选择一个阶段");
											dialog.add([list, "tdnodes"]);
										}
									},
									"handle",
								],
							],
							[1, num]
						)
						.set("dandaoArgs", {
							num: num,
							list: lib.phaseName.map(phase => [phase, get.translation(phase)]),
						})
						.set("filterButton", button => {
							let event = get.event();
							let buttons = Array.from(event.dialog.querySelectorAll(".buttons") as NodeList)
								.map(node => Array.from(node.childNodes))
								.filter(arr => arr.includes(button))
								.flat();
							let bool = buttons.some(buttonx => ui.selected.buttons.includes(buttonx)) && buttons.includes(button);
							if (bool) {
								return false;
							}
							return true;
						})
						.set("custom", {
							add: {
								button() {
									let event = get.event(),
										parent = get.event().getParent();
									if (!parent.phaselist) {
										parent.phaselist = [];
									}
									let buttons = Array.from(event.dialog.querySelectorAll(".buttons") as NodeList).map(node =>
										Array.from(node.childNodes)
									);
									ui.selected.buttons.forEach(button => {
										let index = buttons.findIndex(arr => arr.includes(button));
										parent.phaselist[index] = button.link;
									});
								},
							},
						})
						.forResult();
					event.result = {
						bool: result.bool,
						confirm: result.confirm,
						cost_data: event.phaselist,
					};
				},
				async content(event, trigger, player) {
					let phaselist = event.cost_data;
					player.insertPhase().set("phaseList", phaselist).set("skill", "wuyu_dandao");
				},
			},
			cl: [1, 1],
			decs: "回合结束时执行一个自定义x个阶段的回合",
			intro(storage, use) {
				return `回合结束时执行一个自定义${storage}个阶段的回合`;
			},
		},
		{
			name: "z_dashi",
			fenjue: [["dashi", "trick", "trick"]],
			mark: true,
			skill: {
				trigger: {
					player: ["useCard"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return get.type(event.card, null, player) == "trick";
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_dashi;
					trigger.effectCount += num;
					game.log(player, "令", trigger.card, "额外结算", num, "次");
				},
			},
			cl: [1, 1],
			decs: "使用锦囊牌额外结算X次",
			intro(storage, use) {
				return `使用锦囊牌额外结算${storage}次`;
			},
		},
		{
			name: "z_dis",
			fenjue: [["basic"], ["trick"], ["equip"], ["delay"]],
			mark: true,
			cl: [1, 1],
			decs: "被动技不会无效/失效,【丹道】不会失去",
			intro(storage, name, use) {
				return "被动技不会无效/失效,【丹道】不会失去";
			},
			judge(cards, storage) {
				return get.type2(cards[0], false) == get.type2(cards[1], false) && !storage;
			},
			async effect(event, trigger, player) {
				get.info("wuyu_dandao").originalFunc = {
					filterTrigger: lib.filter.filterTrigger,
				};
				Object.defineProperty(lib.filter, "filterTrigger", {
					get() {
						return (event, player, triggername, skill, indexedData) => {
							if (player.getStorage("wuyu_dandao").z_dis) {
								return get.info("wuyu_dandao").dandaoFunc.filterTrigger(event, player, triggername, skill, indexedData);
							}
							return get.info("wuyu_dandao").originalFunc.filterTrigger(event, player, triggername, skill, indexedData);
						};
					},
					set(value) {
						get.info("wuyu_dandao").originalFunc.filterTrigger = value;
					},
					configurable: false,
					enumerable: true,
				});
			},
		},
		{
			name: "z_fugui",
			skill: {
				trigger: {
					player: ["loseAfter"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				charlotte: true,
				forced: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").z_fugui * 3;
				},
				filter(event, player) {
					let evt = event.getl(player),
						parent = event.getParent();
					if (parent.name == "useCard" && ["equip", "delay"].includes(get.type(parent.card, null, event.player))) {
						return false;
					}
					let cards = evt.cards2.concat(evt.ss);
					return cards.filter(card => card.hasGaintag("eternal_wuyu_dandao_copy") && get.owner(card) != player && get.position(card))
						.length;
				},
				async content(event, trigger, player) {
					let evt = trigger.getl(player);
					let lose = evt.cards2.concat(evt.ss);
					let cards = lose.filter(card => card.hasGaintag("eternal_wuyu_dandao_copy") && get.owner(card) != player && get.position(card));
					if (cards.length) {
						await player.gain(cards, "gain2");
					}
				},
			},
			fenjue: [["fugui"]],
			judge(cards, storage) {
				if (cards.length < 2) {
					return false;
				}
				return true;
			},
			mark: true,
			decs: "获得一张牌的复制,每回限3x次,失去复制牌时获得之",
			intro(storage, use) {
				return `失去复制牌时获得之(${use}/${storage * 3})`;
			},
			cl: [1, 1],
			async effect(event, trigger, player) {
				let { cards } = event.dandaoArgs;
				let card = cards.find(card => card.name != "fugui") || cards[0];
				let cardx = game.createCard(card.name, card.suit, card.number, card.nature);
				game.broadcastAll((cardx, card) => (cardx.destroyed = card.destroyed), cardx, card);
				let next = player.gain(cardx);
				next.gaintag.add("eternal_wuyu_dandao_copy");
				await next;
			},
		},
		{
			name: "z_guilai",
			skill: {
				trigger: {
					player: ["dieBegin"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					let num = player.getStorage("wuyu_dandao").z_guilai;
					return num && player.getHp() <= 0;
				},
				async content(event, trigger, player) {
					let count = player.getStorage("wuyu_dandao").z_guilai;
					count--;
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "z_guilai", count);
					player.markSkill("wuyu_dandao_mark");
					let num = player.getHp();
					if (player.maxHP < 1) {
						player.maxHp = 1;
					}
					await player.changeHp(1 - num);
					if (player.getHp() > 0) {
						trigger.cancel();
					}
				},
			},
			fenjue: [["guilai", "guilai"]],
			decs: "复活次数+1",
			cl: [1, 1],
			mark: true,
			intro(storage, use) {
				return `复活次数:${storage}`;
			},
		},
		{
			name: "z_haoyun",
			fenjue: [
				["haoyun", "haoyun"],
				["haoyun", "hongyun"],
				["hongyun", "hongyun"],
			],
			mark: true,
			cl: [1, 1],
			decs: "从5x个随机技能中选择x个获得",
			intro(storage, use) {
				return `从${storage * 5}个随机技能中选择${storage}个获得`;
			},
			async effect(event, trigger, player) {
				let { skill, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name];
				if (!player.getStorage(skill).allSkill) {
					let list = [];
					for (let character in lib.character) {
						let skills = get.character(character, 3);
						list.addArray(skills);
					}
					list.flat().unique();
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "allSkill", list);
				}
				let skills = player
					.getStorage(skill)
					.allSkill.filter(skill => !player.hasSkill(skill, "invisible", true, false))
					.randomGets(num * 5);
				if (!skills.length) {
					player.chat("时也,命也");
					await player.draw(3);
					return;
				}
				let result = await player
					.chooseButton([
						`从${player.getStorage(skill)[name] * 5}个随机技能中选择${player.getStorage(skill)[name]}个获得`,
						[skills, "skill"],
					])
					.set("selectButton", [1, num])
					.forResult();
				if (result.bool) {
					player.markAuto("wuyu_dandao_skillNote", result.links);
					await player.addSkills(result.links);
				}
			},
		},
		{
			name: "z_jiaoyou",
			fenjue: [["jiaoyou", "basic"]],
			mark: true,
			skill: {
				trigger: {
					player: ["useCard"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return get.type(event.card, null, player) == "basic";
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_jiaoyou;
					trigger.baseDamage += num;
					game.log(player, "令", trigger.card, "数值+", num);
				},
			},
			cl: [1, 1],
			decs: "基本牌数值+1",
			intro(storage, use) {
				return `基本牌数值+${storage}`;
			},
		},
		{
			name: "z_jinnaoblack",
			fenjue: [["jinnao"]],
			mark: true,
			judge(cards, storage) {
				if (cards.length < 2) {
					return false;
				}
				let player = get.player();
				if (
					player.countCards("x", card => {
						let gaintags = card.gaintag.filter(tag => {
							let str;
							if (tag.startsWith("eternal_")) {
								str = lib.translate[tag.slice(8)];
								return str.length && str != "invisible";
							}
							str = lib.translate[tag];
							return str.length && str != "invisible";
						});
						if (gaintags.length < 1) {
							return false;
						}
						return true;
					}) < 1
				) {
					return false;
				}
				let card = cards.find(card => card.name == "jinnao");
				return get.color(card, false) != "red";
			},
			cl: [1, 1],
			decs: "摸x张牌并将x张牌置于武将牌上对应区域",
			intro(storage, use) {
				return `摸${storage}张牌并将${storage}张牌置于武将牌上对应区域`;
			},
			async effect(event, trigger, player) {
				let { skill, cards, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name];
				await player.draw(num);
				let gaintags = player
					.getCards("x")
					.filter(card => {
						let gaintags = card.gaintag.filter(tag => {
							let str;
							if (tag.startsWith("eternal_")) {
								str = lib.translate[tag.slice(8)];
								return str.length && str != "invisible";
							}
							str = lib.translate[tag];
							return str.length && str != "invisible";
						});
						if (gaintags.length < 1) {
							return false;
						}
						return true;
					})
					.map(card => card.gaintag)
					.flat()
					.unique()
					.map(tag => {
						if (tag.startsWith("eternal_")) {
							return [tag, get.translation(tag.slice(8))];
						}
						return [tag, get.translation(tag)];
					});
				let result = await player.chooseButton(["选择一个标记区域", [gaintags, "tdnodes"]]).forResult();
				if (!result.bool) {
					return;
				}
				let str = result.links[0].startsWith("eternal_") ? get.translation(result.links[0].slice(8)) : get.translation(result.links[0]);
				let { cards: cardx } = await player
					.chooseCard("hs", `将${num}张牌置于武将牌上${get.translation(str)}区域`, [1, num])
					.set("dandao_skill", cards)
					.set("filterCard", card => {
						let event = get.event();
						return !card.gaintag.includes(event.dandaotag) && !event.dandao_skill.includes(card);
					})
					.set("dandaotag", result.links[0])
					.forResult();
				if (cardx.length) {
					let next = player.addToExpansion(cardx, player, "give");
					next.gaintag.add(result.links[0]);
					await next;
				}
			},
		},
		{
			name: "z_jinnaored",
			fenjue: [["jinnao"]],
			mark: true,
			judge(cards, storage) {
				if (cards.length < 2) {
					return false;
				}
				let player = get.player();
				if (
					player.countCards("hs", card => {
						let gaintags = card.gaintag.filter(tag => {
							let str;
							if (tag.startsWith("eternal_")) {
								str = lib.translate[tag.slice(8)];
								return str.length && str != "invisible";
							}
							str = lib.translate[tag];
							return str.length && str != "invisible";
						});
						if (gaintags.length < 1) {
							return false;
						}
						return true;
					}) < 1
				) {
					return false;
				}
				let card = cards.find(card => card.name == "jinnao");
				return get.color(card, false) != "black";
			},
			cl: [1, 1],
			decs: "摸x张牌并令x张牌获得手牌中拥有的一个标记",
			intro(storage, use) {
				return `摸${storage}张牌并令${storage}张牌获得手牌中拥有的一个标记`;
			},
			async effect(event, trigger, player) {
				let { skill, cards, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name];
				await player.draw(num);
				let gaintags = player
					.getCards("hs")
					.concat(cards)
					.filter(card => {
						let gaintags = card.gaintag.filter(tag => {
							let str;
							if (tag.startsWith("eternal_")) {
								str = lib.translate[tag.slice(8)];
								return str.length && str != "invisible";
							}
							str = lib.translate[tag];
							return str.length && str != "invisible";
						});
						if (gaintags.length < 1) {
							return false;
						}
						return true;
					})
					.map(card => card.gaintag)
					.flat()
					.unique()
					.map(tag => {
						if (tag.startsWith("eternal_")) {
							return [tag, get.translation(tag.slice(8))];
						}
						return [tag, get.translation(tag)];
					});
				let result = await player.chooseButton(["选择一个标记", [gaintags, "tdnodes"]]).forResult();
				if (!result.bool) {
					return;
				}
				let str = result.links[0].startsWith("eternal_") ? get.translation(result.links[0].slice(8)) : get.translation(result.links[0]);
				let { cards: cardx } = await player
					.chooseCard("hs", `令${num}张牌获得${get.translation(str)}标记`, [1, num])
					.set("dandao_skill", cards)
					.set("filterCard", card => {
						let event = get.event();
						return !card.gaintag.includes(event.dandaotag) && !event.dandao_skill.includes(card);
					})
					.set("dandaotag", result.links[0])
					.forResult();
				if (cardx.length) {
					player.addGaintag(cardx, result.links[0]);
				}
			},
		},
		{
			name: "z_leihuo",
			skill: {
				trigger: {
					player: ["useCardToPlayered"],
				},
				forced: true,
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").z_leihuo;
				},
				filter(event, player) {
					return event.target != player;
				},
				async content(event, trigger, player) {
					let nature = ["fire", "thunder"].randomGet();
					await trigger.target.damage(1, nature, player);
				},
			},
			fenjue: [
				["tianlei", "sha"],
				["liehuo", "sha"],
			],
			mark: true,
			cl: [1, 1],
			decs: "每回合限x次,使用牌指定其他角色为目标时令其随机受到一点火焰/雷电伤害",
			intro(storage, use) {
				return `使用牌指定其他角色为目标时令其随机受到一点火焰/雷电伤害(${use}/${storage})`;
			},
		},
		{
			name: "z_muniu",
			skill: {
				trigger: {
					player: ["loseAfter"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					let num = player.getStorage("wuyu_dandao").z_muniu;
					return player.countCards("h") < num;
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_muniu;
					await player.draw(num - player.countCards("h"));
				},
			},
			fenjue: [["muniu", "muniu"]],
			cl: [1, 1],
			mark: true,
			decs: "最小手牌数+1",
			intro(storage, use) {
				return `最小手牌数：${storage}`;
			},
		},
		{
			name: "z_quanjiu",
			skill: {
				trigger: {
					player: ["useCardToPlayered"],
				},
				forced: true,
				charlotte: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").z_quanjiu;
				},
				filter(event, player) {
					return event.target != player;
				},
				async content(event, trigger, player) {
					await trigger.target.loseHp();
				},
			},
			fenjue: [
				["kquanjiux", "kquanjiux"],
				["khquanjiu", "khquanjiu"],
				["khquanjiu", "khquanjiux"],
			],
			mark: true,
			cl: [1, 1],
			decs: "每回合限x次,使用牌指定其他角色为目标时令其失去1点体力",
			intro(storage, use) {
				return `使用牌指定其他角色为目标时令其失去1点体力(${use}/${storage})`;
			},
		},
		{
			name: "z_shenbing",
			fenjue: [["shenbing", "equip"]],
			skill: {
				forced: true,
				charlotte: true,
				marktext: "武",
				intro: {
					name: "武",
					mark(dialog, storage, player) {
						let info = player.getStorage("wuyu_dandao").z_shenbing;
						dialog.addText("装备上限:<br>");
						dialog.addText(
							Object.keys(info.max)
								.map(subtype => `${get.translation(subtype)}:${info.max[subtype]}`)
								.join("")
						);
						dialog.addText("视为拥有以下装备效果(不会失效):<br>");
						dialog.addSmall([info.name, "vcard"]);
					},
				},
				mod: {
					globalFrom(from, to, distance) {
						return (
							distance +
							from.getStorage("wuyu_dandao").z_shenbing.name.reduce((sum, name) => sum + (lib.card[name]?.distance?.globalFrom || 0), 0)
						);
					},
					globalTo(from, to, distance) {
						return (
							distance +
							to.getStorage("wuyu_dandao").z_shenbing.name.reduce((sum, name) => sum + (lib.card[name]?.distance?.globalTo || 0), 0)
						);
					},
					attackRange(from, distance) {
						return (
							distance -
							from.getStorage("wuyu_dandao").z_shenbing.name.reduce((sum, name) => sum + (lib.card[name]?.distance?.attackFrom || 0), 0)
						);
					},
					attackTo(from, to, distance) {
						return (
							distance +
							to.getStorage("wuyu_dandao").z_shenbing.name.reduce((sum, name) => sum + (lib.card[name]?.distance?.attackTo || 0), 0)
						);
					},
				},
			},
			cl: [1, 1],
			decs: "视为拥有一张装备牌的效果(不会失效且独立)",
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, {
					name: [],
					max: {
						equip1: 1,
						equip2: 1,
						equip3: 1,
						equip4: 1,
						equip5: 1,
					},
				});
			},
			judge(cards, storage) {
				let card = cards.find(card => card.name != "shenbing");
				return !storage.name.includes(card.name);
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs;
				let skillx = `${skill}_${name}`;
				let card = cards.find(card => card.name != "shenbing"),
					storage = player.getStorage(skill)[name];
				let list = storage.name.reduce((list, cardx) => {
					if (get.subtype(cardx, false) == get.subtype(card, false)) {
						list.push(cardx);
					}
					return list;
				}, []);
				if (list.length >= storage.max[get.subtype(card, false)]) {
					let cardx = get.autoViewAs({
						name: list[0],
					});
					player.removeAdditionalSkill(
						skill,
						get.skillsFromEquips([cardx]).map(sk => `z_shenbing_${sk}`)
					);
					storage.name.remove(list[0]);
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, storage);
				}
				storage.name.push(card.name);
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, storage);
				let skills = get.info("wuyu_dandao").dandaoFunc.dandaoCreateEquipSkills(get.skillsFromEquips([card]));
				player.addAdditionalSkill(skill, skills, true);
				player.markSkill(skillx);
			},
		},
		{
			name: "z_shenbingmax",
			fenjue: [
				["tianlei", "shenbing"],
				["liehuo", "shenbing"],
			],
			cl: [1, 1],
			decs: "丹道可视为拥有装备效果随机副类别上限+1",
			async effect(event, trigger, player) {
				let type = ["equip1", "equip2", "equip3", "equip4", "equip5"].randomGet(),
					storage = player.getStorage("wuyu_dandao").z_shenbing;
				storage.max[type]++;
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "z_shenbing", storage);
			},
		},
		{
			name: "z_wuxiesha",
			skill: {
				trigger: {
					player: ["damageBegin3"],
					source: ["damageBegin3"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return !event.hasNature();
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_wuxiesha;
					if (trigger.player == player) {
						trigger.num -= num;
						game.log(player, "受到伤害-", num);
					} else {
						trigger.num += num;
						game.log(player, "造成到伤害+", num);
					}
				},
			},
			cl: [1, 1],
			fenjue: [["wuxie", "sha"]],
			mark: true,
			decs: "受到/造成非属性伤害-/+x(来源与受伤角色皆为你时减少两次)",
			intro(storage, use) {
				return `受到/造成非属性伤害-/+${storage}(来源与受伤角色皆为你时减少两次)`;
			},
		},
		{
			name: "z_wuxieshandian",
			skill: {
				trigger: {
					player: ["damageBegin3"],
					source: ["damageBegin3"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return event.hasNature();
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_wuxieshandian;
					if (trigger.player == player) {
						trigger.num -= num;
						game.log(player, "受到伤害-", num);
					} else {
						trigger.num += num;
						game.log(player, "造成到伤害+", num);
					}
				},
			},
			cl: [1, 1],
			fenjue: [
				["wuxie", "shandian"],
				["wuxie", "huogong"],
			],
			mark: true,
			decs: "受到/造成属性伤害-/+x(来源与受伤角色皆为你时减少两次)",
			intro(storage, use) {
				return `受到/造成属性伤害-/+${storage}(来源与受伤角色皆为你时减少两次)`;
			},
		},
		{
			name: "z_wuzhong",
			fenjue: [["wuzhong", "wuzhong"]],
			cl: [1, 1],
			mark: true,
			decs: "创造x张牌库中的临时牌",
			intro(storage, use) {
				return `创造${storage}张牌获得`;
			},
			async effect(event, trigger, player) {
				let { skill, name } = event.dandaoArgs,
					list = [],
					dialog,
					func = (player, list, skill, name, dialog) => {
						dialog = ui.create.dialog(`选择${player.getStorage(skill)[name]}张牌创造并获得,这些牌进入弃牌堆时销毁`);
						let packButtons = ui.create.div();
						for (let pack in lib.cardPack) {
							if (pack == "zhanfa") {
								continue;
							}
							let packButton = ui.create.button([pack, get.translation(`${pack}_card_config`)], "tdnodes");
							packButton.classList.add("filterButton");
							packButton.listen(event => {
								dialog.querySelectorAll("div.filterButton").forEach(button => {
									button.classList.remove("glow");
								});
								packButton.classList.add("glow");
								dialog.querySelectorAll("div.card.button").forEach(card => {
									if (lib.cardPack[pack].includes(card.name)) {
										card.classList.remove("nodisplay");
									} else {
										card.classList.add("nodisplay");
									}
								});
							});
							packButtons.appendChild(packButton);
							if (lib.cardPack[pack].includes("sha")) {
								let natureList = [...lib.nature.keys()];
								list.addArray(natureList.map(nature => ["", "", "sha", nature]));
							}
							list.addArray(lib.cardPack[pack].map(card => ["", "", card]));
						}
						let packButton = ui.create.button(["clear", "清除选择"], "tdnodes");
						packButton.classList.add("filterButton");
						packButton.listen(event => {
							if (!ui.selected.buttons.length) {
								return;
							}
							ui.selected.buttons = [];
							dialog.querySelectorAll("div.card.button").forEach(card => {
								card.classList.remove("selectable");
								card.classList.remove("selected");
								let counterNode = card.querySelector(".caption");
								if (counterNode) {
									counterNode.childNodes[0].innerHTML = "x0";
								}
							});
							game.check();
						});
						packButtons.appendChild(packButton);
						dialog.add(packButtons);
						let createButton = (item, type, position, noclick, node) => {
							node = ui.create.buttonPresets.vcard(item, type, position, noclick);
							let counterNode = ui.create.caption(
								"<span style=font-size:24px; font-family:xinwei; text-shadow:#FFF 0 0 4px, #FFF 0 0 4px, rgba(74,29,1,1) 0 0 3px;>×0</span>",
								node
							);
							counterNode.style.right = "5px";
							counterNode.style.bottom = "2px";
							let drop = ui.create.div(".shadowed", "-", node);
							drop.style.width = "50px";
							drop.style.height = "50px";
							drop.style.display = "flex";
							drop.style.justifyContent = "center";
							drop.style.alignItems = "center";
							drop.listen(event => {
								let num = get.numOf(ui.selected.buttons, node);
								if (num) {
									ui.selected.buttons.remove(node);
									counterNode.innerHTML = `×${num - 1}`;
									if (num == 1) {
										node.classList.remove("selected");
									}
									game.check();
								}
							});
							node.listen(event => {
								if (event.target === drop) {
									event.stopImmediatePropagation();
									return;
								}
							});
							drop.style.left = "7px";
							drop.style.bottom = "5px";
							return node;
						};
						dialog.add([list, createButton]);
					};
				if (event.isMine()) {
					func(player, list, skill, name, dialog);
				} else if (player.isOnline2()) {
					player.send(func, player, list, skill, name, dialog);
				}
				let result = await player
					.chooseButton()
					.set("dialog", dialog)
					.set("selectButton", [1, get.player().getStorage(skill)[name]])
					.set("numx", get.player().getStorage(skill)[name])
					.set("custom", {
						add: {
							confirm(bool) {
								if (bool != true) {
									return;
								}
								if (ui.confirm) {
									ui.confirm.close();
								}
								if (ui.dialog) {
									ui.dialog.close();
								}
								game.uncheck();
							},
							button() {
								if (ui.selected.buttons.length) {
									return;
								}
								let event = get.event();
								if (event.dialog && event.dialog.buttons) {
									for (let i = 0; i < event.dialog.buttons.length; i++) {
										let button = event.dialog.buttons[i];
										let counterNode = button.querySelector(".caption");
										counterNode.innerHTML = "x0";
									}
								}
							},
						},
						replace: {
							button(button) {
								let event = get.event();
								if (!event.isMine()) {
									return;
								}
								if (button.classList.contains("selectable") == false) {
									return;
								}
								if (ui.selected.buttons.length >= event.numx) {
									return false;
								}
								button.classList.add("selected");
								ui.selected.buttons.push(button);
								let counterNode = button.querySelector(".caption");
								counterNode.innerHTML = `×${get.numOf(ui.selected.buttons, button)}`;
								game.check();
							},
						},
					})
					.forResult();
				if (result.bool) {
					let names = result.links.map(info => info[2]);
					let storage = player.getStorage(skill).wangmeinames,
						list = names.filter(name => !lib.inpile.includes(name));
					if (list.length) {
						storage.addArray(list);
						get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "wangmeinames", storage);
					}
					let cards = result.links.map(link => {
						let card = game.createCard(link[2], ["none", ...lib.suit].randomGet(), get.rand(0, 13), link[3]);
						game.broadcastAll(card => (card.destroyed = "discardPile"), card);
						return card;
					});
					await player.gain(cards, "gain2");
					player.addGaintag(cards, "eternal_wuyu_dandao_temp");
				}
			},
		},
		{
			name: "z_wutian",
			fenjue: [
				["wutian", "basic"],
				["wutian", "trick", "trick"],
				["wutian", "delay"],
			],
			cl: [1, 1],
			mark: true,
			decs: "从2x个描述中包含对应牌名的技能中选择x个获得",
			intro(storage, use) {
				return `从${storage * 2}个描述中包含对应牌名的技能中选择${storage}个获得`;
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs;
				let card = cards.find(card => card.name != "wutian") || cards[0];
				let skills = get.info(skill).dandaoSkill(player, skill, name, card);
				if (!skills.length) {
					player.chat("时也,命也");
					await player.draw();
					return;
				}
				let result = await player
					.chooseButton([
						`从${player.getStorage(skill)[name] * 2}个描述中包含【${get.translation(card.name)}】的技能中选择${player.getStorage(skill)[name]}个获得`,
						[skills, "skill"],
					])
					.set("selectButton", [1, get.player().getStorage(skill)[name]])
					.forResult();
				if (result.bool) {
					await player.addSkills(result.links);
				}
			},
		},
		{
			name: "z_wutianequip",
			fenjue: [["wutian", "equip"]],
			cl: [1, 1],
			mark: true,
			decs: "从2x个此牌的兵主技能中选择x个获得",
			intro(storage, use) {
				return `从${storage * 2}个此牌的兵主技能中选择${storage}个获得`;
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs;
				let card = cards.find(card => card.name != "wutian");
				let skills = get.info(skill).dandaoSkill(player, skill, name, card);
				if (!skills.length) {
					player.chat("时也,命也");
					await player.draw();
					return;
				}
				let result = await player
					.chooseButton([
						`从${player.getStorage(skill)[name] * 2}个【${get.translation(card.name)}】的兵主技能中选择${player.getStorage(skill)[name]}个获得`,
						[skills, "skill"],
					])
					.set("selectButton", [1, get.player().getStorage(skill)[name]])
					.forResult();
				if (result.bool) {
					await player.addSkills(result.links);
				}
			},
		},
		{
			name: "z_wutianzhanfa",
			fenjue: [["wutian", "wutian"]],
			cl: [1, 1],
			mark: true,
			decs: "从4x个战法中选择2x个获得",
			intro(storage, use) {
				return `从${storage * 4}个战法中选择${storage * 2}个获得`;
			},
			async effect(event, trigger, player) {
				let { skill, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name];
				let list = lib.zhanfa
					.getList()
					.filter(zhanfa => !player.hasZhanfa(zhanfa))
					.randomGets(num * 4);
				if (!list.length) {
					player.chat("时也,命也");
					await player.draw(2);
					return;
				}
				let result = await player
					.chooseButton([`获得${num * 2}个战法`, [list, "vcard"]])
					.set("selectButton", [1, num * 2])
					.forResult();
				if (result.bool && result.links?.length) {
					for (let link of result.links) {
						player.addZhanfa(link[2]);
					}
				}
			},
		},
		{
			name: "z_wuzhongmuniu",
			skill: {
				trigger: {
					player: ["phaseEnd"],
					global: ["roundEnd"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_wuzhongmuniu;
					await player.draw(num);
					let result = await player.chooseCard(`将至多${num}张牌移出游戏`, "he", [1, num]).forResult();
					if (!result.bool) {
						return;
					}
					let next = player.loseToSpecial(result.cards, "wuyu_dandao_special");
					next.set("visible", true);
					await next;
				},
			},
			fenjue: [["wuzhong", "muniu"]],
			cl: [1, 1],
			mark: true,
			decs: "回合结束时或每轮结束时,摸x张牌并可将至多等量张牌移出游戏,可如手牌般使用或打出以此法移出游戏的牌",
			intro(storage, use) {
				return `回合结束时或每轮结束时,摸${storage}张牌并可将至多等量张牌移出游戏,可如手牌般使用或打出以此法移出游戏的牌`;
			},
		},
		{
			name: "z_yinglangblack",
			skill: {
				trigger: {
					global: ["useCard"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return player.getStorage("wuyu_dandao").z_yinglangblack.includes(event.card.name);
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").z_yinglangblack.length;
					await player.draw(num);
				},
			},
			fenjue: [["yinglang"]],
			judge(cards, storage) {
				let card = cards.find(card => card.name == "yinglang");
				if (storage.includes(card.name) || cards.length < 2) {
					return false;
				}
				return cards.some(card => card.name == "yinglang" && get.color(card, false) != "red");
			},
			cl: [1, 1],
			decs: "有角色使用记录牌时,摸x张牌",
			intro(storage, use) {
				return `有角色使用记录牌时,摸x张牌,已记录牌名:${get.translation(storage).replace(/、/g, ",")}`;
			},
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, []);
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs,
					card = cards.find(card => card.name != "yinglang") || cards[0];
				let cardname = card.name;
				let list = player.getStorage(skill)[name];
				list.push(cardname);
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, list);
			},
		},
		{
			name: "z_yinglangred",
			skill: {
				trigger: {
					global: ["useCard"],
				},
				charlotte: true,
				prompt(event, player) {
					return `令${get.translation(event.card)}无效`;
				},
				filter(event, player) {
					let num = player.getHistory(
							"useSkill",
							evt => evt.skill == "wuyu_dandao_z_yinglangred" && evt.event.getParent(2).card.name == event.card.name
						).length,
						count = player.getStorage("wuyu_dandao").z_yinglangred.count;
					return player.getStorage("wuyu_dandao").z_yinglangred.name.includes(event.card.name) && num < count;
				},
				async content(event, trigger, player) {
					trigger.cancel();
					game.log(player, "令", trigger.card, "无效");
				},
			},
			fenjue: [["yinglang"]],
			judge(cards, storage) {
				let card = cards.find(card => card.name == "yinglang");
				if (storage.name.includes(card.name) || cards.length < 2) {
					return false;
				}
				return cards.some(card => card.name == "yinglang" && get.color(card, false) != "black");
			},
			cl: [1, 1],
			decs: "每回合每种牌名限x次,任意角色使用记录牌时,可令其无效",
			intro(storage, use) {
				if (!storage.count) {
					return;
				}
				return `任意角色使用记录牌时,可令其无效,(${storage.count})\n已记录牌名:${get.translation(storage.name).replace(/、/g, ",")}`;
			},
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, {
					name: [],
					count: 0,
				});
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs;
				let card = cards.find(card => card.name != "yinglang") || cards[0];
				let cardname = card.name,
					add = player.getStorage(skill).z3_addnum;
				let info = player.getStorage(skill)[name];
				info.name.add(cardname);
				info.count += add;
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, info);
			},
		},
		{
			name: "z3_addnum",
			fenjue: [
				["tianlei", "liehuo"],
				["liehuo", "liehuo"],
				["shandian", "shandian"],
				["huogong", "huogong"],
				["tianlei", "tianlei"],
			],
			cl: [3, 3],
			decs: "所有数值+1",
			intro(storage, use) {
				return `数值:${storage}`;
			},
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, 1);
			},
			async effect(event, trigger, player) {
				let { skill, name } = event.dandaoArgs;
				let num = player.getStorage(skill)[name];
				num++;
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, num);
			},
		},
		{
			name: "z3_carduse",
			skill: {
				trigger: {
					global: ["useCardToTargeted"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					let evt = event.getParent();
					if (event.player == player) {
						return (
							(player.getStorage("wuyu_dandao").shashan && get.type(evt.card, null, false) == "basic" && !evt.dandao_add) ||
							evt.directHit.includes(player)
						);
					}
					return evt.directHit.includes(player);
				},
				async content(event, trigger, player) {
					let num = player.getStorage("wuyu_dandao").shashan,
						evt = trigger.getParent();
					if (event.player == player && num > 0) {
						evt.effectCount += num;
						evt.getParent().set("dandao_add", true);
						game.log(player, "令", trigger.card, "额外结算", num, "次");
					}
					trigger.getParent().directHit.remove(player);
				},
			},
			fenjue: [
				["chadao", "chadao"],
				["chadao", "chadaox"],
				["chadaox", "chadaox"],
			],
			mark: true,
			cl: [3, 3],
			decs: "使用牌不受影响",
			intro(storage, use) {
				return "使用牌不受影响";
			},
			judge(cards, storage) {
				return !storage;
			},
			async effect(event, trigger, player) {
				let checkMod = game.checkMod;
				game.broadcastAll(checkMod => {
					game.checkMod = function () {
						let args = Array.from(arguments);
						let name = args[args.length - 2],
							player = args[args.length - 1];
						let mod = checkMod.apply(this, args);
						if (mod != "unchanged" && ["targetEnabled", "playerEnabled"].includes(name) && args[1].getStorage("wuyu_dandao").z3_carduse) {
							mod = "unchanged";
						}
						if (mod != "unchanged" && "cardname" == name && player.getStorage("wuyu_dandao").z3_carduse) {
							let tempname = player.getStorage("wuyu_dandao").z3_wangmei?.[args[0].cardid];
							if (tempname) {
								mod = tempname;
							} else {
								mod = args[2];
							}
						}
						if ("cardUsable" == name && player.getStorage("wuyu_dandao").z3_carduse) {
							mod = Infinity;
						}
						if (
							mod != "unchanged" &&
							["cardEnabled", "cardEnabled2", "cardRespondable", "cardSavable"].includes(name) &&
							player.getStorage("wuyu_dandao").z3_carduse
						) {
							mod = "unchanged";
						}
						if (
							["wuxieJudgeEnabled", "wuxieJudgeRespondable", "wuxieEnabled", "wuxieRespondable"].includes(name) &&
							player.getStorage("wuyu_dandao").z3_carduse
						) {
							mod = "unchanged";
						}
						return mod;
					};
				}, checkMod);
			},
		},
		{
			name: "z3_hook",
			fenjue: [["zhisi", "zhisi"]],
			mark: true,
			cl: [3, 3],
			decs: "发动技能后令其他角色本轮不能发动同时机技能/装备",
			intro(storage, use) {
				return "发动技能后令其他角色本轮不能发动同时机技能/装备";
			},
			judge(cards, storage) {
				return !storage;
			},
			async effect(event, trigger, player) {
				game.broadcastAll(dandaoPlayer => {
					lib.skill.wuyu_dandao_hook = {
						player: dandaoPlayer,
						hookTrigger: {
							block(event, player, triggername, skill) {
								if (!player.hasSkill(skill, "invisible", true, false)) {
									return false;
								}
								if (triggername[-1] <= "9" && triggername[-1] >= "0") {
									triggername = triggername.slice(0, -1);
								}
								return get
									.info("wuyu_dandao_hook")
									.player.getRoundHistory("useSkill", evt => evt.event?.triggername.includes(triggername)).length;
							},
						},
					};
					game.players.forEach(player => {
						if (player != dandaoPlayer) {
							if (!player._hookTrigger) {
								player._hookTrigger = [];
							}
							player._hookTrigger.push("wuyu_dandao_hook");
						}
					});
				}, player);
			},
		},
		{
			name: "z3_jianhao",
			skill: {
				trigger: {
					source: ["useCardBefore"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let cancel = trigger.cancel,
						cardname = trigger.card.name,
						card = trigger.card;
					trigger.cancel = function () {
						let player = this.dandao_skill.dandao_player;
						if (get.info("wuyu_dandao").dandaoFunc.dandaoSkill(player)) {
							cancel.apply(this, arguments);
						}
					};
					Object.defineProperty(trigger, "card", {
						get() {
							if (card.name != cardname) {
								card.name = cardname;
							}
							return card;
						},
						set() {},
					});
					get.info("wuyu_dandao").dandaoFunc.fixedEvent(player, trigger, ["targets", "excluded", "all_excluded", "finished"]);
				},
			},
			fenjue: [["jianhao", "jianhao"]],
			cl: [3, 3],
			decs: "使用牌不能被其他角色的装备/技能无效/更改",
			intro(storage, use) {
				return "使用牌不能被其他角色的装备/技能无效/更改";
			},
			mark: true,
			judge(cards, storage) {
				return !storage;
			},
		},
		{
			name: "z3_lebing",
			fenjue: [
				["bingliang", "bingliang"],
				["lebu", "lebu"],
				["bingliang", "lebu"],
			],
			mark: true,
			skill: {
				trigger: {
					player: ["phaseAnyBefore", "phaseBefore"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					get.info("wuyu_dandao").dandaoFunc.fixedEvent(player, trigger, ["skipped", "finished"], [false, true, true]);
				},
			},
			cl: [3, 3],
			decs: "回合/阶段不会被跳过/终止",
			intro(storage, use) {
				return `回合/阶段不会被跳过/终止`;
			},
			judge(cards, storage) {
				return !storage;
			},
			async effect(event, trigger, player) {
				Object.defineProperty(player, "skipList", {
					get() {
						return [];
					},
					set() {},
				});
				if (_status.currentPhase == player) {
					for (let name of lib.phaseName) {
						let evt = event.getParent(name);
						if (evt.name) {
							get.info("wuyu_dandao").dandaoFunc.fixedEvent(player, evt, ["skipped", "finished"], [false, true, true]);
							break;
						}
					}
				}
			},
		},
		{
			name: "z3_leigong",
			skill: {
				trigger: {
					global: ["judgeFixing"],
				},
				charlotte: true,
				prompt(event, player) {
					return `取消判定并获得${get.translation(event.result.card)}`;
				},
				filter(event, player) {
					if (!event.result) {
						return false;
					}
					let info = player.getStorage("wuyu_dandao").z3_leigong;
					return ["name", "number", "suit", "type2"].some(name => info[name].includes(get[name](event.result.card, false)));
				},
				async content(event, trigger, player) {
					let evt = trigger.getParent();
					if (evt.name == "phaseJudge") {
						evt.excluded = true;
					} else {
						evt.finish();
						evt._triggered = null;
						if (evt.name.startsWith("pre_")) {
							let evtx = evt.getParent();
							evtx.finish();
							evtx._triggered = null;
						}
						let nexts = trigger.next.slice();
						for (let next of nexts) {
							if (next.name == "judgeCallback") {
								trigger.next.remove(next);
							}
						}
					}
					await player.gain(trigger.result.card, "gain2");
				},
			},
			fenjue: [["leigong"]],
			judge(cards, storage) {
				if (cards.length < 2) {
					return false;
				}
				return true;
			},
			cl: [1, 4],
			decs: "任意角色有关记录的判定结果确定时,可终止判定并获得判定牌",
			intro(storage, use) {
				let cardname = get.translation(storage.name).replace(/、/g, ","),
					number = get.translation(storage.number).replace(/、/g, ","),
					suit = get.translation(storage.suit).replace(/、/g, ","),
					type = get.translation(storage.type2).replace(/、/g, ",");
				if ([cardname, number, suit, type].every(item => item.length == 0)) {
					return;
				}
				return `任意角色有关记录的判定结果确定时,可终止判定并获得判定牌,已记录:
                                ${type.length ? `类型:${type}` : ""}
                                ${suit.length ? `花色:${suit}` : ""}
                                ${number.length ? `点数:${number}` : ""}
                                ${cardname.length ? `牌名:${cardname}` : ""}`;
			},
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, {
					type2: [],
					suit: [],
					number: [],
					name: [],
				});
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs,
					card = cards.find(card => card.name != "leigong") || cards[0];
				let storage = player.getStorage(skill)[name],
					num = player.getStorage(skill).x_cuilian;
				["name", "number", "suit", "type2"].forEach((name, i) => {
					if (num >= i + 1) {
						storage[name].add(get[name](card, false));
					}
				});
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, storage);
			},
		},
		{
			name: "z3_luojing",
			skill: {
				trigger: {
					player: ["useCard", "respond"],
				},
				charlotte: true,
				forced: true,
				usable(skill, player) {
					return player.getStorage("wuyu_dandao").z3_luojing.count;
				},
				filter(event, player) {
					let info = player.getStorage("wuyu_dandao").z3_luojing;
					if (!["name", "number", "suit", "type2"].some(name => info[name].includes(get[name](event.card, false)))) {
						return false;
					}
					return game.hasPlayer(curr => {
						if (curr == player) {
							return false;
						}
						return !["name", "number", "suit", "type2"].some(name =>
							player.getStorage("wuyu_dandao_z3_luojing_ban_" + name).includes(get[name](event.card, false))
						);
					});
				},
				async content(event, trigger, player) {
					let list = {},
						targets = game.filterPlayer(curr => curr != player),
						info = player.getStorage("wuyu_dandao").z3_luojing;
					let skillx = `${event.name}_ban`;
					["name", "number", "suit", "type2"].forEach(name => {
						let cardinfo = get[name](trigger.card, false);
						if (info[name].includes(cardinfo)) {
							list[name] = cardinfo;
						}
					});
					targets.forEach(target => {
						if (!target.hasSkill(skillx)) {
							target.addTempSkill(skillx);
						}
						let storage = target.getStorage(skillx);
						for (let name in list) {
							if (!storage[name]) {
								storage[name] = [];
							}
							if (!storage[name].includes(list[name])) {
								storage[name].push(list[name]);
								target.setStorage(skillx, storage);
								target.markSkill(skillx);
							}
						}
					});
				},
				subSkill: {
					ban: {
						forced: true,
						charlotte: true,
						marktext: "丹封",
						intro: {
							name: "丹封",
							mark(dialog, storage, player) {
								let info = player.getStorage("wuyu_dandao_z3_luojing_ban");
								let name = get.translation(info.name).replace(/、/g, ","),
									number = get.translation(info.number).replace(/、/g, ","),
									suit = get.translation(info.suit).replace(/、/g, ","),
									type = get.translation(info.type2).replace(/、/g, ",");
								dialog.addText(`不能使用信息包含:
                                ${type.length ? `类型:${type}` : ""}
                                ${suit.length ? `花色:${suit}` : ""}
                                ${number.length ? `点数:${number}` : ""}
                                ${name.length ? `牌名:${name}` : ""}的牌`);
							},
						},
						mod: {
							cardEnabled(card, player) {
								return !["name", "number", "suit", "type2"].some(name =>
									player.getStorage("wuyu_dandao_z3_luojing_ban")[name]?.includes(get[name](card, player))
								);
							},
							cardEnabled2(card, player) {
								return !["name", "number", "suit", "type2"].some(name =>
									player.getStorage("wuyu_dandao_z3_luojing_ban")[name]?.includes(get[name](card, player))
								);
							},
							cardRespondable(card, player) {
								return !["name", "number", "suit", "type2"].some(name =>
									player.getStorage("wuyu_dandao_z3_luojing_ban")[name]?.includes(get[name](card, player))
								);
							},
							cardSavable(card, player) {
								return !["name", "number", "suit", "type2"].some(name =>
									player.getStorage("wuyu_dandao_z3_luojing_ban")[name]?.includes(get[name](card, player))
								);
							},
						},
						onremove(player, skill) {
							player.setStorage("wuyu_dandao_z3_luojing_ban", {});
						},
					},
				},
			},
			fenjue: [["luojing"]],
			judge(cards, storage) {
				if (cards.length < 2) {
					return false;
				}
				return true;
			},
			cl: [1, 4],
			decs: "每回合限x次,使用或打出有关记录的牌时,令其他角色本回合不可使用或打出对应牌",
			intro(storage, use) {
				let cardname = get.translation(storage.name).replace(/、/g, ","),
					number = get.translation(storage.number).replace(/、/g, ","),
					suit = get.translation(storage.suit).replace(/、/g, ","),
					type = get.translation(storage.type2).replace(/、/g, ",");
				if ([cardname, number, suit, type].every(item => item.length == 0)) {
					return;
				}
				return `每回合限${storage.count}次(${use}/${storage.count}),使用有关记录的牌时,令其他角色本回合不可使用或打出对应牌,已记录:
                                ${type.length ? `类型:${type}` : ""}
                                ${suit.length ? `花色:${suit}` : ""}
                                ${number.length ? `点数:${number}` : ""}
                                ${cardname.length ? `牌名:${cardname}` : ""}`;
			},
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, {
					count: 0,
					type2: [],
					suit: [],
					number: [],
					name: [],
				});
			},
			async effect(event, trigger, player) {
				let { skill, name, cards } = event.dandaoArgs,
					card = cards.find(card => card.name != "luojing") || cards[0];
				let storage = player.getStorage(skill)[name],
					num = player.getStorage(skill).x_cuilian,
					add = player.getStorage(skill).z3_addnum;
				["name", "number", "suit", "type2"].forEach((name, i) => {
					if (num >= i + 1) {
						storage[name].add(get[name](card, false));
					}
				});
				storage.count += add;
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, storage);
			},
		},
		{
			name: "z3_qingsuan",
			skill: {
				trigger: {
					player: ["phaseEnd"],
				},
				filter(event, player) {
					return player.getSkills(null, false, false).filter(sk => {
						let info = get.info(sk);
						return sk != "wuyu_dandao" && info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
					}).length;
				},
				charlotte: true,
				async cost(event, trigger, player) {
					let skills = player
						.getSkills(null, false, false)
						.filter(sk => {
							let info = get.info(sk);
							return sk != "wuyu_dandao" && info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
						})
						.map(sk => [sk, `${get.translation(sk)}:${get.skillInfoTranslation(sk)}`]);
					let result = await player
						.chooseButtonTarget({
							createDialog: ["失去任意个技能令一名角色失去等量体力上限", [skills, "textbutton"]],
							selectButton: [0, Infinity],
						})
						.forResult();
					event.result = {
						bool: result.bool,
						confirm: result.confirm,
						targets: result.targets,
						cost_data: result.links,
					};
				},
				async content(event, trigger, player) {
					let skills = event.cost_data;
					await player.removeSkills(skills);
					await event.targets[0].loseMaxHp(skills.length);
				},
			},
			fenjue: [["qingsuan", "qingsuan"]],
			cl: [3, 3],
			decs: "回合结束时,你可失去任意个技能令一名角色失去等量体力上限",
			intro(storage, use) {
				return "回合结束时,你可失去任意个技能令一名角色失去等量体力上限";
			},
			mark: true,
			judge(cards, storage) {
				return !storage;
			},
		},
		{
			name: "z3_qingsuansha",
			skill: {
				trigger: {
					source: ["damageBefore"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let cancel = trigger.cancel;
					trigger.cancel = function () {
						let player = this.dandao_skill.dandao_player;
						if (get.info("wuyu_dandao").dandaoFunc.dandaoSkill(player)) {
							cancel.apply(this, arguments);
						}
					};
					get.info("wuyu_dandao").dandaoFunc.fixedEvent(player, trigger, ["player", "num", "finished"]);
				},
			},
			fenjue: [["qingsuan", "sha"]],
			cl: [3, 3],
			decs: "造成的伤害无法被其他角色的技能/装备防止/减免/转移",
			intro(storage, use) {
				return "造成的伤害无法被其他角色的技能/装备防止/减免/转移";
			},
			mark: true,
			judge(cards, storage) {
				return !storage;
			},
		},
		{
			name: "z3_qingsuantao",
			skill: {
				trigger: {
					player: ["recoverBefore"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let cancel = trigger.cancel;
					trigger.cancel = function () {
						let player = this.dandao_skill.dandao_player;
						if (get.info("wuyu_dandao").dandaoFunc.dandaoSkill(player)) {
							cancel.apply(this, arguments);
						}
					};
					get.info("wuyu_dandao").dandaoFunc.fixedEvent(player, trigger, ["player", "num", "finished"]);
				},
			},
			fenjue: [["qingsuan", "tao"]],
			cl: [3, 3],
			decs: "回复无法被其他角色的技能/装备防止/减免/转移",
			intro(storage, use) {
				return "回复无法被其他角色的技能/装备防止/减免/转移";
			},
			mark: true,
			judge(cards, storage) {
				return !storage;
			},
		},
		{
			name: "z3_turnover",
			skill: {
				forced: true,
				charlotte: true,
				mod: {
					targetEnabled(card, player, target) {
						if (player != target && (target.isTurnedOver() || target.hasSkill("wuyu_dandao_mianyi"))) {
							return false;
						}
					},
				},
			},
			fenjue: [["tangying", "tangying"]],
			mark: true,
			decs: "翻面时不能成为其他角色牌/技能/装备的目标",
			intro(storage, name, use) {
				return "翻面时不能成为其他角色牌/技能/装备的目标";
			},
			cl: [3, 3],
			judge(cards, storage) {
				return !storage;
			},
			async effect(event, trigger, player) {
				game.broadcastAll(dandaoPlayer => {
					lib.hooks.checkTarget.push((target, event) => {
						let skillEvent;
						if (event.skill) {
							skillEvent = event;
						} else if (event.getParent("trigger").skill) {
							skillEvent = event.getParent("trigger");
						} else if (event.getParent("useSkill").skill) {
							skillEvent = event.getParent("useSkill");
						}
						if (
							!skillEvent ||
							skillEvent.player == target ||
							skillEvent.type == "global" ||
							!target.getStorage("wuyu_dandao").z3_turnover
						) {
							return;
						}
						if (target.isTurnedOver() || target.hasSkill("wuyu_dandao_mianyi")) {
							target.classList.remove("selected");
							target.classList.remove("selectable");
						}
						lib.skill.wuyu_dandao_mianyi = {
							hookTrigger: {
								block(event, player, triggername, skill) {
									if (!player.hasSkill(skill, "invisible", true, false) || event.player == player || event._roundStart) {
										return false;
									}
									return (
										event.player.getStorage("wuyu_dandao").z3_turnover &&
										(event.player.isTurnedOver() || event.player.hasSkill("wuyu_dandao_mianyi"))
									);
								},
							},
						};
						game.players.forEach(player => {
							if (player != dandaoPlayer) {
								if (!player._hookTrigger) {
									player._hookTrigger = [];
								}
								player._hookTrigger.push("wuyu_dandao_block");
							}
						});
						game.players = new Proxy(game.players, {
							get(players, value, receiver) {
								let event = get.event(),
									skillEvent;
								if (event.skill) {
									skillEvent = event;
								} else if (event.getParent("trigger").skill) {
									skillEvent = event.getParent("trigger");
								} else if (event.getParent("useSkill").skill) {
									skillEvent = event.getParent("useSkill");
								}
								let bool1 =
										skillEvent &&
										skillEvent.type != "global" &&
										skillEvent.player != dandaoPlayer &&
										dandaoPlayer.getStorage("wuyu_dandao").z3_turnover &&
										(dandaoPlayer.isTurnedOver() || dandaoPlayer.hasSkill("wuyu_dandao_mianyi")),
									bool2 = skillEvent && skillEvent.player == dandaoPlayer,
									bool3 = event.name == "arrangeTrigger" && event.current.player == dandaoPlayer,
									bool4 = !skillEvent || skillEvent.type == "global";
								if (bool1 && dandaoPlayer.isIn() && !dandaoPlayer.getStorage("wuyu_dandao").out) {
									dandaoPlayer.classList.add("out");
									get.info("wuyu_dandao").dandaoFunc.dandaoStorage(dandaoPlayer, "out", true);
								} else if ((bool2 || bool3) && dandaoPlayer.isOut() && dandaoPlayer.getStorage("wuyu_dandao").out) {
									dandaoPlayer.classList.remove("out");
									get.info("wuyu_dandao").dandaoFunc.dandaoStorage(dandaoPlayer, "out", false);
								} else if (bool4 && dandaoPlayer.isOut() && dandaoPlayer.getStorage("wuyu_dandao").out) {
									dandaoPlayer.classList.remove("out");
									get.info("wuyu_dandao").dandaoFunc.dandaoStorage(dandaoPlayer, "out", false);
								}
								return Reflect.get(players, value, receiver);
							},
						});
					});
				}, player);
			},
		},
		{
			name: "z3_wangmei",
			skill: {
				forced: true,
				charlotte: true,
				mod: {
					cardname(card, player, name) {
						let event = get.event();
						if (!["chooseToUse", "chooseToRespond"].includes(event.name)) {
							return;
						}
						if (player.getStorage("wuyu_dandao").wangmeiCheck || "_recasting" == event.skill) {
							if (player.getStorage("wuyu_dandao").z3_wangmei[card.cardid]) {
								return player.getStorage("wuyu_dandao").z3_wangmei[card.cardid];
							}
							return;
						}
						get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "wangmeiCheck", true);
						let vcard = get.autoViewAs(card, [card]),
							filter = event.filterCard,
							list = [],
							cardList = lib.inpile.concat(player.getStorage("wuyu_dandao").wangmeinames);
						if (typeof filter == "function") {
							if (!filter(vcard, player, event)) {
								for (let cardx of cardList) {
									if (!["basic", "trick"].includes(get.type2(cardx, player))) {
										continue;
									}
									vcard.name = cardx;
									if (!filter(vcard, player, event) || (vcard.filterAddedTarget && !player.hasUseTarget(vcard))) {
										continue;
									}
									list.add(cardx);
								}
								if (list.length) {
									let info = player.getStorage("wuyu_dandao").z3_wangmei;
									info[card.cardid] = list.randomGet();
									get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "z3_wangmei", info);
								}
							}
						} else {
							for (let cardx of cardList) {
								if (!["basic", "trick"].includes(get.type2(cardx, player))) {
									continue;
								}
								vcard.name = cardx;
								if (!player.hasUseTarget(vcard)) {
									continue;
								}
								list.add(cardx);
							}
							if (list.length) {
								let info = player.getStorage("wuyu_dandao").z3_wangmei;
								info[card.cardid] = list.randomGet();
								get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "z3_wangmei", info);
							}
						}
						get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "wangmeiCheck", false);
						if (player.getStorage("wuyu_dandao").z3_wangmei[card.cardid]) {
							return player.getStorage("wuyu_dandao").z3_wangmei[card.cardid];
						}
					},
				},
				trigger: {
					player: ["chooseToUseBegin", "chooseToRespondBegin"],
				},
				async content(event, trigger, player) {
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "z3_wangmei", {});
				},
				hiddenCard(player, name) {
					if (!["basic", "trick"].includes(get.type2(name, player))) {
						return false;
					}
					let list = lib.inpile.concat(player.getStorage("wuyu_dandao").wangmeinames);
					return list.includes(name) && player.countCards("h");
				},
			},
			fenjue: [["wangmei", "wangmei"]],
			init(player, name) {
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "wangmeinames", []);
			},
			decs: "手牌中不可使用或打出的牌视为随机的可使用或打出的牌(包括丹道创造过的牌)",
			intro(storage, use) {
				if (!storage) {
					return;
				}
				return "手牌中不可使用或打出的牌视为随机的可使用或打出的牌(包括丹道创造过的牌)";
			},
			cl: [3, 3],
			judge(cards, storage) {
				return !storage;
			},
			async effect(event, trigger, player) {
				let { name, skill } = event.dandaoArgs;
				let getName = get.name;
				game.broadcastAll(
					(getName, skill, name) => {
						get.name = (card, player) => {
							let owner = get.owner(card);
							if (get.itemtype(owner) == "player" && get.position(card) == "s" && owner.getStorage(skill)[name]) {
								return game.checkMod(card, owner, card.name, "cardname", owner);
							}
							return getName(card, player);
						};
					},
					getName,
					skill,
					name
				);
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, {});
			},
		},
		{
			name: "z3_wuxieshan",
			skill: {
				trigger: {
					player: ["dandaoTriggering"],
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					let skills = player.getSkills(null, false, false).filter(skill => !get.info(skill).charlotte);
					player.refreshSkill(skills);
				},
			},
			cl: [3, 3],
			fenjue: [["wuxie", "shan"]],
			judge(cards, storage) {
				return !storage;
			},
			mark: true,
			decs: "发动丹道时,重置可重置的技能",
			intro(storage, use) {
				return "发动丹道时,重置可重置的技能";
			},
		},
		{
			name: "z3_youfu",
			fenjue: [["youfu", "youfu"]],
			cl: [3, 3],
			decs: "选择1个本局丹法记录过的技能记录并获得,此后每局游戏任意角色首个回合开始前,可选择至多3x个以此法获得过的技能(x为体力上限-1)",
			intro(storage, use) {
				return "选择1个本局丹法记录过的技能记录并获得,此后每局游戏任意角色首个回合开始前,可选择至多3x个以此法获得过的技能(x为体力上限-1)";
			},
			mark: true,
			judge(cards, storage) {
				let player = get.player();
				let list = player.getStorage("wuyu_dandao_skillNote"),
					skills = lib.config.extension_无语包_wuyu_sunhanhua_skill ?? [];
				return list.filter(skill => !player.hasSkill(skill, "invisible", true, true) && !skills.includes(skill) && skill in lib.skill).length;
			},
			async effect(event, trigger, player) {
				let list = player.getStorage("wuyu_dandao_skillNote"),
					skills = lib.config.extension_无语包_wuyu_sunhanhua_skill ?? [];
				let skillList = list.filter(skill => skill != "wuyu_dandao" && !skills.includes(skill) && skill in lib.skill);
				let result = await player.chooseButton(["选择1个技能记录并获得", [skillList, "skill"]]).forResult();
				if (result.links?.length) {
					await player.addSkills(result.links);
					skills.push(result.links[0]);
					game.saveExtensionConfig("无语包", "wuyu_sunhanhua_skill", skills);
				}
			},
		},
		{
			name: "z3_younan",
			skill: {
				trigger: {
					player: ["changeHpAfter"],
				},
				filter(event, player) {
					let list = lib.inpile.concat(player.getStorage("wuyu_dandao").wangmeinames),
						used = player.getHistory("useCard", evt => evt.card.dandao_skill).map(evt => evt.card),
						use = [];
					let names = used.map(card => card.name),
						natures = used
							.filter(card => card.name == "sha")
							.map(card => card.nature)
							.unique(),
						natureList = [...lib.nature.keys(), undefined].filter(nature => !natures.includes(nature));
					list.forEach(name => {
						if (name == "sha") {
							natureList.forEach(nature => {
								use.push([name, nature]);
							});
						} else if (!names.includes(name)) {
							use.push([name]);
						}
					});
					return use.filter(info => {
						let card = get.autoViewAs({
							name: info[0],
							nature: info[1],
							isCard: true,
						});
						return player.hasUseTarget(card, false, false);
					}).length;
				},
				charlotte: true,
				async cost(event, trigger, player) {
					let list = lib.inpile.concat(player.getStorage("wuyu_dandao").wangmeinames),
						used = player.getHistory("useCard", evt => evt.card.dandao_skill).map(evt => evt.card),
						use = [];
					let names = used.map(card => card.name),
						natures = used
							.filter(card => card.name == "sha")
							.map(card => card.nature)
							.unique(),
						natureList = [...lib.nature.keys(), undefined].filter(nature => !natures.includes(nature));
					list.forEach(name => {
						if (name == "sha") {
							natureList.forEach(nature => {
								use.push(["", "", name, nature]);
							});
						} else if (!names.includes(name)) {
							use.push(["", "", name]);
						}
					});
					let useList = use.filter(info => {
						let card = get.autoViewAs({
							name: info[2],
							nature: info[3],
							isCard: true,
						});
						return player.hasUseTarget(card, false, false);
					});
					let result = await player.chooseButton([`视为使用一张本回合未以此法使用过的牌`, [useList, "vcard"]]).forResult();
					event.result = {
						bool: result.bool,
						confirm: result.confirm,
						cost_data: result.links,
					};
				},
				async content(event, trigger, player) {
					let info = event.cost_data[0];
					let card = get.autoViewAs({
						name: info[2],
						nature: info[3],
						isCard: true,
						dandao_skill: true,
					});
					await player.chooseUseTarget(card, false, "nodistance");
				},
			},
			fenjue: [["younan", "younan"]],
			cl: [3, 3],
			decs: "体力值变化后,视为使用一张本回合未使用过的牌(包括丹道创造过的牌)",
			intro(storage, use) {
				return "体力值变化后,视为使用一张本回合未使用过的牌(包括丹道创造过的牌)";
			},
			mark: true,
			judge(cards, storage) {
				return !storage;
			},
		},
	],
	daoEffect(event, player, cards) {
		let cardInfo = cards
				.map(card => {
					let name = card.name,
						type = get.type(card, null, false),
						color = get.color(card, false),
						subtype = get.subtype(card, false);
					return [name, type, color, subtype];
				})
				.flat(),
			effects = get.info(event).danEffect;
		let effs = [],
			list = [],
			count = 0,
			info = player.getStorage("wuyu_dandao");
		let num = info.x_cuilian;
		for (let effect of effects) {
			if (effect.cl?.[0] > num) {
				continue;
			}
			if (!effect.fenjue.some(list => list.every(name => get.numOf(list, name) <= get.numOf(cardInfo, name)))) {
				continue;
			}
			let storage = info[effect.name];
			if (effect.judge) {
				if (effect.judge(cards, storage)) {
					effect.cl?.[0] ? list.push(effect) : effs.push(effect);
				}
			} else {
				effect.cl?.[0] ? list.push(effect) : effs.push(effect);
			}
		}
		while (count < num && list.length) {
			let effect = list.randomGet();
			effs.push(effect);
			list.remove(effect);
			count += effect.cl[1];
		}
		return effs;
	},
	dandaoSkill(player, skill, sub, card) {
		if (!_status.characterlist) {
			game.initCharacterList();
		}
		let name = card.name,
			type = get.type(card, null, false),
			num = player.getStorage(skill)[sub] * 2;
		if (!_status.dandao_skill) {
			game.broadcastAll(() => (_status.dandao_skill = {}));
		}
		if (_status.dandao_skill[name]) {
			return _status.dandao_skill[name].randomGets(num);
		} else {
			let list = [];
			for (let char of _status.characterlist) {
				let originSkills = get.character(char, 3);
				if (type != "equip") {
					let skills = originSkills.map(skill => [skill, ...Array.from(get.info(skill).derivation || [])]).flat();
					for (let skill of skills) {
						if (get.skillInfoTranslation(skill).includes(`【${get.translation(name)}】`)) {
							list.add(skill);
						}
					}
				} else {
					let names = get
						.characterSurname(char)
						.map(info => info.join(""))
						.concat([get.rawName(char)]);
					get.bingzhu(card).forEach(bingzhu => {
						if (names.includes(bingzhu)) {
							list.addArray(originSkills);
						}
					});
				}
			}
			game.broadcastAll((name, list) => (_status.dandao_skill[name] = list), name, list);
		}
		return _status.dandao_skill[name].filter(skill => !player.hasSkill(skill, "invisible", true, false)).randomGets(num);
	},
	dandaoFunc: funcMap,
	async content(event, trigger, player) {
		let extra = [],
			num = Math.max(player.getStorage("wuyu_dandao").x_cuilian, 1),
			count = lib.config.extension_无语包_wuyu_sunhanhua ?? 0;
		await event.trigger("dandaoTriggering");
		if (count / 50 >= 1) {
			let num = Math.floor(count / 50);
			let cards = lib.inpile
				.slice()
				.randomGets(num)
				.map(name => game.createCard(name, lib.suit.randomGet(), get.rand(1, 13)));
			extra.addArray(cards);
		}
		if (count / 100 >= 1) {
			let list = player.getStorage("wuyu_dandao").cardList,
				num = Math.floor(count / 100),
				names = [];
			for (let i = 0; i < num; i++) {
				names.push(list[get.rand(list.length - 1)]);
			}
			let cards = names.map(card => {
				if (!lib.card[card[0]]) {
					let cardInfo = {
						fullimage: true,
						image: "character:wuyu_sunhanhua",
						type: "trick",
					};
					lib.card[card[0]] = cardInfo;
					lib.translate[card[0]] = card[1];
					lib.translate[card[0] + "_info"] = "临时丹材";
				}
				return game.createCard(card[0], lib.suit.randomGet(), get.rand(1, 13));
			});
			extra.addArray(cards);
		}
		if (extra.length) {
			player.directgains(extra, null, "wuyu_dandao_special");
		}
		if (!player.hasSkill("wuyu_dandao_mianyi") && player.getStorage("wuyu_dandao").z3_turnover && Math.random() < 0.05 * num) {
			player.addTempSkill("wuyu_dandao_mianyi", "roundStart");
			player.chat("时也,运也");
		}
		let list = player.getCards("hes");
		let { links: cards } = await player
			.chooseButton(["选择两张牌炼丹<br>当前效果:无效果", list], 2)
			.set("dandao_skill", "wuyu_dandao")
			.set("custom", {
				replace: {
					button(button) {
						let event = get.event(),
							player = get.player();
						if (!event.isMine()) {
							return;
						}
						if (button.classList.contains("selectable") == false) {
							return;
						}
						if (button.classList.contains("selected")) {
							button.classList.remove("selected");
							ui.selected.buttons.remove(button);
						} else {
							button.classList.add("selected");
							ui.selected.buttons.push(button);
						}
						let prompt = event.dialog.querySelector(".caption");
						let effects = get.info(event.dandao_skill).daoEffect(
							event.dandao_skill,
							player,
							ui.selected.buttons.map(button => button.link)
						);
						let str = "选择两张牌炼丹<br>当前效果:";
						if (effects.length) {
							for (let effect of effects) {
								str += effect.decs + "<br>";
							}
						} else {
							str += "无效果";
						}
						if (player.isOnline2()) {
							player.send((prompt, str) => (prompt.innerHTML = str), prompt, str);
						} else if (event.isMine()) {
							prompt.innerHTML = str;
						}
						game.check();
					},
				},
			})
			.set("ai", button => {
				return 1;
			})
			.forResult();
		let effects = get.info("wuyu_dandao").daoEffect("wuyu_dandao", player, cards || []);
		if (effects.length) {
			for (let effect of effects) {
				let name = effect.name,
					skillx = `wuyu_dandao_${name}`;
				if (effect.skill && !player.hasSkill(skillx)) {
					player.addSkill(skillx);
					player.dandaoSkills.add(skillx);
				}
				if (!effect.init && effect.mark) {
					let add = player.getStorage("wuyu_dandao").z3_addnum,
						num = player.getStorage("wuyu_dandao")[name];
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, name, num + add);
				}
				if (effect.effect) {
					let next = game.createEvent("wuyu_dandao_effect", false);
					next.player = player;
					next.dandaoArgs = {
						skill: "wuyu_dandao",
						name: name,
						cards: cards,
					};
					next.setContent(effect.effect);
					await next;
				}
				if (effect.cl) {
					let num = player.getStorage("wuyu_dandao").x_cuilian;
					num = Math.max(0, num - effect.cl[1]);
					get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "x_cuilian", num);
				}
			}
			player.markSkill("wuyu_dandao_mark");
		}
		if (extra.length) {
			extra.forEach(card => {
				card.fix();
				card.remove();
				card.destroyed = true;
			});
		}
		if (cards) {
			await player.loseToDiscardpile(cards);
		}
	},
	subSkill: {
		temp: {},
		special: {},
		copy: {},
		mark: {
			charlotte: true,
			marktext: "道",
			mark: true,
			init(player, skill) {
				let cardList = [
						["dashi", "大师"],
						["fugui", "富贵"],
						["guilai", "武圣归来"],
						["haoyun", "好运"],
						["hongyun", "红运当头"],
						["jiaoyou", "火上浇油"],
						["jinnao", "金铙"],
						["tianlei", "天雷"],
						["liehuo", "烈火"],
						["khquanjiu", "劝酒"],
						["khquanjiux", "劝酒"],
						["shenbing", "神兵"],
						["tangying", "躺赢"],
						["wutian", "无天无界"],
						["yinglang", "鹰狼"],
						["chadao", "两肋插刀"],
						["chadaox", "两肋插刀"],
						["zhisi", "至死方休"],
						["leigong", "雷公助我"],
						["luojing", "落井下石"],
						["qingsuan", "清算"],
						["wangmei", "望梅止渴"],
						["younan", "有难同当"],
						["qinggang", "青缸"],
						["lebu", "乐不思蜀"],
						["nanman", "南蛮入侵"],
						["wuzhong", "无中生有"],
						["muniu", "木牛流马"],
						["youfu", "有福同享"],
						["jianhao", "见好就收"],
						["wuyu_sunhanhua", "语孙寒华"],
					],
					info = get.info("wuyu_dandao");
				get.info("wuyu_dandao").dandaoFunc.dandaoStorage(player, "cardList", cardList);
				let list = info.danEffect,
					skillList = ["wuyu_dandao", "wuyu_dandao_mark", "wuyu_dandao_skillNote", "wuyu_dandao_xianfa"];
				game.broadcastAll(
					(skillList, list, player) => {
						player.dandaoSkills = new Proxy(skillList, {
							set(target, prop, value, receiver) {
								let event = get.event();
								if (event.name == "wuyu_dandao" && event.player.getStorage("wuyu_dandao").z3_addnum) {
									return Reflect.set(target, prop, value, receiver);
								}
								return false;
							},
							deleteProperty(target, prop) {
								return false;
							},
						});
						for (let effect of list) {
							let sk = `wuyu_dandao_${effect.name}`;
							if (effect.skill && !lib.skill[sk]) {
								Object.defineProperty(lib.skill, sk, {
									value: new Proxy(effect.skill, {
										set(target, prop, value, receiver) {
											if (prop in target) {
												return false;
											}
											return Reflect.set(target, prop, value, receiver);
										},
										deleteProperty(target, prop) {
											return false;
										},
									}),
									configurable: false,
									enumerable: true,
								});
								game.finishSkill(sk);
							}
							if (effect.mark) {
								player.storage.wuyu_dandao[effect.name] = 0;
							} else if (typeof effect.init == "function") {
								effect.init(player, effect.name);
							}
						}
					},
					skillList,
					list,
					player
				);
			},
			intro: {
				name: "道",
				mark(dialog, storage, player) {
					let count = lib.config.extension_无语包_wuyu_sunhanhua ?? 0;
					dialog.addText(`每使用语孙寒华进行50/100局游戏,触发丹道时获得至多两张临时牌/临时特殊牌(${count})`);
					let info = player.getStorage("wuyu_dandao"),
						effects = get.info("wuyu_dandao").danEffect;
					for (let effect of effects) {
						let name = effect.name;
						let use = player.getStat("triggerSkill")[`wuyu_dandao_${name}`] || 0;
						if (!effect.intro || info[name] == 0) {
							continue;
						}
						let text = effect.intro(info[name], use);
						if (text) {
							dialog.addText(text);
						}
					}
				},
				markcount(storage, player) {
					return player.getStorage("wuyu_dandao").x_cuilian;
				},
			},
		},
		skillNote: {
			audio: "wuyu_dandao",
			trigger: {
				global: ["logSkillBegin", "useSkill", "phaseBefore"],
			},
			filter(event, player) {
				if (event.name == "phase") {
					let skills = lib.config.extension_无语包_wuyu_sunhanhua_skill ?? [],
						list = player.getStorage("wuyu_dandao_skillNoted");
					return (
						!list.includes(event.player) &&
						skills.some(skill => !player.hasSkill(skill, "invisible", true, true) && skill in lib.skill) &&
						player.maxHp > 1
					);
				} else {
					let list = player.getStorage("wuyu_dandao_skillNote");
					return (
						!["global", "equip"].includes(event.type) &&
						!list.includes(event.skill) &&
						lib.translate[`${event.skill}_info`]?.length &&
						event.skill != "wuyu_dandao"
					);
				}
			},
			charlotte: true,
			marktext: "人",
			mark: true,
			forced: true,
			intro: {
				name: "人",
				mark(dialog, storage, player) {
					let skills = lib.config.extension_无语包_wuyu_sunhanhua_skill ?? [];
					skills = skills.filter(skill => skill in lib.skill);
					let list = player.getStorage("wuyu_dandao_skillNote").filter(skill => skill in lib.skill);
					dialog.addText("本局记录技能:");
					dialog.addText(`${get.translation(list).replace(/、/g, ",")}`);
					dialog.addText("总记录技能:");
					dialog.addText(`${get.translation(skills).replace(/、/g, ",")}`);
				},
				markcount(storage, player) {
					return 0;
				},
			},
			async content(event, trigger, player) {
				if (trigger.name == "phase") {
					let list = player.getStorage("wuyu_dandao_skillNoted"),
						skills = lib.config.extension_无语包_wuyu_sunhanhua_skill.filter(
							skill => !player.hasSkill(skill, "invisible", true, true) && skill in lib.skill
						);
					list.push(trigger.player);
					player.setStorage("wuyu_dandao_skillNoted", list);
					let result = await player
						.chooseButton([`选择至多${(player.maxHp - 1) * 3}个技能获得,每选择3个减少1点体力上限`, [skills, "skill"]])
						.set("selectButton", [1, (get.player().maxHp - 1) * 3])
						.forResult();
					if (result.links?.length) {
						if (result.links.length > 2) {
							await player.loseMaxHp(Math.ceil(result.links.length / 3));
						}
						await player.addSkills(result.links);
					}
				} else {
					player.markAuto("wuyu_dandao_skillNote", trigger.skill);
				}
			},
		},
		mianyi: {
			charlotte: true,
			mark: true,
			marktext: "免疫",
			intro: {
				name: "免疫",
				content: "本轮不能成为其他角色牌和技能的目标",
			},
		},
		xianfa: {
			audio: "wuyu_dandao",
			trigger: {
				player: ["dieBegin"],
			},
			forced: true,
			charlotte: true,
			filter(event, player) {
				return player.getHp() > 0;
			},
			async content(event, trigger, player) {
				player.chat("仙法护体");
				trigger.cancel();
			},
		},
	},
};

for (let effect of wuyu_dandao.danEffect) {
	Object.freeze(effect);
}

export let initSkill = () => {
	Object.defineProperty(lib.skill, "wuyu_dandao", {
		value: new Proxy(wuyu_dandao, {
			set(target, prop, value, receiver) {
				if (prop in target) {
					return false;
				}
				return Reflect.set(target, prop, value, receiver);
			},
			deleteProperty(target, prop) {
				return false;
			},
		}),
		configurable: false,
		enumerable: true,
	});
};
