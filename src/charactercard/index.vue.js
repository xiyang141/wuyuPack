import { defineComponent, reactive, computed, provide, openBlock, createElementBlock, createBlock, KeepAlive, resolveDynamicComponent, unref, createElementVNode } from "vue";
import { lib, get } from "noname";
import _sfc_main$1 from "./sCard.vue.js";
import _sfc_main$2 from "./bCard.vue.js";
const _hoisted_1 = { class: "wy-charactercardBg" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  props: {
    show: {}
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    let props = __props;
    let emit = __emit;
    let info = lib.wySkin.getSkin(props.show);
    let skinList = info.skin, rSkinList = info.rskin, yuanhuaList = info.yuanhua;
    let skinListx = Object.values(rSkinList).map((arr) => arr[0]), skinListy = Object.values(yuanhuaList).map((arr) => arr[0]);
    let character = get.character(props.show);
    let skills = character.skills;
    let intro = get.characterIntro(props.show);
    let appendStr = lib.characterAppend[props.show] || "";
    let current = reactive({
      show: skinListx[0],
      curr: skinList[0],
      skin: 0,
      rskin: 0,
      mode: 0,
      skills,
      intro,
      appendStr
    });
    let cards = [_sfc_main$1, _sfc_main$2];
    let close = () => {
      emit("close");
    };
    let getPrefix = (str) => {
      if (lib.translate[`${str}_prefix`]) {
        let prefixList = lib.translate[str + "_prefix"].split("|");
        return `${prefixList.map((prefix) => get.prefixSpan(prefix, str), "").join("")}`;
      }
      return "";
    };
    let skins = computed(() => {
      if (current.mode == 0) {
        return skinListx;
      } else {
        return skinListy;
      }
    });
    let rSkins = computed(() => {
      if (current.mode == 0) {
        return rSkinList[current.curr];
      } else {
        return yuanhuaList[current.curr];
      }
    });
    provide("info", {
      prefix: getPrefix(props.show),
      rawName: get.rawName(props.show),
      tilte: get.characterTitle(props.show),
      skins,
      rSkins,
      show: current
    });
    let toggle = () => {
      if (current.mode == 0) {
        current.mode = 1;
      } else {
        current.mode = 0;
      }
    };
    let changeSkin = (index, rSkin) => {
      if (rSkin) {
        current.show = rSkinList[current.curr][index];
        current.rskin = index;
      } else {
        current.show = skinListx[index];
        current.skin = index;
        current.curr = skinList[index];
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        (openBlock(), createBlock(KeepAlive, null, [
          (openBlock(), createBlock(resolveDynamicComponent(unref(cards)[unref(current).mode]), {
            onChangeSkin: unref(changeSkin),
            onToggle: unref(toggle)
          }, null, 40, ["onChangeSkin", "onToggle"]))
        ], 1024)),
        createElementVNode("div", {
          class: "wy-charactercardBg__close",
          onClick: _cache[0] || (_cache[0] = //@ts-ignore
          (...args) => unref(close) && unref(close)(...args))
        })
      ]);
    };
  }
});
export {
  _sfc_main as default
};
