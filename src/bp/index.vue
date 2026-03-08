<template>
	<div class="wy-areaBg">
		<div class="wy__close" @click="close()"></div>
		<div class="wy__search" contenteditable="true" @keyup.enter="search($event.currentTarget)" @blur="search($event.currentTarget)"></div>
		<bpPackBg :showPack="bpConfig.showPack" :banchars="banInfo.char" :sorts="sorts" :current="current" @changePs="changePs"></bpPackBg>
		<bpcharacterBg :show="showChars" :all="bpInfo.all" :ban="banInfo.char" @ban="ban" @show="showIntro"></bpcharacterBg>
		<bpBottom @togglePs="togglePs" @changeIntro="changeIntro"></bpBottom>
	</div>
	<KeepAlive exclude="intro">
		<component :is="showInfo[infoShow].show" v-bind="showInfo[infoShow].props" v-on="showInfo[infoShow].emit"></component>
	</KeepAlive>
	<bpcharactercard v-if="bpConfig.show" :show="bpConfig.show" @close="closeIntro"></bpcharactercard>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { computed, markRaw, nextTick, reactive, ref } from "vue";
import bpPackBg from "./components/bpPackBg.vue";
import bpBottom from "./components/bpBottom.vue";
import bpcharacterBg from "./components/bpcharacterBg.vue";
import bpIntro from "./components/bpIntro.vue";
import bpExplans from "./components/bpExplans.vue";
import bpMode from "./components/bpMode.vue";
import bpcharactercard from "../charactercard/index.vue";
import type { BanInfo, BpConfig } from "../type.d";

let close = () => {
	game.resume2();
	ui.click.wuyu_bpClose();
	delete ui.click.wuyu_bpClose;
};

let bpInfo = {
	all: [],
};
let bpConfig: BpConfig = reactive({
	showPack: "pack",
	current: "",
	search: "",
	show: "",
	ban: false,
	noban: false,
	intro: "caocao",
});

let search = target => {
	bpConfig.search = target.innerText.trim();
};

let characterPack = Object.entries(lib.characterPack);
for (let [packx, charsObj] of characterPack) {
	let chars = Object.keys(charsObj);
	let info = {
		all: chars.slice(),
		allx: [],
		info: {},
	};
	bpInfo.all.addArray(chars);
	let list = chars;
	let sorts = lib.characterSort[packx];
	if (sorts) {
		let characterSort = Object.entries(sorts);
		for (let [sortx, charxs] of characterSort) {
			info.info[sortx] = charxs;
			list.removeArray(charxs);
			info.allx.push(sortx);
		}
		if (list.length) {
			info.allx.push("其他");
			info.info["其他"] = list;
		}
		bpInfo[packx] = info;
	} else {
		info.allx.push("其他");
		info.info["其他"] = list;
		bpInfo[packx] = info;
	}
}

let config = lib.config.extension_无语包_wybp;
let banInfo: BanInfo = reactive({
	plan: config.plan,
	plans: config.plans,
	char: config[config.plan].slice(),
	current: "standard",
});
let current = ref("standard");

let sorts = computed(() => {
	return Object.keys(bpInfo[banInfo.current].info);
});

let changePs = name => {
	if (bpConfig.ban) {
		if (bpConfig.showPack == "pack") {
			let list = bpInfo[name].all;
			if (list.some(item => banInfo.char.includes(item))) {
				banInfo.char.removeArray(list);
			} else {
				banInfo.char.addArray(list);
			}
		} else {
			let list = bpInfo[banInfo.current].info[name];
			if (list.some(item => banInfo.char.includes(item))) {
				banInfo.char.removeArray(list);
			} else {
				banInfo.char.addArray(list);
			}
		}
	} else {
		current.value = name;
		if (bpConfig.showPack == "pack") {
			if (banInfo.current != name) {
				banInfo.current = name;
			}
		} else if (bpConfig.current != name) {
			bpConfig.current = name;
		} else {
			bpConfig.current = "";
		}
	}
};

let togglePs = () => {
	if (bpConfig.showPack == "pack") {
		bpConfig.current = "";
		current.value = "";
		nextTick(() => {
			document.querySelector(".wy--sort").scrollTop = 0;
		});
		bpConfig.showPack = "sort";
	} else {
		current.value = banInfo.current;
		bpConfig.showPack = "pack";
	}
};

let showChars = computed(() => {
	if (bpConfig.search.length) {
		return bpInfo.all.filter(char => get.plainText(get.slimName(char)).includes(bpConfig.search));
	}
	let obj = bpInfo[banInfo.current];
	if (bpConfig.showPack == "sort" && bpConfig.current.length) {
		return obj.info[bpConfig.current];
	} else {
		return obj.all;
	}
});

let ban = name => {
	if (bpConfig.intro != name) {
		bpConfig.intro = name;
	}
	if (bpConfig.noban) {
		return;
	}
	if (banInfo.char.includes(name)) {
		banInfo.char.remove(name);
	} else {
		banInfo.char.push(name);
	}
};

let infoShow = ref("intro");
let showInfo = {
	intro: {
		show: markRaw(bpIntro),
		props: {
			bpConfig: bpConfig,
		},
		emit: {},
	},
	explan: {
		show: markRaw(bpExplans),
		props: {
			banInfo: banInfo,
		},
		emit: {
			changePlanName(plan, name) {
				banInfo.plans[plan] = name;
				config.plans[plan] = name;
				game.saveExtensionConfig("无语包", "wybp", config);
			},
			changePlan(plan) {
				banInfo.plan = plan;
				banInfo.char = config[plan];
				config.plan = plan;
				game.saveExtensionConfig("无语包", "wybp", config);
			},
			createPlan(name) {
				let num = Object.keys(banInfo.plans).length;
				let newPlan = "plan" + num;
				banInfo.plans[newPlan] = name;
				config.plans[newPlan] = name;
				config[newPlan] = [];
				game.saveExtensionConfig("无语包", "wybp", config);
			},
			delPlan(plan) {
				let list = Object.keys(banInfo.plans);
				let index = list.indexOf(plan);
				for (let key in banInfo.plans) {
					let num = list.indexOf(key);
					let tran = banInfo.plans[key];
					let char = config[key].slice();
					if (num >= index) {
						delete banInfo.plans[key];
						delete config.plans[key];
						delete config[plan];
					}
					if (num > index) {
						let newPlan = "plan" + (num - 1);
						banInfo.plans[newPlan] = tran;
						config.plans[newPlan] = tran;
						config[newPlan] = char;
					}
				}
				game.saveExtensionConfig("无语包", "wybp", config);
			},
		},
	},
	exmode: {
		show: markRaw(bpMode),
		props: {
			bpConfig: bpConfig,
		},
		emit: {
			changeBan() {
				if (bpConfig.ban) {
					bpConfig.ban = false;
				} else {
					bpConfig.ban = true;
				}
			},
			noban() {
				if (bpConfig.noban) {
					bpConfig.noban = false;
				} else {
					bpConfig.noban = true;
				}
			},
		},
	},
};
let changeIntro = key => {
	if (infoShow.value == key) {
		infoShow.value = "intro";
	} else {
		infoShow.value = key;
	}
};

let showIntro = name => {
	bpConfig.intro = name;
	bpConfig.show = name;
};

let closeIntro = () => {
	bpConfig.show = "";
};
</script>
