import { defineComponent, openBlock, createElementBlock, createElementVNode, withModifiers } from "vue";
const _hoisted_1 = { class: "wy-bpBottom" };
const _hoisted_2 = { class: "wy-bpBottom__button" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpBottom",
  emits: ["togglePs", "changeIntro"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const toggle = () => {
      emit("togglePs");
    };
    const explan = () => {
      emit("changeIntro", "explan");
    };
    const exmode = () => {
      emit("changeIntro", "exmode");
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("div", {
          class: "wy-bpBottom__button",
          onClick: _cache[1] || (_cache[1] = ($event) => toggle())
        }, [
          _cache[3] || (_cache[3] = createElementVNode("div", { class: "wy-bpBottom__button--text" }, "切换分包", -1)),
          createElementVNode("div", {
            class: "wy-bpBottom__button--manage wy--left",
            onClick: _cache[0] || (_cache[0] = withModifiers(($event) => exmode(), ["stop"]))
          })
        ]),
        createElementVNode("div", _hoisted_2, [
          _cache[4] || (_cache[4] = createElementVNode("div", { class: "wy-bpBottom__button--text" }, "AI禁用", -1)),
          createElementVNode("div", {
            class: "wy-bpBottom__button--manage wy--right",
            onClick: _cache[2] || (_cache[2] = withModifiers(($event) => explan(), ["stop"]))
          })
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
