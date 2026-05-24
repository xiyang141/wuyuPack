import { lib, get, game } from "noname";
const url = new URL(import.meta.url).pathname;
const index = url.lastIndexOf("/");
const base = url.slice(0, index);
class wySkin {
  character;
  constructor() {
    this.character = {};
  }
  getSkin(name) {
    if (this.character[name]) {
      return this.character[name];
    }
    const skinInfo = {
      skin: [name],
      rskin: {
        [name]: []
      },
      yuanhua: {}
    };
    const info = get.character(name);
    let url2;
    if (info.img) {
      url2 = info.img.replace(/^ext:/, "extension/");
      skinInfo.rskin[name].push(`url(${url2})`);
    } else if (info.trashBin) {
      let bool = true;
      const trashBin = info.trashBin;
      trashBin.forEach((item) => {
        if (item.startsWith("img:") || item.startsWith("ext:")) {
          url2 = item.replace(/^ext:/, "extension/");
          skinInfo.rskin[name].push(`url(${url2})`);
          bool = false;
        }
      });
      if (bool) {
        skinInfo.rskin[name].push(`url(/image/character/${name}.jpg)`);
      }
    }
    const rskin = lib.characterSubstitute[name] || [];
    rskin.forEach((rskinx) => {
      for (const item of rskinx[1]) {
        if (item.startsWith("ext:")) {
          skinInfo.rskin[name].push(`url(${item})`);
          return;
        }
      }
      skinInfo.rskin[name].push(`url(/image/character/${rskinx[0]}.jpg)`);
    });
    game.getFileList(base + "/image/" + name, (folders, files) => {
      folders.forEach((item) => {
        if (item != name) {
          lib.wySkin.character[name].skin.push(item);
          lib.wySkin.character[name].rskin[item] = [];
        }
        game.getFileList(`${base}/image/${name}/${item}`, (folders2, files2) => {
          files2.forEach((itemx) => {
            lib.wySkin.character[name].rskin[item].push(`url(${base}/image/${name}/${item}/${itemx})`);
          });
        });
      });
    });
    game.getFileList(base + "/yuanhua/" + name, (folders, files) => {
      folders.forEach((item) => {
        lib.wySkin.character[name].yuanhua[item] = [];
        game.getFileList(`${base}/yuanhua/${name}/${item}`, (folders2, files2) => {
          files2.forEach((itemx) => {
            lib.wySkin.character[name].yuanhua[item].push(`url(${base}/yuanhua/${name}/${item}/${itemx})`);
          });
        });
      });
    });
    this.character[name] = skinInfo;
    return skinInfo;
  }
}
const initSkin = () => {
  lib.wySkin = new wySkin();
};
export {
  initSkin
};
