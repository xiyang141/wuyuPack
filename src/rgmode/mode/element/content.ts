import { lib, game, ui, get, ai, _status } from "noname";

const content = {
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
			const findNext = current => {
				const players = game.players
					.slice(0)
					.concat(game.dead)
					.sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
				const position = parseInt(current.dataset.position);
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
};

export { content };
