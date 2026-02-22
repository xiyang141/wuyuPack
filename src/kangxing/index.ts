import { lib, game, ui, get, ai, _status } from "noname";

let fileChange = (parent, path) => {
	let nowPath = parent + "/" + path;
	game.getFileList(nowPath, (folders, files) => {
		let decoder = new TextDecoder("utf-8");
		for (let folder of folders) {
			fileChange(nowPath, folder);
		}
		for (let file of files) {
			if (file.endsWith(".js")) {
				let code = game.readFile(nowPath + "/" + file, filex => {
					let code = decoder.decode(filex);
					if (/configurable\s*:\s*(?!\s*true\b)[^,]+/.test(code)) {
						code = code.replace(/configurable\s*:\s*(?!true\b)[^,]+/g, "configurable: true");
						game.writeFile(code, nowPath, file);
					}
				});
			}
		}
	});
};

export let delKangxing = () => {
	game.getFileList("./extension", (folders, files) => {
		for (let folder of folders) {
			if (folder == "无语包") {
				continue;
			}
			fileChange("./extension", folder);
		}
	});
};
