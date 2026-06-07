import { get, ui } from "noname";
const buttonPresets = {
  playercard(item, type, position, noclick, node) {
    const owner = get.owner(item);
    if (owner) {
      const event = get.event();
      const player = get.player();
      if (event.visible || owner.isUnderControl(true, player) || player.hasSkillTag("viewHandcard", null, owner, true) || get.is.shownCard(item)) {
        return ui.create.buttonPresets.card(item, type, position, noclick, node);
      }
      return ui.create.buttonPresets.blank(item, type, position, noclick, node);
    }
    return ui.create.buttonPresets.card(item, type, position, noclick, node);
  }
};
export {
  buttonPresets
};
