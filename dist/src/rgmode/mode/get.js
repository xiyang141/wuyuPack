import "noname";
const getFuncs = {
  rawAttitude(from, to) {
    if (from.side == to.side) {
      return 10;
    } else {
      return -10;
    }
  }
};
export {
  getFuncs
};
