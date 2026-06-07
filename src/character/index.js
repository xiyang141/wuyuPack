import { get, lib, ui, game } from "noname";
import { contents } from "./content.js";
import { skills } from "./skill.js";
import { characters } from "./character.js";
import { characterSort } from "./characterSort.js";
import { translates } from "./translate.js";
import { dynamicTranslates } from "./dynamicTranslate.js";
import { buttonPresets } from "./buttonPresets.js";
const initCharacter = () => {
  const getOwner = get.owner;
  get.owner = (card, method) => {
    const owner = card.storage?._wyowner;
    if (get.itemtype(owner) == "player") {
      return owner;
    }
    return getOwner(card, method);
  };
  for (const content in contents) {
    lib.element.content[content] = contents[content];
  }
  for (const buttonPreset in buttonPresets) {
    ui.create.buttonPresets[buttonPreset] = buttonPresets[buttonPreset];
  }
  game.import("character", () => {
    return {
      name: "wyrg",
      character: characters,
      skill: skills,
      translate: translates,
      dynamicTranslate: dynamicTranslates,
      characterSort: {
        wyrg: characterSort
      }
    };
  });
};
export {
  initCharacter
};
