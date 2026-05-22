import { defineComponent, ref, computed, openBlock, createElementBlock, createElementVNode, Fragment, renderList, unref, normalizeClass, toDisplayString, withDirectives, vShow, createCommentVNode } from "vue";
import { get, lib } from "noname";
const _hoisted_1 = { class: "wy-charactercardBg__skillSkin--skill" };
const _hoisted_2 = { class: "wy-charactercardBg__skill--buttons" };
const _hoisted_3 = ["onClick"];
const _hoisted_4 = { class: "wy-charactercardBg__skill--info" };
const _hoisted_5 = ["innerHTML"];
const _hoisted_6 = ["innerHTML"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "charSkill",
  props: {
    skills: {}
  },
  setup(__props) {
    let props = __props;
    let currentSkill = ref(props.skills[0]);
    let skillTrigger = ref(get.info(currentSkill.value)?.trigger);
    let poptipTrans = (str) => {
      let list = [];
      let poptipMap = [...str.matchAll(/poptip = ([^>\s]+)/g)];
      let names = poptipMap.map((poptip) => lib.poptip.getName(poptip[1]));
      let infos = poptipMap.map((poptip) => get.plainText(lib.poptip.getInfo(poptip[1])));
      names.forEach((name, index) => {
        list.push(`${name}: ${infos[index]}`);
      });
      infos.forEach((info) => {
        list.addArray(poptipTrans(info));
      });
      return list;
    };
    let poptips = computed(() => {
      let str1 = get.skillInfoTranslation(currentSkill.value, null, false);
      let pop1 = poptipTrans(str1);
      let str2 = get.translation(currentSkill.value + "_faq_info");
      let pop2 = poptipTrans(str2);
      return pop1.concat(pop2).unique();
    });
    let faq = computed(() => {
      if (lib.translate[currentSkill.value + "_faq"]) {
        let info = get.translation(currentSkill.value + "_faq");
        let intro = get.plainText(lib.translate[currentSkill.value + "_faq_info"]);
        return `${info} : ${intro}`;
      }
      return false;
    });
    let changeSkill = (skill) => {
      currentSkill.value = skill;
      skillTrigger.value = get.info(skill)?.trigger;
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createElementVNode("div", _hoisted_2, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(props).skills, (item) => {
            return openBlock(), createElementBlock("div", {
              class: normalizeClass(["wy-charactercardBg__skill--button", {
                "wy--active": item == unref(currentSkill)
              }]),
              onClick: ($event) => unref(changeSkill)(item)
            }, toDisplayString(unref(get).translation(item)), 11, _hoisted_3);
          }), 256))
        ]),
        withDirectives(createElementVNode("div", {
          class: normalizeClass({
            "wy--trigger": unref(skillTrigger),
            "wy--enable": !unref(skillTrigger)
          })
        }, null, 2), [
          [vShow, unref(currentSkill)]
        ]),
        createElementVNode("div", _hoisted_4, toDisplayString(unref(get).skillInfoTranslation(unref(currentSkill))), 1),
        unref(faq) ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "wy-charactercardBg__skill--poptip",
          innerHTML: unref(faq)
        }, null, 8, _hoisted_5)) : createCommentVNode("", true),
        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(poptips), (poptip) => {
          return openBlock(), createElementBlock("div", {
            class: "wy-charactercardBg__skill--poptip",
            innerHTML: poptip
          }, null, 8, _hoisted_6);
        }), 256))
      ]);
    };
  }
});
export {
  _sfc_main as default
};
