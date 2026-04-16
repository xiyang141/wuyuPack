import { lib, game, ui, get, ai, _status } from "noname";

//对局初始化
const battleStart = () => {
	game.roundNumber = 0;
	game.phaseNumber = 0;
	ui.arena.show();
	game.prepareArena(3);
	let seatNum = 1;
	for (const player of game.players) {
		player.getId();
		if (player == game.me) {
			player.init("wyrg_player");
			player.setIdentity("zhu");
			player.side = true;
			game.zhu = player;
		} else {
			player.init("wyrg_sb");
			player.setIdentity("fan");
			player.side = false;
		}
		player.setSeatNum(seatNum);
		seatNum++;
	}
	game.players.sortBySeat();
	game.syncState();
	game.gameDraw(game.me);
};

//对局结束
const battleEnd = () => {
	ui.arenalog.innerHTML = "";
	ui.historybar.innerHTML = "";
	ui.cardPile.innerHTML = "";
	ui.discardPile.innerHTML = "";
	ui.sidebar.innerHTML = "";
	ui.sidebar3.innerHTML = "";
	if (_status.renku) {
		delete _status.renku;
	}
	_status.gameStart = null;
	_status.roundStart = null;
	_status.lastPhasedPlayer = null;
	ui.clear();
	ui.me.remove();
	for (const player of game.players.concat(game.dead)) {
		game.removePlayer(player);
	}
};

export { battleEnd, battleStart };
