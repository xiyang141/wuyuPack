<template>
	<div class="wy-charactercardBg">
		<KeepAlive>
			<component :is="cards[current.mode]" @changeSkin="changeSkin" @toggle="toggle"></component>
		</KeepAlive>
		<div class="wy-charactercardBg__close" @click="close"></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { reactive, provide, computed } from "vue";
import sCard from "./sCard.vue";
import bCard from "./bCard.vue";
import dynamic from "../skin/dynamic";

let props = defineProps<{ show: string }>();
let emit = defineEmits<{
	close: [];
}>();

let character = get.character(props.show);
let skills = character.skills;
let imgPath = character.img;
if (!imgPath) {
	imgPath = lib.assetURL + "image/character/" + props.show + ".jpg";
}
let intro = get.characterIntro(props.show);
let appendStr = lib.characterAppend[props.show] || "";

let current = reactive({
	show: `url(${imgPath})`,
	skills: skills,
	intro: intro,
	appendStr: appendStr,
	skin: 0,
	rSkin: 0,
	mode: 0,
});
let cards = [sCard, bCard];
let close = () => {
	emit("close");
};

let getPrefix = str => {
	if (lib.translate[`${str}_prefix`]) {
		let prefixList = lib.translate[str + "_prefix"].split("|");
		return `${prefixList.map(prefix => get.prefixSpan(prefix, str), "").join("")}`;
	}
	return "";
};

let skinList = [],
	yhList = [],
	skinMap = [];
if (_status.wySkin[props.show]) {
	let info = _status.wySkin[props.show];
	skinList = info.skinList;
	yhList = info.rSkinList;
	skinMap = info.skinMap;
} else {
	_status[props.show] = {};
	skinList.push(current.show);
	yhList.push("dynamic");
	let info = dynamic[props.show];
	skinMap.push({
		name: "经典形象",
		path: props.show,
		skins: [current.show].concat(lib.characterSubstitute[props.show]?.map(skin => `url(${lib.assetURL}image/character/${skin[0]}.jpg)`) || []),
	});
	for (let skin in info) {
		let now = info[skin];
		skinMap.push(now);
		if (now.ext) {
			skinList.push(`url(${now.path}${now.ext})`);
		} else {
			skinList.push("dynamic");
		}
		if (now.yh) {
			yhList.push(`url(${now.yhPath}${now.yh})`);
		} else {
			yhList.push("dynamic");
		}
	}
	_status[props.show].skinList = skinList;
	_status[props.show].yhList = yhList;
	_status[props.show].skinMap = skinMap;
}

let skins = computed(() => {
	if (current.mode == 0) {
		current.show = skinList[current.skin];
		return skinList;
	} else {
		current.show = yhList[current.skin];
		return yhList;
	}
});

let rSkins = computed(() => {
	let now = skinMap[current.skin]?.skins || [];
	if (Array.isArray(now)) {
		return now;
	} else {
		let num = Object.keys(now).length;
		return Array(num).fill("dynamic");
	}
});

provide("info", {
	prefix: getPrefix(props.show),
	rawName: get.rawName(props.show),
	tilte: get.characterTitle(props.show),
	skins: skins,
	rSkins: rSkins,
	show: current,
});
let toggle = () => {
	if (current.mode == 0) {
		current.mode = 1;
	} else {
		current.mode = 0;
	}
};
let changeSkin = (index, rSkin) => {
	if (rSkin) {
		if (current.rSkin != index) {
			current.rSkin = index;
			current.show = rSkins.value[index];
			skins[current.skin] = rSkins.value[index];
		}
	} else {
		if (current.skin != index) {
			current.skin = index;
			current.show = skins.value[index];
		}
	}
};
</script>
