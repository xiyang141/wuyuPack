import { defineComponent, openBlock, createElementBlock, createElementVNode, unref } from "vue";
import "noname";
const _hoisted_1 = { class: "wy-charactercardBg__skillSkin--skill" };
const _hoisted_2 = ["innerHTML"];
const _hoisted_3 = { class: "wy-charactercardBg__append" };
const _hoisted_4 = ["innerHTML"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "charIntro",
  props: {
    intro: {},
    appendStr: {}
  },
  setup(__props) {
    let props = __props;
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("div", {
          class: "wy-charactercardBg__intro",
          innerHTML: unref(props).intro
        }, null, 8, _hoisted_2),
        createElementVNode("div", _hoisted_3, [
          createElementVNode("div", {
            innerHTML: unref(props).appendStr
          }, null, 8, _hoisted_4)
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
