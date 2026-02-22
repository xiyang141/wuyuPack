<template>
	<div class="wy-areaBg">
		<bpPackBg @changePack="updateBp" :banList="banInfo.pack"></bpPackBg>
		<bpMenu></bpMenu>
		<bpcharacterBg
			@changeChar="changeChar"
			@changeSort="changeSort"
			@changePack="changePack"
			@show="showcharactercard"
			:current="current"
			:banInfo="banInfo"
		></bpcharacterBg>
		<bpExplans
			:expand="expand"
			:banInfo="banInfo"
			:currentPlan="currentPlan"
			@changePlan="changePlan"
			@createPlan="createPlan"
			@changePlanName="changePlanName"
			@delPlan="delPlan"
		></bpExplans>
		<bpBottom :banInfo="banInfo" :currentPlan="currentPlan" @changeBan="changeBan" @expandPlans="expandPlans"> </bpBottom>
	</div>
	<live2dScene></live2dScene>
	<charactercard v-if="show.length" :show="show" @close="closecharctercard"></charactercard>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { ref, reactive, watch, onBeforeUnmount } from "vue";
import bpPackBg from "./bpPackBg.vue";
import bpMenu from "./bpMenu.vue";
import bpcharacterBg from "./bpcharacterBg.vue";
import bpBottom from "./bpBottom.vue";
import bpExplans from "./bpExplans.vue";
import charactercard from "../../charactercard/index.vue";
import live2dScene from "../../live2d/index.vue";

let show = ref("");

let info = get.copy(lib.config.extension_无语包_wybp);
let plan = info.plan;
let plans = info.plans;
let { char, sort, pack } = info[plan];

let banInfo = reactive({
	plan: plan,
	plans: plans,
	char: char,
	sort: sort,
	pack: pack,
	current: "",
});
let stopWatch = watch(banInfo, newVal => {
	let config = lib.config.extension_无语包_wybp[newVal.plan];
	if (config) {
		let { char: charx, sort: sortx, pack: packx } = newVal;
		info[newVal.plan].char = charx;
		info[newVal.plan].sort = sortx;
		info[newVal.plan].pack = packx;
		game.saveExtensionConfig("无语包", "wybp", get.copy(info));
		if (banInfo.plan == "forbid") {
			game.saveConfig("forbidai_user", charx);
		} else if (banInfo.plan != "ai") {
			for (let mode in lib.mode) {
				game.saveConfig(`${mode}_banned`, charx);
				game.saveConfig(`connect_${mode}_banned`, charx);
			}
		}
	}
});

let current = ref(new Map());
let expand = ref(false);
let currentPlan = ref(info.plan);

let characterMap = new Map();

for (let packx in lib.characterPack) {
	let pack = lib.characterPack[packx],
		sorts = lib.characterSort[packx],
		list = [],
		extra = [],
		packMap = new Map();
	for (let sort in sorts) {
		list.addArray(sorts[sort]);
		packMap.set(sort, sorts[sort]);
	}
	for (let char in pack) {
		if (!list.includes(char)) {
			extra.push(char);
		}
	}
	if (extra.length) {
		packMap.set("其他", extra);
	}
	characterMap.set(packx, packMap);
}

let updateBp = key => {
	banInfo.current = key;
	current.value = characterMap.get(key);
};

let changeChar = (char, sort) => {
	if (banInfo.char.includes(char)) {
		banInfo.char.remove(char);
		if (banInfo.sort.includes(sort[0])) {
			banInfo.sort.remove(sort[0]);
		}
		if (banInfo.pack.includes(banInfo.current)) {
			banInfo.pack.remove(banInfo.current);
		}
	} else {
		banInfo.char.push(char);
		if (sort[1].every(char => banInfo.char.includes(char))) {
			banInfo.sort.add(sort[0]);
		}
		if (Array.from(current.value.keys()).every(sort => banInfo.sort.includes(sort))) {
			banInfo.pack.add(banInfo.current);
		}
	}
};

let changeSort = sort => {
	if (banInfo.sort.includes(sort[0])) {
		banInfo.sort.remove(sort[0]);
		banInfo.char.removeArray(sort[1]);
		banInfo.pack.remove(banInfo.current);
	} else {
		banInfo.sort.push(sort[0]);
		banInfo.char.addArray(sort[1]);
		if (Array.from(current.value.keys()).every(sort => banInfo.sort.includes(sort))) {
			banInfo.pack.add(banInfo.current);
		}
	}
};

let changePack = open => {
	if (open) {
		banInfo.pack.remove(banInfo.current);
		banInfo.sort.removeArray(current.value.keys());
		banInfo.char.removeArray(Object.keys(lib.characterPack[banInfo.current]));
	} else {
		banInfo.pack.add(banInfo.current);
		banInfo.sort.addArray(current.value.keys());
		banInfo.char.addArray(Object.keys(lib.characterPack[banInfo.current]));
	}
};

let changeBan = planx => {
	let { char: charx, sort: sortx, pack: packx } = info[planx];
	banInfo.plan = planx;
	banInfo.char = charx;
	banInfo.sort = sortx;
	banInfo.pack = packx;
};

let expandPlans = () => {
	expand.value = expand.value ? false : true;
};

let changePlan = planx => {
	currentPlan.value = planx;
	info.plan = planx;
	game.saveExtensionConfig("无语包", "wybp", info);
	changeBan(planx);
};

let createPlan = name => {
	let newPlan = "plan" + Object.keys(banInfo.plans).length;
	banInfo.plans = {
		...banInfo.plans,
		[newPlan]: name,
	};
	info.plans[newPlan] = name;
	info[newPlan] = {
		char: [],
		sort: [],
		pack: [],
	};
	game.saveExtensionConfig("无语包", "wybp", info);
};

let changePlanName = (planx, name) => {
	info.plans[planx] = name;
	game.saveExtensionConfig("无语包", "wybp", info);
	banInfo.plans = {
		...banInfo.plans,
		[planx]: name,
	};
};

let resort = obj => {
	let newObj = get.copy(obj);
	let i = 0;
	for (let key in obj) {
		if (!["ai", "forbid", "plan", "plans"].includes(key)) {
			delete obj[key];
			obj[`plan${i}`] = newObj[key];
			i++;
		}
	}
};
let resortPlans = (obj, delCurr?) => {
	let newObj = get.copy(obj);
	let i = 0;
	for (let key in obj) {
		delete obj[key];
		obj[`plan${i}`] = newObj[key];
		if (delCurr && key == currentPlan.value) {
			currentPlan.value = `plan${i}`;
			if (delCurr > 1) {
				changeBan("plan0");
			}
		}
		i++;
	}
};

let delPlan = planx => {
	let delCurr = 1;
	if (planx == currentPlan.value) {
		currentPlan.value = "plan0";
		info.plan = "plan0";
		delCurr++;
	}
	delete info.plans[planx];
	delete info[planx];
	resortPlans(info.plans);
	resort(info);
	game.saveExtensionConfig("无语包", "wybp", info);
	let newInfo = get.copy(banInfo.plans);
	delete newInfo[planx];
	resortPlans(newInfo, delCurr);
	banInfo.plans = newInfo;
};

let showcharactercard = char => {
	show.value = char;
};

let closecharctercard = () => {
	show.value = "";
};
onBeforeUnmount(() => {
	stopWatch();
});
</script>
