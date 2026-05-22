import { defineComponent, reactive, ref, computed, markRaw, openBlock, createElementBlock, Fragment, createElementVNode, withKeys, createVNode, createBlock, KeepAlive, resolveDynamicComponent, mergeProps, toHandlers, createCommentVNode, nextTick } from "vue";
import { lib, get, game, ui } from "noname";
import _sfc_main$4 from "./components/bpPackBg.vue.js";
import _sfc_main$6 from "./components/bpBottom.vue.js";
import _sfc_main$5 from "./components/bpcharacterBg.vue.js";
import _sfc_main$3 from "./components/bpIntro.vue.js";
import _sfc_main$2 from "./components/bpExplans.vue.js";
import _sfc_main$1 from "./components/bpMode.vue.js";
import _sfc_main$7 from "../charactercard/index.vue.js";
const _hoisted_1 = { class: "wy-areaBg" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  setup(__props) {
    const close = () => {
      game.resume2();
      ui.click.wybpClose();
      delete ui.click.wybpClose;
    };
    const bpInfo = {
      all: []
    };
    const bpConfig = reactive({
      showPack: "pack",
      current: "",
      search: "",
      show: "",
      ban: false,
      noban: false,
      intro: "caocao"
    });
    const search = (target) => {
      bpConfig.search = target.innerText.trim();
    };
    const characterPack = Object.entries(lib.characterPack);
    for (const [packx, charsObj] of characterPack) {
      const chars = Object.keys(charsObj);
      const info = {
        all: chars.slice(),
        allx: [],
        info: {}
      };
      bpInfo.all.addArray(chars);
      const list = chars;
      const sorts2 = lib.characterSort[packx];
      if (sorts2) {
        const characterSort = Object.entries(sorts2);
        for (const [sortx, charxs] of characterSort) {
          info.info[sortx] = charxs;
          list.removeArray(charxs);
          info.allx.push(sortx);
        }
        if (list.length) {
          info.allx.push("其他");
          info.info["其他"] = list;
        }
        bpInfo[packx] = info;
      } else {
        info.allx.push("其他");
        info.info["其他"] = list;
        bpInfo[packx] = info;
      }
    }
    const config = lib.config.extension_无语包_wybp;
    const banInfo = reactive({
      plan: config.plan,
      plans: config.plans,
      char: config[config.plan].slice(),
      current: "standard"
    });
    const current = ref("standard");
    const sorts = computed(() => {
      return Object.keys(bpInfo[banInfo.current].info);
    });
    const changePs = (name) => {
      if (bpConfig.ban) {
        if (bpConfig.showPack == "pack") {
          const list = bpInfo[name].all;
          if (list.some((item) => banInfo.char.includes(item))) {
            banInfo.char.removeArray(list);
          } else {
            banInfo.char.addArray(list);
          }
        } else {
          const list = bpInfo[banInfo.current].info[name];
          if (list.some((item) => banInfo.char.includes(item))) {
            banInfo.char.removeArray(list);
          } else {
            banInfo.char.addArray(list);
          }
        }
      } else {
        current.value = name;
        if (bpConfig.showPack == "pack") {
          if (banInfo.current != name) {
            banInfo.current = name;
          }
        } else if (bpConfig.current != name) {
          bpConfig.current = name;
        } else {
          bpConfig.current = "";
        }
      }
    };
    const togglePs = () => {
      if (bpConfig.showPack == "pack") {
        bpConfig.current = "";
        current.value = "";
        nextTick(() => {
          document.querySelector(".wy--sort").scrollTop = 0;
        });
        bpConfig.showPack = "sort";
      } else {
        current.value = banInfo.current;
        bpConfig.showPack = "pack";
      }
    };
    const showChars = computed(() => {
      if (bpConfig.search.length) {
        return bpInfo.all.filter((char) => get.plainText(get.slimName(char)).includes(bpConfig.search));
      }
      const obj = bpInfo[banInfo.current];
      if (bpConfig.showPack == "sort" && bpConfig.current.length) {
        return obj.info[bpConfig.current];
      } else {
        return obj.all;
      }
    });
    const ban = (name) => {
      if (bpConfig.intro != name) {
        bpConfig.intro = name;
      }
      if (bpConfig.noban) {
        return;
      }
      if (banInfo.char.includes(name)) {
        banInfo.char.remove(name);
      } else {
        banInfo.char.push(name);
      }
    };
    const infoShow = ref("intro");
    const showInfo = {
      intro: {
        show: markRaw(_sfc_main$3),
        props: {
          bpConfig
        },
        emit: {}
      },
      explan: {
        show: markRaw(_sfc_main$2),
        props: {
          banInfo
        },
        emit: {
          changePlanName(plan, name) {
            banInfo.plans[plan] = name;
            config.plans[plan] = name;
            game.saveExtensionConfig("无语包", "wybp", config);
          },
          changePlan(plan) {
            banInfo.plan = plan;
            banInfo.char = config[plan];
            config.plan = plan;
            game.saveExtensionConfig("无语包", "wybp", config);
          },
          createPlan(name) {
            const num = Object.keys(banInfo.plans).length;
            const newPlan = "plan" + num;
            banInfo.plans[newPlan] = name;
            config.plans[newPlan] = name;
            config[newPlan] = [];
            game.saveExtensionConfig("无语包", "wybp", config);
          },
          delPlan(plan) {
            const list = Object.keys(banInfo.plans);
            const index = list.indexOf(plan);
            for (const key in banInfo.plans) {
              const num = list.indexOf(key);
              const tran = banInfo.plans[key];
              const char = config[key].slice();
              if (num >= index) {
                delete banInfo.plans[key];
                delete config.plans[key];
                delete config[plan];
              }
              if (num > index) {
                const newPlan = "plan" + (num - 1);
                banInfo.plans[newPlan] = tran;
                config.plans[newPlan] = tran;
                config[newPlan] = char;
              }
            }
            game.saveExtensionConfig("无语包", "wybp", config);
          }
        }
      },
      exmode: {
        show: markRaw(_sfc_main$1),
        props: {
          bpConfig
        },
        emit: {
          changeBan() {
            if (bpConfig.ban) {
              bpConfig.ban = false;
            } else {
              bpConfig.ban = true;
            }
          },
          noban() {
            if (bpConfig.noban) {
              bpConfig.noban = false;
            } else {
              bpConfig.noban = true;
            }
          }
        }
      }
    };
    const changeIntro = (key) => {
      if (infoShow.value == key) {
        infoShow.value = "intro";
      } else {
        infoShow.value = key;
      }
    };
    const showIntro = (name) => {
      bpConfig.intro = name;
      bpConfig.show = name;
    };
    const closeIntro = () => {
      bpConfig.show = "";
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(Fragment, null, [
        createElementVNode("div", _hoisted_1, [
          createElementVNode("div", {
            class: "wy__close",
            onClick: _cache[0] || (_cache[0] = ($event) => close())
          }),
          createElementVNode("div", {
            class: "wy__search",
            contenteditable: "true",
            onKeyup: _cache[1] || (_cache[1] = withKeys(($event) => search($event.currentTarget), ["enter"])),
            onBlur: _cache[2] || (_cache[2] = ($event) => search($event.currentTarget))
          }, null, 32),
          createVNode(_sfc_main$4, {
            showPack: bpConfig.showPack,
            banchars: banInfo.char,
            sorts: sorts.value,
            current: current.value,
            onChangePs: changePs
          }, null, 8, ["showPack", "banchars", "sorts", "current"]),
          createVNode(_sfc_main$5, {
            show: showChars.value,
            all: bpInfo.all,
            ban: banInfo.char,
            onBan: ban,
            onShow: showIntro
          }, null, 8, ["show", "all", "ban"]),
          createVNode(_sfc_main$6, {
            onTogglePs: togglePs,
            onChangeIntro: changeIntro
          })
        ]),
        (openBlock(), createBlock(KeepAlive, { exclude: "bpIntro" }, [
          (openBlock(), createBlock(resolveDynamicComponent(showInfo[infoShow.value].show), mergeProps(showInfo[infoShow.value].props, toHandlers(showInfo[infoShow.value].emit)), null, 16))
        ], 1024)),
        bpConfig.show ? (openBlock(), createBlock(_sfc_main$7, {
          key: 0,
          show: bpConfig.show,
          onClose: closeIntro
        }, null, 8, ["show"])) : createCommentVNode("", true)
      ], 64);
    };
  }
});
export {
  _sfc_main as default
};
