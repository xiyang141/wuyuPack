import type { Dynamic } from "../type";

let skins = {
	mb_caomao: {
		test: {
			name: "测试",
			path: "测试",
			ext: ".png",
			audio: {
				card: true,
				skill: true,
			},
		},
	},
};

let dynamic: Dynamic = {};

export { skins, dynamic };
