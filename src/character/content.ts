import { lib, game, ui, get, ai, _status } from "noname";

export const contents = {
	loseToDiscardpileMultiple: [
		async (event, trigger, player) => {
			event.visible = true;
			if (!event.position) {
				event.position = ui.cardPile;
			}
			if (event.insert_index) {
				event.insertIndex = () => ui.cardPile.firstChild;
			}
			event.type = "loseToCardpile";
			const cards = [];
			event.cards = cards;
			for (var i = 0; i < event.lose_list.length; i++) {
				var next = event.lose_list[i][0].lose(event.lose_list[i][1], event.position);
				next.set("insert_index", event.insert_index);
				game.log(event.lose_list[i][0], "将", event.lose_list[i][1], "置入了牌堆");
				next.animate = false;
				next.delay = false;
				cards.addArray(event.lose_list[i][1]);
				next.getlx = false;
			}
			var evt = event;
			if (evt.animate != false) {
				evt.discardid = lib.status.videoId++;
				game.broadcastAll(
					function (list, id, cards) {
						for (var i of list) {
							for (var j of i[1]) {
								j.classList.remove("glow");
								j.classList.remove("glows");
							}
							i[0].$throw(i[1], null, "nobroadcast");
						}
						var cardnodes = [];
						for (var ix of list) {
							var card = ix[1];
							for (let i = 0; i < cards.length; i++) {
								if (cards[i].clone) {
									cardnodes.push(cards[i].clone);
								}
							}
						}
						ui.todiscard[id] = cardnodes;
					},
					event.lose_list,
					evt.discardid,
					cards
				);
				if (lib.config.sync_speed && cards[0] && cards[0].clone) {
					if (evt.delay != false) {
						var waitingForTransition = get.time();
						evt.waitingForTransition = waitingForTransition;
						cards[0].clone.listenTransition(function () {
							if (_status.waitingForTransition == waitingForTransition && _status.paused) {
								game.resume();
							}
							delete evt.waitingForTransition;
						});
					} else if (evt.getParent().discardTransition) {
						delete evt.getParent().discardTransition;
						var waitingForTransition = get.time();
						evt.getParent().waitingForTransition = waitingForTransition;
						cards[0].clone.listenTransition(function () {
							if (_status.waitingForTransition == waitingForTransition && _status.paused) {
								game.resume();
							}
							delete evt.getParent().waitingForTransition;
						});
					}
				}
			}
		},
		async (event, trigger, player) => {
			if (event.delay != false) {
				if (event.waitingForTransition) {
					_status.waitingForTransition = event.waitingForTransition;
					game.pause();
				} else {
					await game.delayx();
				}
			}
		},
	],
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
			if (event.custom.replace.button) {
				event.custom.replace.card = event.custom.replace.button;
			}
			event.custom.add.card = () => {
				if (event.custom.add.card) {
					event.custom.add.button();
				}
				if (ui.selected.buttons.length > 0) {
					ui.selected.buttons.forEach(btn => {
						const link = btn.link;
						const card = get.event().newChoose.find(c => c.link === link);
						if (card) {
							ui.selected.cards.add(card);
						}
					});
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
			player.directgain(event.originalCards);
			event.tempHand = null;
			event.resume();
			if (event.dialog) {
				event.dialog.close();
			}
		},
	],
};
