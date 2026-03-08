<template>
	<div class="wy-charactercardBg__characterName">
		<div class="wy-charactercardBg__characterName--prefix" v-html="info.prefix"></div>
		<div class="wy-charactercardBg__characterName--name">{{ info.rawName }}</div>
		<div class="wy-charactercardBg__characterName--tilte">{{ info.tilte }}</div>
	</div>
	<div class="wy-charactercardBg__character">
		<div
			class="wy-charactercardBg__character--char"
			:style="{
				backgroundImage: info.show.show,
			}"
			@[hch]="toggle"
		></div>
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
		<KeepAlive>
			<component :is="infoList[currentButton]" v-bind="dataList[currentButton]"></component>
		</KeepAlive>
		<div class="wy-charactercardBg__skillSkin--skin">
			<div
				class="wy-charactercardBg__skillSkin--char"
				v-for="(item, index) in info.skins"
				:class="{
					'wy--active': info.show.skin == index,
				}"
			>
				<div
					class="wy-charactercardBg__skillSkin--dynamic"
					:style="{
						backgroundImage: item == 'dynamic' ? 'none' : item,
					}"
					@click="changeSkin(index, false)"
				></div>
			</div>
		</div>
	</div>
	<div class="wy-charactercardBg__rSkin">
		<div
			class="wy-charactercardBg__rSkin--char"
			v-for="(item, index) in info.rSkins.value"
			:class="{
				'wy--active': info.show.rSkin == index,
			}"
		>
			<div
				class="wy-charactercardBg__rSkin--skin"
				:style="{
					backgroundImage: item == 'dynamic' ? 'none' : item,
				}"
				@click="changeSkin(index, true)"
			></div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { inject, ref } from "vue";
import charSkill from "./charSkill.vue";
import charVoice from "./charVoice.vue";
import charIntro from "./charIntro.vue";
import type { CardInfo } from "../type";

let emit = defineEmits<{
	changeSkin: [name: number, rSkin: boolean];
	toggle: [];
}>();

let hch = "ontouchstart" in window ? "dblclick" : "contextmenu";

let info: CardInfo = inject("info");

let buttons = ["技能", "台词", "简介"];
let currentButton = ref(0);
let infoList = [charSkill, charVoice, charIntro];
let dataList = [
	{ skills: info.show.skills },
	{
		skills: info.show.skills,
	},
	{
		intro: info.show.intro,
		appendStr: info.show.appendStr,
	},
];

let toggle = () => {
	emit("toggle");
};

let changgeInfo = button => {
	currentButton.value = button;
};

let changeSkin = (item, rSkin) => {
	emit("changeSkin", item, rSkin);
};
</script>
