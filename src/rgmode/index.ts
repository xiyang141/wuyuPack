import { lib, game, ui, get, ai, _status } from "noname";
import { createApp } from "vue";
import App from "./index.vue";

let initSht = () => {
	lib.init.css(lib.assetURL + "extension/无语包/src/rgmode", "index");
};

let mode = {
	name: "wyrg",
	splash: lib.assetURL + "extension/无语包/src/rgmode/image/mode.jpg",
	init() {
		_status.mode = "wyrg";
		_status.wyrgMode = {
			loadHome() {
				let bg = ui.create.div(document.body, ".wy-modeBg");
				let app = createApp(App);
				app.mount(bg);
				this.close = () => {
					bg.remove();
					app.unmount();
				};
			},
		};
		_status.wyrgMode.loadHome();
	},
	start: [
		async (event, trigger, player) => {
			let { promise, resolve } = Promise.withResolvers();
			game.wyrging = resolve;
			await promise;
		},
		async (event, trigger, player) => {
			game.roundNumber = 0;
			ui.arena.show();
			game.prepareArena(3);
			let seatNum = 1;
			for (let player of game.players) {
				player.getId();
				if (player == game.me) {
					player.init("caocao");
					player.setIdentity("zhu");
					player.side = true;
					game.zhu = player;
				} else {
					player.init("caocao");
					player.setIdentity("fan");
					player.side = false;
				}
				player.setSeatNum(seatNum);
				seatNum++;
			}
			game.players.sortBySeat();
			game.syncState();
			game.gameDraw(game.me);
			await event.trigger("enterGame");
			_status.wyrgFighting = true;
			await game.phaseLoop(game.me);
		},
		(event, trigger, player) => {
			ui.arenalog.innerHTML = "";
			ui.historybar.innerHTML = "";
			ui.clear();
			ui.me.remove();
			for (let player of game.players.concat(game.dead)) {
				game.removePlayer(player);
			}
			event.goto(0);
			_status.wyrgMode.loadHome();
		},
	],
	game: {},
	get: {
		rawAttitude(from, to) {
			if (from.side == to.side) {
				return 10;
			} else {
				return -10;
			}
		},
	},
	skill: {},
	card: {},
	translate: {
		zhu: "主",
		fan: "反",
	},
	element: {
		player: {
			dieAfter() {
				if (game.zhu.isDead()) {
					_status.wyrgFighting = false;
				} else if (game.players.length == 1) {
					_status.wyrgFighting = false;
				}
			},
		},
		card: {},
		event: {},
		content: {
			async phaseLoop(event, trigger, player) {
				let num = 1,
					current = player;
				while (current.getSeatNum() === 0) {
					current.setSeatNum(num);
					current = current.next;
					num++;
				}
				while (_status.wyrgFighting) {
					if (game.players.includes(event.player)) {
						lib.onphase.forEach(i => i());
						const phase = event.player.phase();
						event.next.remove(phase);
						let isRoundEnd = false;
						if (lib.onround.every(i => i(phase, event.player))) {
							isRoundEnd = _status.roundSkipped;
							if (_status.isRoundFilter) {
								isRoundEnd = _status.isRoundFilter(phase, event.player);
							} else if (_status.seatNumSettled) {
								const seatNum = event.player.getSeatNum();
								if (seatNum != 0) {
									if (get.itemtype(_status.lastPhasedPlayer) != "player" || seatNum < _status.lastPhasedPlayer.getSeatNum()) {
										isRoundEnd = true;
									}
								}
							} else if (event.player == _status.roundStart) {
								isRoundEnd = true;
							}
							if (isRoundEnd && _status.globalHistory.some(i => i.isRound)) {
								game.log();
								await event.trigger("roundEnd");
							}
						}
						event.next.push(phase);
						await phase;
					}
					await event.trigger("phaseOver");
					let findNext = current => {
						let players = game.players
							.slice(0)
							.concat(game.dead)
							.sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
						let position = parseInt(current.dataset.position);
						for (let i = 0; i < players.length; i++) {
							if (parseInt(players[i].dataset.position) > position) {
								return players[i];
							}
						}
						return players[0];
					};
					event.player = findNext(event.player);
				}
			},
		},
	},
};

let config = {};

let addSht = () => {
	game.addMode("wyRg", mode, {
		extension: "无语包",
		translate: "自用肉鸽",
		congig: config,
	});
};

export { initSht, addSht };
