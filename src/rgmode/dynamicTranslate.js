import { get } from "noname";
const dynamicTranslates = {
  jingmou(player) {
    const info = player.storage.jingmou_note;
    const storage = player.storage.jingmou;
    let suitStr, typeStr;
    if (info?.suit) {
      suitStr = get.translation(info.suit);
      typeStr = get.translation(info.type);
      if (suitStr.length) {
        suitStr = suitStr + "或";
      }
    } else {
      suitStr = "与你记录相同花色或";
      typeStr = "类型";
    }
    if (!storage) {
      return `有角色使用${suitStr}${typeStr}的牌时，移除记录。<span class = 'bluetext'>此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害</span>。`;
    }
    return `有角色使用${suitStr}${typeStr}的牌时，移除记录。<span class = 'firetext'>此牌结算后将其交给任意一名角色</span>。`;
  },
  twsaoting(player) {
    const state = player.storage.twsaoting;
    if (!state) {
      return "转换技，你可以将一张伤害牌当<span class = 'bluetext'>【酒】</span>使用。当你以此法使用牌指定已受伤角色为目标后，你摸一张牌。";
    }
    return "转换技，你可以将一张伤害牌当<span class = 'firetext'>【决斗】</span>使用。当你以此法使用牌指定已受伤角色为目标后，你摸一张牌。";
  },
  twhujv(player) {
    const state = player.storage.twhujv;
    if (!state) {
      return `锁定技，转换技，<span class = 'bluetext'>①你令有${get.poptip("twjianyan")}的角色手牌上限+1；</span>②你令有${get.poptip("twjizhi")}的角色使用【杀】的次数+1。`;
    }
    return `锁定技，转换技，①你令有${get.poptip("twjianyan")}的角色手牌上限+1；<span class = 'firetext'>②你令有${get.poptip("twjizhi")}的角色使用【杀】的次数+1。</span>`;
  },
  twsuzhen(player) {
    const state = player.storage.twsaoting;
    if (!state) {
      return "转换技，你可以将一张非伤害牌当<span class = 'bluetext'>【杀】</span>使用。当你以此法使用牌指定未受伤角色为目标后，你摸一张牌。";
    }
    return "转换技，你可以将一张非伤害牌当<span class = 'firetext'>【无中生有】</span>使用。当你以此法使用牌指定未受伤角色为目标后，你摸一张牌。";
  }
};
export {
  dynamicTranslates
};
