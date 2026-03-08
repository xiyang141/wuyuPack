<template>
	<div class="wy-charactercardBg__characterName">
		<div class="wy-charactercardBg__characterName--prefix" v-html="info.prefix"></div>
		<div class="wy-charactercardBg__characterName--name">{{ info.rawName }}</div>
		<div class="wy-charactercardBg__characterName--tilte">{{ info.tilte }}</div>
	</div>
	<div class="wy-charactercardBg__character wy--bCard">
		<div
			class="wy-charactercardBg__character--char"
			:style="{
				backgroundImage: info.show.show,
			}"
			@[hch]="toggle"
		></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { inject, ref } from "vue";
import type { CardInfo } from "../type";

let emit = defineEmits<{
	changeSkin: [name: number, rSkin: boolean];
	toggle: [];
}>();

let hch = "ontouchstart" in window ? "dblclick" : "contextmenu";

let info: CardInfo = inject("info");

let toggle = () => {
	emit("toggle");
};

let changeSkin = (item, rSkin) => {
	emit("changeSkin", item, rSkin);
};
</script>
