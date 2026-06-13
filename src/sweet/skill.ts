import { lib, game, ui, get, ai, _status } from "noname";
import type { GameEvent, Player } from "@/library";

export const skills: {
	[key: string]: Skill;
} = {
	_wymhcb: {
		trigger: {
			player: ["chooseButtonBegin"],
		},
		lastDo: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			if (event.closeDialog === false || player != game.me || event.player != player || !_status.gameStarted) {
				return false;
			}
			let dialog = event.dialog;
			let allCard = true;
			let hasBtn = false;
			let closed = false;
			const list = [];
			if (!dialog && event.createDialog?.length > 0) {
				dialog = ui.create.dialog.apply(null, event.createDialog);
				dialog.classList.add("removing");
				dialog.close();
				closed = true;
			}
			if (dialog) {
				if (dialog.classList.contains("forcebutton-auto")) {
					return false;
				}
				for (const el of Array.from(dialog.querySelectorAll(".buttons"))) {
					if (!hasBtn) {
						hasBtn = true;
					}
					const buttons = Array.from((el as HTMLDivElement).children);
					const isCardButtons = buttons.every(btn => {
						const classList = btn.classList;
						return classList.contains("card") || classList.contains("character");
					});
					if (isCardButtons) {
						list.addArray(buttons);
					} else {
						allCard = false;
						break;
					}
				}
			}
			if (allCard && hasBtn) {
				const caption = dialog.querySelector(":scope > * > * > .caption")?.textContent || "";
				const description = dialog.querySelector(":scope > * > * .text")?.textContent || "";
				event.wy_custom = {
					buttons: list,
					dialog: dialog,
					caption: caption,
					description: description,
				};
				if (!closed) {
					dialog.classList.remove("removing");
					dialog.close();
				}
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			const { buttons, caption, description } = trigger.wy_custom;
			trigger.dialog = ui.create.dialog(caption + "\n" + description);
			player.getCards("hs").forEach(c => c.classList.add("hidden", "wyremoving"));
			const cards = buttons.map(btn => {
				const link = btn.link;
				if (Array.isArray(link)) {
					const card = game.createCard(link[2], "", "", link[3]);
					if (card.node.suitnum) {
						card.node.suitnum.remove();
					} else {
						card.node.info.remove();
					}
					card.storage.link = link;
					return card;
				} else if (btn.classList.contains("character")) {
					if (!lib.card["wychoose_" + link]) {
						lib.translate["wychoose_" + link] = get.slimName(link);
						const info = {
							fullimage: true,
							image: "character:" + link,
							type: "character",
							cardPrompt(link, player) {
								let cardPrompt = "";
								const skills = get.character(link)[3];
								for (const skill of skills) {
									if (lib.skill[skill].nobracket) {
										cardPrompt += '<div class="skilln">' + get.translation(skill) + '</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill)) + "</span></div><br><br>";
									} else {
										const translation = lib.translate[name + "_ab"] || get.translation(skill).slice(0, 2);
										cardPrompt += '<div class="skill">【' + translation + '】</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill)) + "</span></div><br><br>";
									}
								}
								return cardPrompt;
							},
						};
						lib.translate["wychoose_" + link + "_info"] = get.translation(link);
						lib.card["wychoose_" + link] = info;
					}
					const card = game.createCard("wychoose_" + link, "", "");
					if (card.node.suitnum) {
						card.node.suitnum.remove();
					} else {
						card.node.info.remove();
					}
					const info = get.character(link);
					card.node.hp = ui.create.div(".hp", card);
					var hp = info.hp,
						maxHp = info.maxHp,
						hujia = info.hujia;
					var str = get.numStr(hp);
					if (hp !== maxHp) {
						str += "/";
						str += get.numStr(maxHp);
					}
					ui.create.div(card.node.hp);
					ui.create.div(".text", str, card.node.hp);
					card.node.hp.style.marginLeft = "50%";
					card.node.hp.style.marginTop = "80%";
					if (info[2] == 0) {
						card.node.hp.hide();
					}
					if (hujia > 0) {
						ui.create.div(card.node.hp, ".shield");
						ui.create.div(".text", get.numStr(hujia), card.node.hp);
					} else if (get.infoHp(info[2]) <= 3) {
						card.node.hp.dataset.condition = "mid";
					} else {
						card.node.hp.dataset.condition = "high";
					}
					card.storage.link = link;
					return card;
				} else if (!(link in lib.card) && link in lib.skill) {
					if (!lib.card["wychoose_" + link]) {
						lib.translate["wychoose_" + link] = lib.translate[link];
						let defaultName = _status.skillOwner[link] || "shibing";
						const info = {
							fullimage: true,
							image: "character:" + defaultName,
							type: "character",
							cardPrompt(link, player) {
								let cardPrompt = "";
								if (lib.skill[link].nobracket) {
									cardPrompt += '<div class="skilln">' + get.translation(link) + '</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(link)) + "</span></div><br><br>";
								} else {
									const translation = lib.translate[name + "_ab"] || get.translation(link).slice(0, 2);
									cardPrompt += '<div class="skill">【' + translation + '】</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(link)) + "</span></div><br><br>";
								}
								return cardPrompt;
							},
						};
						lib.translate["wychoose_" + link + "_info"] = get.translation(link);
						lib.card["wychoose_" + link] = info;
					}
					const card = game.createCard("wychoose_" + link, "", "");
					if (card.node.suitnum) {
						card.node.suitnum.remove();
					} else {
						card.node.info.remove();
					}
					card.storage.link = link;
					return card;
				} else if (get.itemtype(link) == "card") {
					const owner = get.owner(link);
					const cardInfo = get.cardInfo(link);
					const card = game.createCard(cardInfo[2], cardInfo[0], cardInfo[1], cardInfo[3]);
					card.storage.link = link;
					if (owner) {
						ui.create.div(".gaintag", get.translation(owner), card);
					}
					if (btn.classList.contains("blank")) {
						card.querySelector(".image").remove();
						card.style.backgroundImage = "var(--cardback-url)";
					}
					return card;
				}
			});
			trigger.wy_custom.cards = cards;
			trigger.set("complexCard", true);
			trigger.setContent("wyChooseCard");
		},
	},
};
