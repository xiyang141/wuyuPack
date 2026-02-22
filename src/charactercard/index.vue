<template>
	<div class="wy-charactercardBg">
		<div class="wy-charactercardBg__characterName">
			<div class="wy-charactercardBg__characterName--prefix" v-html="getPrefix(props.show)"></div>
			<div class="wy-charactercardBg__characterName--name">{{ get.rawName(props.show) }}</div>
			<div class="wy-charactercardBg__characterName--tilte">{{ get.characterTitle(props.show) }}</div>
		</div>
		<div class="wy-charactercardBg__character">
			<div class="wy-charactercardBg__character--char" ref="character"></div>
		</div>
		<div class="wy-charactercardBg__buttons">
			<div
				v-for="(item, index) in buttons"
				:class="{
					'wy--active': currentButton == index,
				}"
				class="wy-charactercardBg__button"
				@click="changgeInfo(index)"
			>
				{{ item }}
			</div>
		</div>
		<div class="wy-charactercardBg__skillSkin">
			<component :is="infoList[currentButton]" :currentChar="props.show"></component>
			<div class="wy-charactercardBg__skillSkin--skin">
				<div class="wy-charactercardBg__skillSkin--dynamic" v-for="item in skinList"></div>
			</div>
		</div>
		<div class="wy-charactercardBg__rSkin">
			<div class="wy-charactercardBg__rSkin--skin" v-for="item in skins"></div>
		</div>
		<div class="wy-charactercardBg__close" @click="close"></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { onMounted, ref, markRaw, reactive, onUpdated } from "vue";
import charSkill from "./charSkill.vue";
import charVoice from "./charVoice.vue";
import charIntro from "./charIntro.vue";

let props = defineProps(["show"]);
let character = ref();
let buttons = ["技能", "台词", "简介"];
let currentButton = ref(0);
let infoList = [charSkill, charVoice, charIntro];

let emit = defineEmits(["close"]);

let getPrefix = str => {
	if (lib.translate[`${str}_prefix`]) {
		let prefixList = lib.translate[str + "_prefix"].split("|");
		return `${prefixList.map(prefix => get.prefixSpan(prefix, str), "").join("")}`;
	}
	return "";
};

let changgeInfo = button => {
	currentButton.value = button;
};

let skinList = [markRaw(props.show)];
let skins = reactive([]);
let close = () => {
	emit("close");
};

onMounted(() => {
	character.value.setBackground(props.show, "character");
	skins.push(markRaw(props.show));
	if (lib.characterSubstitute[props.show]) {
		skins.addArray(lib.characterSubstitute[props.show]?.map(skin => skin[0]));
	}
	Array.from(document.querySelectorAll(".wy-charactercardBg__skillSkin--dynamic")).forEach((dynamic, index) =>
		dynamic.setBackground(skinList[index], "character")
	);
});

onUpdated(() => {
	Array.from(document.querySelectorAll(".wy-charactercardBg__rSkin--skin")).forEach((dynamic, index) => {
		console.log(skins);
		dynamic.setBackground(skins[index], "character");
	});
});
</script>
