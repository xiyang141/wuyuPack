import { lib, game, ui, get, ai, _status } from "noname";

export const skill: {
	[key: string]: Skill;
} = {
	yinzhi: {
		enable: "phaseUse",
		selectTarget: 1,
		filterTarget: true,
		selectCard: -1,
		filterCard: false,
		lose: false,
		discard: false,
		init(player, skill) {
			player.setStorage("yinzhi", {});
		},
		usable: 1,
		async content(event, trigger, player) {
			const target = event.targets[0];
			const num = player.getStorage("yinzhi")?.[target.playerid] || 0;
			if (num < 3) {
				game.broadcastAll((player, target, num) => (player.storage.yinzhi[target.playerid] = num + 1), player, target, num);
			}
			if (player.getCards("he").some(card => lib.filter.canBeDiscarded(card, player, player))) {
				const cards = await player
					.chooseToDiscard({
						selectCard: num + 1,
						discarder: player,
						forced: true,
						position: "he",
						filterCard(card, player) {
							return lib.filter.canBeDiscarded(card, player, player);
						},
					})
					.forResult();
			}
			const noted = target.getStorage("yinzhi_eff");
			target.setStorage("yinzhi_eff", noted.add(player));
			target.addTempSkill("yinzhi_fengyin", { player: "phaseBegin" });
			target.addTempSkill("yinzhi_effect", { player: "phaseBegin" });
		},
		subSkill: {
			fengyin: {
				inherit: "fengyin",
			},
			effect: {
				trigger: {
					source: ["damageBegin"],
					player: ["respondAfter", "useCardAfter"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					if (event.name == "damage") {
						return player.getStorage("yinzhi_eff").includes(event.player);
					}
					return true;
				},
				mod: {
					cardEnabled(card, player, result) {
						if (_status.currentPhase == player) {
							const cards = player.getHistory("gain").reduce((cards, evt) => cards.addArray(evt.cards), []);
							return card.cards.every(cardx => cards.includes(cardx));
						}
					},
					cardRespondable(card, player, result) {
						if (_status.currentPhase == player) {
							const cards = player.getHistory("gain").reduce((cards, evt) => cards.addArray(evt.cards), []);
							return card.cards.every(cardx => cards.includes(cardx));
						}
					},
				},
				async content(event, trigger, player) {
					const noted = player.getStorage("yinzhi_eff");
					if (trigger.name == "damage") {
						game.broadcastAll((player, target) => (player.storage.yinzhi[target.playerid] = 0), trigger.player, player);
						player.setStorage("yinzhi_eff", noted.remove(player));
						if (!player.getStorage("yinzhi_eff").length) {
							player.removeSkill("yinzhi_eff");
							player.removeSkill("yinzhi_fengyin");
						}
					} else {
						await game.doAsyncInOrder(noted, curr => {
							return curr.draw(curr.getStorage("yinzhi")[player.playerid]);
						});
					}
				},
			},
		},
		ai: {
			result: {
				target(player, target) {
					return -get.attitude(player, target);
				},
			},
		},
	},
	keming: {
		trigger: {
			player: ["damageEnd"],
			source: ["damageSource"],
		},
		init(player, skill) {
			player.setStorage("keming", []);
			const list = [];
			for (const char in lib.character) {
				const name = get.characterSurname(char, null, null);
				if (name[0][0] != "曹" || char == "dc_shen_caopi") {
					continue;
				}
				const skills = get.character(char)[3].filter(sk => {
					const info = get.info(sk);
					if (!info.trigger) {
						return false;
					}
					const triggers: string | string[] = Object.values(info.trigger);
					return triggers.some(tr => tr == "damageEnd" || tr?.includes("damageEnd"));
				});
				list.addArray(skills);
			}
			player.setStorage("csks", list);
		},
		filter(event, player, name) {
			if (name == "damageEnd") {
				return event.source && event.source != player;
			} else {
				return event.player != player;
			}
		},
		async content(event, trigger, player) {
			if (event.triggername == "damageEnd") {
				const source = trigger.source;
				const skills = source.getSkills(null, false, false).filter(sk => {
					const info = get.info(sk);
					return info && !info.charlotte && get.skillInfoTranslation(sk).length > 0;
				});
				const usable = skills
					.filter(sk => {
						const info = get.info(sk);
						if (!info.trigger) {
							return false;
						}
						const triggers: string | string[] = Object.values(info.trigger);
						return triggers.some(tr => tr == "damageAfter" || tr?.includes("damageAfter"));
					})
					.filter(sk => !player.hasSkill(sk));
				if (usable.length) {
					game.broadcastAll((player, skills) => player.storage.keming.addArray(skills), player, usable);
					player.addTempSkill(usable);
				} else {
					const csks = player
						.getStorage("csks")
						.filter(sk => !player.hasSkill(sk))
						.randomGets(1);
					game.broadcastAll((player, skills) => player.storage.keming.addArray(skills), player, csks);
					player.addTempSkill(csks);
				}
			} else {
				const target = trigger.player;
				target.setStorage("keming_draw", player);
				target.addSkill(["keming_draw", "keming_check"]);
			}
		},
		group: ["keming_remove"],
		subSkill: {
			remove: {
				trigger: {
					player: ["damageAfter"],
				},
				lastDo: true,
				priority: -10,
				init(player, skill) {
					if (!player._hookTrigger) {
						player._hookTrigger = [skill];
					} else {
						player._hookTrigger.add(skill);
					}
				},
				forced: true,
				async content(event, trigger, player) {
					const keming = player.getStorage("keming");
					const skills = player
						.getSkills(null, false, false)
						.filter(sk => {
							const info = get.info(sk);
							return info && !info.charlotte && get.skillInfoTranslation(sk).length > 0;
						})
						.filter(sk => keming.includes(sk));
					player.removeSkill(skills);
				},
				onremove(player) {
					player._hookTrigger.remove("keming_remove");
				},
				hookTrigger: {
					after(event, player) {
						const keming = player.getStorage("keming");
						const skills = player.getSkills(null, false, false).filter(sk => {
							const info = get.info(sk);
							return info && !info.charlotte && get.skillInfoTranslation(sk).length > 0;
						});
						if (!skills.includes(event.skill) && keming.includes(event.skill)) {
							player.removeSkill(event.skill);
						}
						return false;
					},
				},
			},
			check: {
				trigger: {
					player: ["logSkill", "useSkill", "useCard", "respond"],
				},
				filter(event, player, name) {
					if (["global", "equip"].includes(event.type)) {
						return false;
					}
					let bool = true;
					const info = get.info(event.skill);
					if (name == "logSkill") {
						const tr = event.getParent("trigger").triggername;
						bool = tr.startsWith("phaseZhunbei") || tr.startsWith("phaseJieshu");
					}
					return bool && info && !info.charlotte && !info.equipSkill;
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					player.setStorage("keming_check", true);
					player.removeSkill("keming_check");
				},
			},
			draw: {
				trigger: {
					player: ["useCard", "gainAfter", "drawAfter"],
				},
				forced: true,
				charlotte: true,
				filter(event, player, name, target) {
					let skEvt = event.getParent("trigger");
					let bool = false;
					if (!skEvt.skill) {
						bool = true;
						skEvt = event.getParent("useSkill");
					}
					if (!skEvt.skill || ["global", "equip"].includes(skEvt.type)) {
						return false;
					}
					const tr = skEvt.triggername;
					return tr.startsWith("phaseZhunbei") || tr.startsWith("phaseJieshu") || bool;
				},
				async content(event, trigger, player) {
					player.removeSkill("keming_draw");
					console.log("test");
					if (player.storage.keming_check) {
						player.setStorage("keming_check", false);
						player.setStorage("keming_draw", "");
						return;
					}
					const source = player.getStorage("keming_draw");
					if (trigger.name == "useCard") {
						const name = get.name(trigger.card);
						const card = get.cardPile(name);
						await source.gain(card);
					} else {
						const cards = trigger.cards;
						const list = [];
						cards.forEach(card => {
							if (list.length > 4) {
								return;
							}
							const cardx = get.cardPile(get.name(card));
							if (cardx) {
								list.push(cardx);
							}
						});
						console.log(list);
						await source.gain(list);
					}
					player.setStorage("keming_check", false);
					player.setStorage("keming_draw", "");
				},
			},
		},
	},
};
