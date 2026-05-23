import { defineComponent, inject, openBlock, createElementBlock, Fragment, createElementVNode, unref, toDisplayString, mergeProps, toHandlerKey } from "vue";
import "noname";
const _hoisted_1 = { class: "wy-charactercardBg__characterName" };
const _hoisted_2 = ["innerHTML"];
const _hoisted_3 = { class: "wy-charactercardBg__characterName--name" };
const _hoisted_4 = { class: "wy-charactercardBg__characterName--tilte" };
const _hoisted_5 = { class: "wy-charactercardBg__character wy--bCard" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bCard",
  emits: ["changeSkin", "toggle"],
  setup(__props, { emit: __emit }) {
    let emit = __emit;
    let hch = "ontouchstart" in window ? "dblclick" : "contextmenu";
    let info = inject("info");
    let toggle = () => {
      emit("toggle");
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
            class: "wy-charactercardBg__character--char wy--bCard",
            style: {
              backgroundImage: unref(info).show.show
            }
          }, {
            [toHandlerKey(unref(hch))]: _cache[0] || (_cache[0] = //@ts-ignore
            (...args) => unref(toggle) && unref(toggle)(...args))
          }), null, 16)
        ])
      ], 64);
    };
  }
});
export {
  _sfc_main as default
};
