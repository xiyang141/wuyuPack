import { lib, game, ui, get, ai, _status } from "noname";
import { dynamic } from "./dynamic";
import type { wySkinConfig } from "../type";

let url = new URL(import.meta.url).pathname;
let index = url.lastIndexOf("/");
let base = url.slice(1, index);

class wySkin implements wySkinConfig {
	character: "";
	constructor(character) {
		this.character = character;
	}
	static getSkin(name) {}
	static getDynamic(name) {}
	static getInfo(name) {}
	static getAudio(name) {}
}

let getSkin = character => {
	if (!_status.wySkin[character]) {
		let info = get.character();
		let normalSkin = "",
			normalSkins = lib.characterSubstitute[character] || [];
		if (info.image) {
			normalSkin = info.image;
		} else {
			normalSkin = `url(image/character/${character}.jpg)`;
		}
		_status.wySkin[character] = {
			nav: ["normal"],
			skin: [normalSkin],
			skins: {
				normal: [normalSkin].concat(normalSkins.map(i => `url(image/character/${i[0]}.jpg)`)),
			},
			yh: {
				normal: [],
			},
		};
		let skinInfo = skins[character];
		for (let skin in skinInfo) {
			_status.wySkin[character].nav.push(skin);
			let info = skinInfo[skin];
			let name = info.name,
				ext = info.ext;
			let path = `url(${base}/image/${character}/${name}/${name}${ext})`;
			_status.wySkin[character].skin.push(path);
			_status.wySkin[character].skins[skin] = [path];
			let skins = info.skins || [];
			if (Array.isArray(skins)) {
				_status.wySkin[character].skins[skin].addArray(skins.map(i => `url(${base}/image/${character}/${name}/${i})`));
			} else {
			}
			let yhList = [`${name}${ext}`].concat(skins);
			game.getFileList(
				`${base}/yuanhua/${character}/${name}`,
				(dirs, files) => {
					let list = [];
					files.forEach(file => {
						let index = yhList.indexOf(file);
						if (index != -1) {
							list.push(index);
							yhList[index] = `url(${base}/yuanhua/${character}/${name}/${file})`;
						}
					});
					let newList = yhList.map((item, index) => {
						if (!list.includes(index)) {
							return "";
						}
						return item;
					});
					_status.wySkin[character].yh[skin] = newList;
				},
				() => {
					_status.wySkin[character].yh[skin] = yhList.map(i => "");
					console.warn("读取失败");
				}
			);
		}
	}
	return _status.wySkin[character];
};

let initSkin = () => {
	_status.wySkin = {};
	lib.wySkin = {
		getSkin: getSkin,
	};
};

export { initSkin };
