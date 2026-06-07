import { game, _status, get } from "noname";
const playerFuncs = {
  dieAfter() {
    if (game.zhu.isDead()) {
      _status.wyrgFighting = false;
    } else if (game.players.length == 1) {
      _status.wyrgFighting = false;
    }
    if (!_status.wyrgFighting) {
      const phaseUse = get.event().getParent("phaseUse");
      if (phaseUse) {
        phaseUse.skipped = true;
      }
      const phase = get.event().getParent("phase");
      if (phase) {
        phase.finish();
      }
    }
  }
};
export {
  playerFuncs
};
