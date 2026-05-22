import { defineComponent, ref, openBlock, createElementBlock, createElementVNode, withKeys, Fragment, renderList, createCommentVNode, normalizeClass, withModifiers, nextTick } from "vue";
const _hoisted_1 = { class: "wy-charInfoBg wy--explan" };
const _hoisted_2 = ["onClick"];
const _hoisted_3 = {
  key: 0,
  class: "wy--using"
};
const _hoisted_4 = ["value", "readonly", "onKeyup", "onBlur"];
const _hoisted_5 = ["onClick"];
const _hoisted_6 = ["onClick"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpExplans",
  props: {
    banInfo: {}
  },
  emits: ["changePlan", "createPlan", "changePlanName", "delPlan"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const editing = ref("");
    const changePlan = (plan) => {
      emit("changePlan", plan);
    };
    const createPlan = (target) => {
      if (target.value.trim() != "") {
        emit("createPlan", target.value.trim());
        nextTick(() => {
          target.value = "";
        });
      }
    };
    const editName = (plan, target) => {
      editing.value = plan;
      target.previousElementSibling.focus();
    };
    const changePlanName = (plan, target) => {
      console.log("hhh");
      if (target.value.trim() != "") {
        emit("changePlanName", plan, target.value.trim());
        editing.value = "";
      }
    };
    const delPlan = (plan) => {
      if (plan == props.banInfo.plan) {
        return;
      }
      emit("delPlan", plan);
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("input", {
          class: "wy-explan wy-explan--input",
          placeholder: "新建方案",
          type: "text",
          onKeyup: _cache[0] || (_cache[0] = withKeys(($event) => createPlan($event.currentTarget), ["enter"])),
          onBlur: _cache[1] || (_cache[1] = ($event) => createPlan($event.currentTarget))
        }, null, 32),
        (openBlock(true), createElementBlock(Fragment, null, renderList(props.banInfo.plans, (tarn, plan) => {
          return openBlock(), createElementBlock("div", {
            onClick: ($event) => changePlan(plan),
            class: "wy-explan"
          }, [
            props.banInfo.plan == plan ? (openBlock(), createElementBlock("div", _hoisted_3)) : createCommentVNode("", true),
            createElementVNode("input", {
              class: normalizeClass(["wy-bpBottom__button--planText", { "wy--noEdit": editing.value != plan }]),
              value: tarn,
              readonly: editing.value != plan,
              onKeyup: withKeys(($event) => changePlanName(plan, $event.currentTarget), ["enter"]),
              onBlur: ($event) => changePlanName(plan, $event.currentTarget)
            }, null, 42, _hoisted_4),
            createElementVNode("div", {
              class: "wy-bpBottom__button--changeName",
              onClick: withModifiers(($event) => editName(plan, $event.currentTarget), ["stop"])
            }, null, 8, _hoisted_5),
            createElementVNode("div", {
              class: "wy-bpBottom__button--delPlan",
              onClick: withModifiers(($event) => delPlan(plan), ["stop"])
            }, null, 8, _hoisted_6)
          ], 8, _hoisted_2);
        }), 256))
      ]);
    };
  }
});
export {
  _sfc_main as default
};
