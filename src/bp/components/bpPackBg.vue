<template>
	<div class="wy-areaBg__packBg" v-show="props.showPack == 'pack'">
		<div
			v-for="pack in packs"
			class="wy-areaBg__pack"
			:class="{
				'wy--active': current == pack,
			}"
			@click="change(pack)"
			v-html="get.translation(pack + '_character_config')"
		></div>
	</div>
	<div class="wy-areaBg__packBg wy--sort" v-show="props.showPack == 'sort'">
		<div
			v-for="sort in sorts"
			:class="{
				'wy--active': current == sort,
			}"
			@click="change(sort)"
			class="wy-areaBg__pack"
			v-html="get.translation(sort)"
		></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";

const props = defineProps<{
	banchars: string[];
	showPack: string;
	sorts: string[];
	current: string;
}>();
const emit = defineEmits<{
	changePs: [name: string];
}>();

const packsx = Object.keys(lib.characterPack);
const index = packsx.indexOf("standard");
const packs = packsx.slice(index).concat(packsx.slice(0, index).reverse());

const change = name => {
	emit("changePs", name);
};
</script>
