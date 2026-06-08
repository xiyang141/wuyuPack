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
			if (event.closeDialog || player != game.me || event.player != player || !_status.gameStarted) {
				return false;
			}
			let dialog = event.dialog;
			let allCard = true;
			let hasBtn = false;
			if (!dialog && event.createDialog.length > 0) {
				dialog = ui.create.dialog.apply(null, event.createDialog);
			}
			if (dialog) {
				const list = [];
				Array.from(dialog.querySelectorAll(".buttons"));
				for (const el of list) {
					if (!hasBtn) {
						hasBtn = true;
					}
					const buttons = Array.from((el as HTMLDivElement).children);
					if (buttons.every(btn => btn.classList.contains("card"))) {
						list.addArray(buttons);
					} else {
						allCard = false;
						break;
					}
				}
			}
			if (allCard && hasBtn) {
				event.oldDialog = dialog;
				return true;
			}
			return false;
		},
		async content(event, trigger, player) {
			const dialog = trigger.oldDialog;
			const list = dialog.querySelectorAll(".buttons");
			const caption = dialog.querySelector(".caption")?.textContent || "";
			const description = dialog.querySelector(".text")?.textContent || "";
			dialog.classList.add("removing");
			dialog.close();
			trigger.dialog = ui.create.dialog(caption + "\n" + description);
			const cards2 = player.getCards("hs").forEach(c => c.classList.add("hidden", "wyremoving"));
			const cards = list.map((btn, i) => {
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
				} else {
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
			trigger.newChoose = cards;
			trigger.set("complexCard", true);
			trigger.setContent("wyChooseCard");
		},
	},
};
