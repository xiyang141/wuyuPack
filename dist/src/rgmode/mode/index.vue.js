import { defineComponent, openBlock, createElementBlock } from "vue";
import { _status, game } from "noname";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  setup(__props) {
    const gameStart = () => {
      game.wyrging(true);
    };
    const Start = () => {
      _status.wyrgMode.close();
      gameStart();
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "wy-modeBg__game",
        onClick: Start
      }, "开始游戏");
    };
  }
});
export {
  _sfc_main as default
};
