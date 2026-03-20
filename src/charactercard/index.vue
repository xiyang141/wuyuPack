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

let props = defineProps<{ show: string }>();
let emit = defineEmits<{
	close: [];
}>();

let info = lib.wySkin.getSkin(props.show);

let nav = info.nav,
	skinList = info.skin,
	rSkinList = info.skins,
	yhList = info.yh;

let character = get.character(props.show);
let skills = character.skills;
let intro = get.characterIntro(props.show);
let appendStr = lib.characterAppend[props.show] || "";

let current = reactive({
	show: `url(${skinList[0]})`,
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

let skins = computed(() => {
	if (current.mode == 0) {
		current.show = skinList[current.skin];
		return skinList;
	} else {
		current.show = yhList[current.skin];
		console.log(yhList);
		return yhList;
	}
});

let rSkins = computed(() => {
	let now = rSkinList[nav[current.skin]] || [];
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
