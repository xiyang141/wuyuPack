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
import { reactive, provide, onUpdated, onMounted, computed } from "vue";
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

let skins = [current.show];
let info = dynamic[props.show],
	skinMap = [];
skinMap.push({
	name: "经典形象",
	path: props.show,
	skins: [current.show].concat(lib.characterSubstitute[props.show]?.map(skin => `url(${lib.assetURL}image/character/${skin[0]}.jpg)`) || []),
});
for (let skin in info) {
	let now = info[skin];
	skinMap.push(now);
	if (now.ext) {
		skins.push(`url(${now.path}${now.ext})`);
	} else {
		skins.push("dynamic");
	}
}
let rSkins = computed(() => {
	let now = skinMap[current.skin]?.skins || [];
	if (Array.isArray(now)) {
		return now;
	} else {
		let num = Object.keys(now).length;
		return Array(num).fill("dynamic");
	}
});
let audioMap = new Map();
for (let skill of skills) {
	let audioList = get.Audio.skill({
		skill: skill,
		player: {
			playername: props.show,
		},
	});
	console.log(audioList);
}
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
	console.log(current.mode);
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
			current.show = skins[index];
		}
	}
};
</script>
