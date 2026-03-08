import { skins, dynamic } from "./skin";
import { lib, game, ui, get, ai, _status } from "noname";

for (let character in skins) {
	let now = skins[character];
	if (now) {
		if (!dynamic[character]) {
			dynamic[character] = {};
		}
		for (let skin in now) {
			let path = now[skin].path;
			now[skin].path = lib.assetURL + "extension/无语包/src/skin/image/" + character + "/" + path;
			now[skin].ext = ".png";
			dynamic[character][skin] = now[skin];
		}
	}
}

export default dynamic;
