<template>
	<div class="wy-areaBg">
		<div class="wy__close" @click="close()"></div>
		<div class="wy__search" contenteditable="true" @keyup.enter="search($event.currentTarget)" @blur="search($event.currentTarget)"></div>
		<bpPackBg :showPack="bpConfig.showPack" :banchars="banInfo.char" :sorts="sorts" :current="current" @changePs="changePs"></bpPackBg>
		<bpcharacterBg :show="showChars" :all="bpInfo.all" :ban="banInfo.char" @ban="ban" @show="showIntro"></bpcharacterBg>
		<bpBottom @togglePs="togglePs" @changeIntro="changeIntro"></bpBottom>
	</div>
	<KeepAlive exclude="bpIntro">
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

const close = () => {
	game.resume2();
	ui.click.wybpClose();
	delete ui.click.wybpClose;
};

const bpInfo = {
	all: [],
};
const bpConfig: BpConfig = reactive({
	showPack: "pack",
	current: "",
	search: "",
	show: "",
	ban: false,
	noban: false,
	intro: "caocao",
});

const search = target => {
	bpConfig.search = target.innerText.trim();
};

const characterPack = Object.entries(lib.characterPack);
for (const [packx, charsObj] of characterPack) {
	const chars = Object.keys(charsObj);
	const info = {
		all: chars.slice(),
		allx: [],
		info: {},
	};
	bpInfo.all.addArray(chars);
	const list = chars;
	const sorts = lib.characterSort[packx];
	if (sorts) {
		const characterSort: [string, string[]][] = Object.entries(sorts);
		for (const [sortx, charxs] of characterSort) {
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

const config = lib.config.extension_无语包_wybp;
const banInfo: BanInfo = reactive({
	plan: config.plan,
	plans: config.plans,
	char: config[config.plan].slice(),
	current: "standard",
});
const current = ref("standard");

const sorts = computed(() => {
	return Object.keys(bpInfo[banInfo.current].info);
});

const changePs = name => {
	if (bpConfig.ban) {
		if (bpConfig.showPack == "pack") {
			const list = bpInfo[name].all;
			if (list.some(item => banInfo.char.includes(item))) {
				banInfo.char.removeArray(list);
			} else {
				banInfo.char.addArray(list);
			}
		} else {
			const list = bpInfo[banInfo.current].info[name];
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

const togglePs = () => {
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

const showChars = computed(() => {
	if (bpConfig.search.length) {
		return bpInfo.all.filter(char => get.plainText(get.slimName(char)).includes(bpConfig.search));
	}
	const obj = bpInfo[banInfo.current];
	if (bpConfig.showPack == "sort" && bpConfig.current.length) {
		return obj.info[bpConfig.current];
	} else {
		return obj.all;
	}
});

const ban = name => {
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

const infoShow = ref("intro");
const showInfo = {
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
				const num = Object.keys(banInfo.plans).length;
				const newPlan = "plan" + num;
				banInfo.plans[newPlan] = name;
				config.plans[newPlan] = name;
				config[newPlan] = [];
				game.saveExtensionConfig("无语包", "wybp", config);
			},
			delPlan(plan) {
				const list = Object.keys(banInfo.plans);
				const index = list.indexOf(plan);
				for (const key in banInfo.plans) {
					const num = list.indexOf(key);
					const tran = banInfo.plans[key];
					const char = config[key].slice();
					if (num >= index) {
						delete banInfo.plans[key];
						delete config.plans[key];
						delete config[plan];
					}
					if (num > index) {
						const newPlan = "plan" + (num - 1);
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
const changeIntro = key => {
	if (infoShow.value == key) {
		infoShow.value = "intro";
	} else {
		infoShow.value = key;
	}
};

const showIntro = name => {
	bpConfig.intro = name;
	bpConfig.show = name;
};

const closeIntro = () => {
	bpConfig.show = "";
};
</script>
