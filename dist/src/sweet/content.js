import { get, ui, game } from "noname";
const contents = {
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
      if (!event.custom.replace) {
        event.custom.replace = {};
      }
      if (event.custom.replace?.button) {
        event.custom.replace.cardx = event.custom.replace.button;
        delete event.custom.replace.button;
      }
      if (event.custom.add?.button) {
        event.custom.add.card = event.custom.add.button;
        delete event.custom.add.button;
      }
      event.custom.replace.card = () => {
        const event2 = get.event();
        if (event2.custom.replace.cardx) {
          event2.custom.replace.cardx?.();
        }
        if (event2.custom.add.card) {
          event2.custom.add.card();
        }
        if (ui.selected.buttons.length > 0) {
          ui.selected.cards = [];
          ui.selected.cards = ui.selected.buttons.slice();
        } else {
          ui.selected.buttons = ui.selected.cards.slice();
        }
        game.check();
      };
      game.check();
      game.pause();
    },
    async (event, trigger, player) => {
      const { dialog, cards } = event.wy_custom;
      event.result.links = event.result.cards?.map((card) => card.link);
      ui.selected.cards = [];
      event.result.cards = [];
      event.selectButton = event.selectCard;
      event.filterButton = event.filterCard;
      delete event.selectCard;
      delete event.filterCard;
      delete event.position;
      cards.forEach((card) => {
        card.fix();
        card.remove();
        card.destroyed = true;
      });
      player.getCards("hs").forEach((c) => c.classList.remove("hidden", "wyremoving"));
      ui.updatehl();
      event.dialog.close();
      event.dialog = dialog;
      delete event.wy_custom;
      if (event.callback) {
        event.callback(event.player, event.result);
      }
      event.resume();
    }
  ]
};
export {
  contents
};
