<template>
	<div class="wy-charactercardBg__skillSkin--skill">
		<div class="wy-charactercardBg__intro" v-html="props.intro"></div>
		<div class="wy-charactercardBg__append"><div v-html="props.appendStr"></div></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";

let props = defineProps<{
	intro: string;
	appendStr: string;
}>();
</script>
