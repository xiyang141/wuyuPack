import { defineComponent, computed, onActivated, onUpdated, openBlock, createElementBlock, createElementVNode, unref, Fragment, renderList, toDisplayString, normalizeStyle } from "vue";
import { get } from "noname";
const _hoisted_1 = { class: "wy-charInfoBg wy--intro" };
const _hoisted_2 = { class: "wy-intro__base" };
const _hoisted_3 = ["innerHTML"];
const _hoisted_4 = { class: "wy-intro__base--hpLine" };
const _hoisted_5 = { class: "wy-intro__base--hpNum" };
const _hoisted_6 = { class: "wy-intro__base--group" };
const _hoisted_7 = { class: "wy-intro__skills" };
const _hoisted_8 = { class: "wy-intro__skill" };
const _hoisted_9 = { class: "wy-intro__skill--intro wy--name" };
const _hoisted_10 = { class: "wy-intro__skill--intro" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpIntro",
  props: {
    bpConfig: {}
  },
  setup(__props) {
    const props = __props;
    const current = computed(() => {
      const name = props.bpConfig.intro;
      const info = get.character(name);
      const obj = {
        hp: [],
        group: get.translation(info.group),
        color: get.translation(info.group + "Color"),
        skills: info.skills
      };
      obj.hp.push([info.hp, info.maxHp]);
      if (info.hp2) {
        const max = info.maxHp2 || info.hp;
        obj.hp.push([info.hp2, max]);
      }
      return obj;
    });
    const update = () => {
      document.querySelector(".wy-intro__base--img").setBackground(props.bpConfig.intro, "character");
    };
    onActivated(() => {
      update();
    });
    onUpdated(() => {
      update();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("div", _hoisted_2, [
          _cache[1] || (_cache[1] = createElementVNode("div", { class: "wy-intro__base--img" }, null, -1)),
          createElementVNode("div", {
            class: "wy-intro__base--name",
            innerHTML: unref(get).slimName(props.bpConfig.intro)
          }, null, 8, _hoisted_3),
          (openBlock(true), createElementBlock(Fragment, null, renderList(current.value.hp, (item) => {
            return openBlock(), createElementBlock("div", _hoisted_4, [
              _cache[0] || (_cache[0] = createElementVNode("div", { class: "wy-intro__base--hp" }, null, -1)),
              createElementVNode("div", _hoisted_5, "x " + toDisplayString(item[0]) + "/" + toDisplayString(item[1]), 1)
            ]);
          }), 256)),
          createElementVNode("div", _hoisted_6, [
            createElementVNode("div", {
              class: "wy-intro__base--groupName",
              style: normalizeStyle({
                color: current.value.color
              })
            }, toDisplayString(current.value.group), 5)
          ])
        ]),
        createElementVNode("div", _hoisted_7, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(current.value.skills, (item) => {
            return openBlock(), createElementBlock("div", _hoisted_8, [
              createElementVNode("div", _hoisted_9, toDisplayString(unref(get).translation(item)), 1),
              createElementVNode("div", _hoisted_10, toDisplayString(unref(get).skillInfoTranslation(item, false, true)), 1)
            ]);
          }), 256))
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
