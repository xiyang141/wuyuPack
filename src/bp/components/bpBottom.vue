<template>
	<div class="wy-bpBottom">
		<div class="wy-bpBottom__button" @click="toggle()">
			<div class="wy-bpBottom__button--text">切换分包</div>
			<div class="wy-bpBottom__button--manage wy--left" @click.stop="exmode()"></div>
		</div>
		<div class="wy-bpBottom__button">
			<div class="wy-bpBottom__button--text">AI禁用</div>
			<div class="wy-bpBottom__button--manage wy--right" @click.stop="explan()"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
let emit = defineEmits<{
	togglePs: [];
	changeIntro: [explan: string];
}>();

let toggle = () => {
	emit("togglePs");
};

let explan = () => {
	emit("changeIntro", "explan");
};

let exmode = () => {
	emit("changeIntro", "exmode");
};
</script>
