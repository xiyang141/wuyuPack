import { defineComponent, inject, ref, openBlock, createElementBlock, Fragment, createElementVNode, unref, toDisplayString, mergeProps, toHandlerKey, renderList, normalizeClass, createBlock, KeepAlive, resolveDynamicComponent, normalizeProps, guardReactiveProps, normalizeStyle } from "vue";
import "noname";
import _sfc_main$1 from "./charSkill.vue.js";
import _sfc_main$2 from "./charVoice.vue.js";
import _sfc_main$3 from "./charIntro.vue.js";
const _hoisted_1 = { class: "wy-charactercardBg__characterName" };
const _hoisted_2 = ["innerHTML"];
const _hoisted_3 = { class: "wy-charactercardBg__characterName--name" };
const _hoisted_4 = { class: "wy-charactercardBg__characterName--tilte" };
const _hoisted_5 = { class: "wy-charactercardBg__character" };
const _hoisted_6 = { class: "wy-charactercardBg__buttons" };
const _hoisted_7 = ["onClick"];
const _hoisted_8 = { class: "wy-charactercardBg__skillSkin" };
const _hoisted_9 = { class: "wy-charactercardBg__skillSkin--skin" };
const _hoisted_10 = ["onClick"];
const _hoisted_11 = { class: "wy-charactercardBg__rSkin" };
const _hoisted_12 = ["onClick"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "sCard",
  emits: ["changeSkin", "toggle"],
  setup(__props, { emit: __emit }) {
    let emit = __emit;
    let hch = "ontouchstart" in window ? "dblclick" : "contextmenu";
    let info = inject("info");
    let buttons = ["技能", "台词", "简介"];
    let currentButton = ref(0);
    let infoList = [_sfc_main$1, _sfc_main$2, _sfc_main$3];
    let dataList = [
      { skills: info.show.skills },
      {
        skills: info.show.skills
      },
      {
        intro: info.show.intro,
        appendStr: info.show.appendStr
      }
    ];
    let toggle = () => {
      emit("toggle");
    };
    let changgeInfo = (button) => {
      currentButton.value = button;
    };
    let changeSkin = (item, rSkin) => {
      emit("changeSkin", item, rSkin);
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(Fragment, null, [
        createElementVNode("div", _hoisted_1, [
          createElementVNode("div", {
            class: "wy-charactercardBg__characterName--prefix",
            innerHTML: unref(info).prefix
          }, null, 8, _hoisted_2),
          createElementVNode("div", _hoisted_3, toDisplayString(unref(info).rawName), 1),
          createElementVNode("div", _hoisted_4, toDisplayString(unref(info).tilte), 1)
        ]),
        createElementVNode("div", _hoisted_5, [
          createElementVNode("div", mergeProps({
            class: "wy-charactercardBg__character--char",
            style: {
              backgroundImage: unref(info).show.show
            }
          }, {
            [toHandlerKey(unref(hch))]: _cache[0] || (_cache[0] = //@ts-ignore
            (...args) => unref(toggle) && unref(toggle)(...args))
          }), null, 16)
        ]),
        createElementVNode("div", _hoisted_6, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(buttons), (item, index) => {
            return openBlock(), createElementBlock("div", {
              class: normalizeClass([{
                "wy--active": unref(currentButton) == index
              }, "wy-charactercardBg__button"]),
              onClick: ($event) => unref(changgeInfo)(index)
            }, toDisplayString(item), 11, _hoisted_7);
          }), 256))
        ]),
        createElementVNode("div", _hoisted_8, [
          (openBlock(), createBlock(KeepAlive, null, [
            (openBlock(), createBlock(resolveDynamicComponent(unref(infoList)[unref(currentButton)]), normalizeProps(guardReactiveProps(unref(dataList)[unref(currentButton)])), null, 16))
          ], 1024)),
          createElementVNode("div", _hoisted_9, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(info).skins.value, (item, index) => {
              return openBlock(), createElementBlock("div", {
                class: normalizeClass(["wy-charactercardBg__skillSkin--char", {
                  "wy--active": unref(info).show.skin == index
                }])
              }, [
                createElementVNode("div", {
                  class: "wy-charactercardBg__skillSkin--dynamic",
                  style: normalizeStyle({
                    backgroundImage: item == "dynamic" ? "none" : item
                  }),
                  onClick: ($event) => unref(changeSkin)(index, false)
                }, null, 12, _hoisted_10)
              ], 2);
            }), 256))
          ])
        ]),
        createElementVNode("div", _hoisted_11, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(info).rSkins.value, (item, index) => {
            return openBlock(), createElementBlock("div", {
              class: normalizeClass(["wy-charactercardBg__rSkin--char", {
                "wy--active": unref(info).show.rskin == index
              }])
            }, [
              createElementVNode("div", {
                class: "wy-charactercardBg__rSkin--skin",
                style: normalizeStyle({
                  backgroundImage: item == "dynamic" ? "none" : item
                }),
                onClick: ($event) => unref(changeSkin)(index, true)
              }, null, 12, _hoisted_12)
            ], 2);
          }), 256))
        ])
      ], 64);
    };
  }
});
export {
  _sfc_main as default
};
