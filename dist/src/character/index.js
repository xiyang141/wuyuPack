import { lib, get } from "noname";
import { character } from "./character.js";
import { skill } from "./skill.js";
import { translate } from "./translate.js";
import { card } from "./card.js";
import { dynamicTranslate } from "./dynamicTranslate.js";
const initcharacter = () => {
  for (const c in card) {
    lib.card[c] = card[c];
  }
  for (const s in skill) {
    lib.skill[s] = skill[s];
  }
  for (const t in translate) {
    lib.translate[t] = translate[t];
  }
  for (const dt in dynamicTranslate) {
    lib.dynamicTranslate[dt] = dynamicTranslate[dt];
  }
  for (const char in character) {
    const info = get.copy(character[char].info);
    delete character[char].info;
    if (info.title) {
      lib.characterTitle[char] = info.title;
    }
    lib.character[char] = character[char];
    lib.character[char] = character[char];
    lib.characterPack[info.pack][char] = char;
    if (!lib.characterSort[info.pack][info.sort]) {
      lib.characterSort[info.pack][info.sort] = [];
    }
    lib.characterSort[info.pack][info.sort].push(char);
  }
};
export {
  initcharacter
};
