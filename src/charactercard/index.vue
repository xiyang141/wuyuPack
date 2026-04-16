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

let skinList = info.skin,
	rSkinList = info.rskin,
	yuanhuaList = info.yuanhua;
let skinListx = Object.values(rSkinList).map(arr => arr[0]),
	skinListy = Object.values(yuanhuaList).map(arr => arr[0]);

let character = get.character(props.show);
let skills = character.skills;
let intro = get.characterIntro(props.show);
let appendStr = lib.characterAppend[props.show] || "";

let current = reactive({
	show: skinListx[0],
	curr: skinList[0],
	skin: 0,
	rskin: 0,
	mode: 0,
	skills: skills,
	intro: intro,
	appendStr: appendStr,
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
		return skinListx;
	} else {
		return skinListy;
	}
});

let rSkins = computed(() => {
	if (current.mode == 0) {
		return rSkinList[current.curr];
	} else {
		return yuanhuaList[current.curr];
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
		current.show = rSkinList[current.curr][index];
		current.rskin = index;
	} else {
		current.show = skinListx[index];
		current.skin = index;
		current.curr = skinList[index];
	}
};
</script>
