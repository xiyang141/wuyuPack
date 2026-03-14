import { skins, dynamic } from "./skin";
import { lib, game, ui, get, ai, _status } from "noname";

let url = new URL(import.meta.url).pathname;
let index = url.lastIndexOf("/");

for (let character in skins) {
	let now = skins[character];
	if (now) {
		if (!dynamic[character]) {
			dynamic[character] = {};
		}
		for (let skin in now) {
			let path = now[skin].path;
			now[skin].path = lib.assetURL + "extension/无语包/src/skin/image/" + character + "/" + path;
			if (now[skin].yh) {
				now[skin].yhPath = lib.assetURL + "extension/无语包/src/skin/yuanhua/" + character + "/" + path;
			}
			dynamic[character][skin] = now[skin];
		}
	}
}

export default dynamic;
