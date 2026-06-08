import { ui, game, get, _status } from "noname";
const skills = {
  _wymhyp: {
    trigger: {
      global: ["chooseButtonBegin"]
    },
    lastDo: true,
    forced: true,
    charlotte: true,
    filter(event, player) {
      if (event.closeDialog == false || player != game.me || event.player != player || !_status.gameStarted) {
        return false;
      }
      let dialog = event.dialog;
      let allCard = true;
      let hasBtn = false;
      let closed = false;
      const list = [];
      if (!dialog && event.createDialog.length > 0) {
        dialog = ui.create.dialog.apply(null, event.createDialog);
        dialog.classList.add("removing");
        dialog.close();
        closed = true;
      }
      if (dialog) {
        for (const el of Array.from(dialog.querySelectorAll(".buttons"))) {
          if (!hasBtn) {
            hasBtn = true;
          }
          const buttons = Array.from(el.children);
          if (buttons.every((btn) => btn.classList.contains("card"))) {
            list.addArray(buttons);
          } else {
            allCard = false;
            break;
          }
        }
      }
      if (allCard && hasBtn) {
        event.newCardButton = list;
        event.oldDialog = dialog;
        if (!closed) {
          dialog.classList.remove("removing");
          dialog.close();
        }
        return true;
      }
      return false;
    },
    async content(event, trigger, player) {
      const dialog = trigger.oldDialog;
      const list = trigger.newCardButton;
      const caption = dialog.querySelector(".caption")?.textContent || "";
      const description = dialog.querySelector(".text")?.textContent || "";
      trigger.dialog = ui.create.dialog(caption + "\n" + description);
      player.getCards("hs").forEach((c) => c.classList.add("hidden", "wyremoving"));
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
    }
  }
};
export {
  skills
};
