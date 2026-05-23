import { defineComponent, openBlock, createElementBlock, createElementVNode, normalizeClass } from "vue";
const _hoisted_1 = { class: "wy-charInfoBg wy--explan" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpMode",
  props: {
    bpConfig: {}
  },
  emits: ["changeBan", "noban"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const change = () => {
      emit("changeBan");
    };
    const noban = () => {
      emit("noban");
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("div", {
          class: normalizeClass(["wy-explan", {
            "wy--active": props.bpConfig.ban
          }]),
          onClick: _cache[0] || (_cache[0] = ($event) => change())
        }, [..._cache[2] || (_cache[2] = [
          createElementVNode("div", { class: "wy-bpBottom__button--planText" }, "禁用分包", -1)
        ])], 2),
        createElementVNode("div", {
          class: normalizeClass(["wy-explan", {
            "wy--active": props.bpConfig.noban
          }]),
          onClick: _cache[1] || (_cache[1] = ($event) => noban())
        }, [..._cache[3] || (_cache[3] = [
          createElementVNode("div", { class: "wy-bpBottom__button--planText" }, "查看详情", -1)
        ])], 2)
      ]);
    };
  }
});
export {
  _sfc_main as default
};
