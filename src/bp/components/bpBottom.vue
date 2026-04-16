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
const emit = defineEmits<{
	togglePs: [];
	changeIntro: [explan: string];
}>();

const toggle = () => {
	emit("togglePs");
};

const explan = () => {
	emit("changeIntro", "explan");
};

const exmode = () => {
	emit("changeIntro", "exmode");
};
</script>
