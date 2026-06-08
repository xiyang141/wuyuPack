import { lib, game, ui, get, ai, _status } from "noname";
import type { GameEvent, Player } from "@/library";

export const skills: {
	[key: string]: Skill;
} = {
	_wymhyp: {
		trigger: {
			global: ["chooseButtonBegin"],
		},
		lastDo: true,
		forced: true,
		charlotte: true,
		filter(event, player) {
			return event.closeDialog != false && player == game.me && event.player == player && _status.gameStarted;
		},
		async content(event, trigger, player) {
			let dialog = trigger.dialog;
			if (!dialog) {
				dialog = ui.create.dialog.apply(null, trigger.createDialog);
			}
			if (dialog) {
				const list = [];
				let allCard = true;
				let hasBtn = false;
				Array.from(dialog.querySelectorAll(".buttons")).forEach(el => {
					if (!hasBtn) {
						hasBtn = true;
					}
					const buttons = Array.from((el as HTMLDivElement).children);
					if (buttons.every(btn => btn.classList.contains("card"))) {
						list.addArray(buttons);
					} else {
						allCard = false;
					}
				});
				if (allCard && hasBtn) {
					const caption = dialog.querySelector(".caption")?.textContent || "";
					dialog.close();
					const description = dialog.querySelector(".text")?.textContent || "";
					trigger.dialog = ui.create.dialog(caption + "\n" + description);
					const cards2 = player.getCards("hs").forEach(c => c.classList.add("hidden", "wyremoving"));
					const cards = list.map((btn, i) => {
						const link = btn.link;
						if (Array.isArray(link)) {
							const card = game.createCard(link[2], "", "", link[3]);
							card.storage.link = link;
							card.style.setProperty("--wywidth", `${i * 112}px`);
							card.classList.add("wyfakecard");
							return card;
						} else {
							const owner = get.owner(link);
							const cardInfo = get.cardInfo(link);
							const card = game.createCard(cardInfo[2], cardInfo[0], cardInfo[1], cardInfo[3]);
							card.storage.link = link;
							card.style.setProperty("--wywidth", `${i * 112}px`);
							card.classList.add("wyfakecard");
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
					trigger.oldDialog = dialog;
					trigger.newChoose = cards;
					trigger.set("complexCard", true);
					trigger.setContent("wyChooseCard");
				}
			}
		},
	},
};
