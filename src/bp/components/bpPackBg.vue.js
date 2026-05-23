import { defineComponent, openBlock, createElementBlock, Fragment, withDirectives, createElementVNode, renderList, unref, normalizeClass, vShow } from "vue";
import { lib, get } from "noname";
const _hoisted_1 = { class: "wy-areaBg__packBg" };
const _hoisted_2 = ["onClick", "innerHTML"];
const _hoisted_3 = { class: "wy-areaBg__packBg wy--sort" };
const _hoisted_4 = ["onClick", "innerHTML"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpPackBg",
  props: {
    banchars: {},
    showPack: {},
    sorts: {},
    current: {}
  },
  emits: ["changePs"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const packsx = Object.keys(lib.characterPack);
    const index = packsx.indexOf("standard");
    const packs = packsx.slice(index).concat(packsx.slice(0, index).reverse());
    const change = (name) => {
      emit("changePs", name);
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(Fragment, null, [
        withDirectives(createElementVNode("div", _hoisted_1, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(packs), (pack) => {
            return openBlock(), createElementBlock("div", {
              class: normalizeClass(["wy-areaBg__pack", {
                "wy--active": __props.current == pack
              }]),
              onClick: ($event) => change(pack),
              innerHTML: unref(get).translation(pack + "_character_config")
            }, null, 10, _hoisted_2);
          }), 256))
        ], 512), [
          [vShow, props.showPack == "pack"]
        ]),
        withDirectives(createElementVNode("div", _hoisted_3, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(__props.sorts, (sort) => {
            return openBlock(), createElementBlock("div", {
              class: normalizeClass([{
                "wy--active": __props.current == sort
              }, "wy-areaBg__pack"]),
              onClick: ($event) => change(sort),
              innerHTML: unref(get).translation(sort)
            }, null, 10, _hoisted_4);
          }), 256))
        ], 512), [
          [vShow, props.showPack == "sort"]
        ])
      ], 64);
    };
  }
});
export {
  _sfc_main as default
};
