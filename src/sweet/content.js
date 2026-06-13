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
      if (event.custom.replace?.button) {
        event.custom.replace.cardx = event.custom.replace.button;
        delete event.custom.replace.button;
      }
      if (event.custom.add?.button) {
        event.custom.add.cardx = event.custom.add.button;
        delete event.custom.add.button;
      }
      if (event.custom.replace?.cardx) {
        event.custom.replace.card = (card) => {
          const event2 = get.event();
          const cards2 = event2.wy_custom.cards;
          if (event2.custom.replace.cardx) {
            event2.custom.replace.cardx?.(card);
          }
          if (event2.custom.add?.card) {
            event2.custom.add.card();
          }
          ui.selected.cards = ui.selected.buttons.slice();
          cards2.forEach((card2) => {
            if (card2.classList.contains("selected")) {
              card2.updateTransform(true);
            } else {
              card2.updateTransform();
            }
          });
          game.check();
        };
      }
      if (!event.custom.add) {
        event.custom.add = {};
      }
      event.custom.add.card = () => {
        const event2 = get.event();
        if (event2.custom.add.cardx) {
          event2.custom.add.cardx?.();
        }
        if (event2.custom.replace?.cardx) {
          return;
        }
        ui.selected.buttons = ui.selected.cards.slice();
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
