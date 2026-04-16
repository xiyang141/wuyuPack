import { lib, game, ui, get, ai, _status } from "noname";
import { dynamic } from "./dynamic";
import type { wySkinConfig } from "../type";

const url = new URL(import.meta.url).pathname;
const index = url.lastIndexOf("/");
const base = url.slice(0, index);

class wySkin implements wySkinConfig {
	character;
	constructor() {
		this.character = {};
	}
	getSkin(name: string) {
		if (this.character[name]) {
			return this.character[name];
		}
		const skinInfo = {
			skin: [name],
			rskin: {
				[name]: [],
			},
			yuanhua: {},
		};
		const info = get.character(name);
		if (info.img) {
			skinInfo.rskin[name].push(info.img);
		} else if (info.trashBin) {
			let bool = true;
			const trashBin = info.trashBin;
			trashBin.forEach(item => {
				if (item.startsWith("ext:")) {
					skinInfo.rskin[name].push(`url(${item})`);
					bool = false;
					return;
				}
			});
			if (bool) {
				skinInfo.rskin[name].push(`url(/image/character/${name}.jpg)`);
			}
		}
		const rskin = lib.characterSubstitute[name] || [];
		rskin.forEach(rskinx => {
			for (const item of rskinx[1]) {
				if (item.startsWith("ext:")) {
					skinInfo.rskin[name].push(`url(${item})`);
					return;
				}
			}
			skinInfo.rskin[name].push(`url(/image/character/${rskinx[0]}.jpg)`);
		});
		game.getFileList(
			base + "/image/" + name,
			(folders, files) => {
				folders.forEach(item => {
					if (item != name) {
						lib.wySkin.character[name].skin.push(item);
						lib.wySkin.character[name].rskin[item] = [];
					}
					game.getFileList(`${base}/image/${name}/${item}`, (folders, files) => {
						files.forEach(itemx => {
							lib.wySkin.character[name].rskin[item].push(`url(${base}/image/${name}/${item}/${itemx})`);
						});
					});
				});
			},
		);
		game.getFileList(
			base + "/yuanhua/" + name,
			(folders, files) => {
				folders.forEach(item => {
					lib.wySkin.character[name].yuanhua[item] = [];
					game.getFileList(`${base}/yuanhua/${name}/${item}`, (folders, files) => {
						files.forEach(itemx => {
							lib.wySkin.character[name].yuanhua[item].push(`url(${base}/yuanhua/${name}/${item}/${itemx})`);
						});
					});
				});
			},
		);
		this.character[name] = skinInfo;
		return skinInfo;
	}
}

const initSkin = () => {
	lib.wySkin = new wySkin();
};

export { initSkin };
