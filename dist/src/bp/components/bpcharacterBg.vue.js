import { defineComponent, onMounted, onUnmounted, openBlock, createElementBlock, Fragment, renderList, withDirectives, createElementVNode, unref, normalizeClass, mergeProps, toHandlerKey, vShow } from "vue";
import { get } from "noname";
const _hoisted_1 = { class: "wy-charBg" };
const _hoisted_2 = { class: "wy-charBg__charbk" };
const _hoisted_3 = ["innerHTML"];
const _hoisted_4 = ["data-char", "onClick"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "bpcharacterBg",
  props: {
    show: {},
    ban: {},
    all: {}
  },
  emits: ["ban", "show"],
  setup(__props, { emit: __emit }) {
    const infoClick = "ontouchstart" in window ? "touchstart" : "contextmenu";
    const props = __props;
    const emit = __emit;
    let clickTarget = "", clickTimer;
    const createInfo = (char) => {
      if (infoClick == "touchstart") {
        if (clickTarget == char) {
          emit("show", char);
          clickTarget = "";
          clearTimeout(clickTimer);
        }
      } else {
        emit("show", char);
      }
    };
    const wy_toggle_char = (char) => {
      if (clickTarget && clickTarget != char) {
        emit("ban", clickTarget);
        setTimeout((charx) => emit("ban", charx), 50, char);
        clickTarget = "";
        clearTimeout(clickTimer);
      } else {
        clickTarget = char;
        clickTimer = setTimeout(
          (charx) => {
            if (clickTarget[0]) {
              emit("ban", charx);
              clickTarget = "";
            }
          },
          200,
          char
        );
      }
    };
    const observe = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setBackground(entry.target.dataset.char, "character");
            observe.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "80px"
      }
    );
    onMounted(() => {
      Array.from(document.querySelectorAll(".wy-charBg__charbk--img")).forEach((target) => observe.observe(target));
    });
    onUnmounted(() => {
      observe.disconnect();
      clearTimeout(clickTimer);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(__props.all, (char) => {
          return withDirectives((openBlock(), createElementBlock("div", _hoisted_2, [
            createElementVNode("div", {
              class: "wy-charBg__charbk--name",
              innerHTML: unref(get).slimName(char)
            }, null, 8, _hoisted_3),
            createElementVNode("div", {
              class: normalizeClass(["wy-charBg__charbk--lock", { "wy--bp": props.ban.includes(char) }])
            }, null, 2),
            createElementVNode("div", mergeProps({
              class: "wy-charBg__charbk--img",
              "data-char": char,
              onClick: ($event) => wy_toggle_char(char)
            }, {
              [toHandlerKey(unref(infoClick))]: ($event) => createInfo(char)
            }), null, 16, _hoisted_4)
          ], 512)), [
            [vShow, props.show.includes(char)]
          ]);
        }), 256))
      ]);
    };
  }
});
export {
  _sfc_main as default
};
