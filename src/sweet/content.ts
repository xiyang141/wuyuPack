import { lib, game, ui, get, ai, _status } from "noname";

export const contents = {
	wyChooseCard: [
		async (event, trigger, player) => {
			player.directgains(event.newChoose);
			event.selectCard = event.selectButton;
			event.filterCard = event.filterButton;
			delete event.selectButton;
			delete event.filterButton;
			event.position = "s";
			for (const card of event.newChoose) {
				card.link = card.storage.link;
				if (event.filterCard && event.filterCard(card, player)) {
					card.classList.add("selectable");
				}
			}
			if (event.custom === undefined) {
				event.custom = {
					add: {},
					replace: {},
				};
			}
			if (event.custom.replace.button) {
				event.custom.replace.card = event.custom.replace.button;
			}
			if (event.custom.add.button) {
				event.custom.add.cardx = event.custom.add.button;
			}
			delete event.custom.replace.button;
			delete event.custom.add.button;
			event.custom.add.card = () => {
				const event = get.event();
				if (event.custom.add.cardx || event.custom.replace.card) {
					event.custom.add?.cardx();
					ui.selected.cards = [];
					if (ui.selected.buttons.length > 0) {
						ui.selected.buttons.forEach(btn => {
							const link = btn.link;
							const card = get.event().newChoose.find(c => c.link === link);
							if (card) {
								ui.selected.cards.push(card);
							}
						});
					}
				} else {
					(ui.selected.buttons as any) = ui.selected.cards.slice();
				}
			};
			game.check();
			game.pause();
		},
		async (event, trigger, player) => {
			event.result.links = event.result.cards?.map(card => card.link);
			ui.selected.buttons = [];
			event.newChoose.forEach(card => {
				card.fix();
				card.remove();
				card.destroyed = true;
			});
			player.getCards("hs").forEach(c => c.classList.remove("hidden"));
			ui.updatehl();
			if (event.dialog !== false) {
				event.dialog.close();
				event.dialog = event.oldDialog;
			}
			if (event.callback) {
				event.callback(event.player, event.result);
			}
			event.resume();
		},
	],
};
