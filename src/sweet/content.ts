import { lib, game, ui, get, ai, _status } from "noname";

export const contents = {
	wyChooseCard: [
		async (event, trigger, player) => {
			const { dialog, cards } = event.wy_custom;
			player.directgains(cards);
			event.selectCard = event.selectButton;
			event.filterCard = event.filterButton;
			delete event.selectButton;
			delete event.filterButton;
			event.position = "s";
			for (const card of cards) {
				card.link = card.storage.link;
				if (event.filterCard && event.filterCard(card, player)) {
					card.classList.add("selectable");
				}
			}
			if (event.custom.replace?.button) {
				event.custom.replace.cardx = event.custom.replace.button;
				delete event.custom.replace.button;
			}
			if (event.custom.add?.button) {
				event.custom.add.cardx = event.custom.add.button;
				delete event.custom.add.button;
			}
			if (event.custom.replace?.cardx) {
				event.custom.replace.card = card => {
					const event = get.event();
					const cards = event.wy_custom.cards;
					if (event.custom.replace.cardx) {
						//@ts-ignore
						event.custom.replace.cardx?.(card);
					}
					if (event.custom.add?.card) {
						event.custom.add.card();
					}
					(ui.selected.cards as any) = ui.selected.buttons.slice();
					cards.forEach(card => {
						if (card.classList.contains("selected")) {
							card.updateTransform(true);
						} else {
							card.updateTransform();
						}
					});

					game.check();
				};
			}
			if (!event.custom.add) {
				event.custom.add = {};
			}
			event.custom.add.card = () => {
				const event = get.event();
				if (event.custom.add.cardx) {
					event.custom.add.cardx?.();
				}
				if (event.custom.replace?.cardx) {
					return;
				}
				(ui.selected.buttons as any) = ui.selected.cards.slice();
			};
			game.check();
			game.pause();
		},
		async (event, trigger, player) => {
			const { dialog, cards } = event.wy_custom;
			event.result.links = event.result.cards?.map(card => card.link);
			ui.selected.cards = [];
			event.result.cards = [];
			event.selectButton = event.selectCard;
			event.filterButton = event.filterCard;
			delete event.selectCard;
			delete event.filterCard;
			delete event.position;
			cards.forEach(card => {
				card.fix();
				card.remove();
				card.destroyed = true;
			});
			player.getCards("hs").forEach(c => c.classList.remove("hidden", "wyremoving"));
			ui.updatehl();
			event.dialog.close();
			event.dialog = dialog;
			delete event.wy_custom;
			if (event.callback) {
				event.callback(event.player, event.result);
			}
			event.resume();
		},
	],
};
