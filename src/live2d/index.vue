<template>
	<div class="live2d-scene" ref="canvas"></div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { lib, game, ui, get, ai, _status } from "noname";
import { loadOml2d } from "oh-my-live2d";

let canvas = ref();
let l2d, interval, num: number;

let emotion = () => {
	let model = l2d.models.model;
	if (model?.internalModel?.settings) {
		num = model.internalModel.settings.motions[""].length - 1;
		interval = setInterval(() => {
			model.motion("", get.rand(0, num));
		}, 3000);
	} else {
		requestAnimationFrame(emotion);
	}
};

onMounted(() => {
	l2d = loadOml2d({
		parentElement: canvas.value,
		dockedPosition: "right",
		menus: {
			disable: true,
		},
		stageStyle: {
			position: "relative",
			width: "100%",
			height: "100%",
			minHeight: "200px",
			minWidth: "200px",
			zIndex: 7,
		},
		mobileDisplay: true,
		models: [
			{
				motionPreloadStrategy: "ALL",
				scale: 0.1,
				path: lib.assetURL + "extension/无语包/src/live2d/assets/aidang_2/aidang_2.model3.json",
				position: [0, 100],
			},
		],
	});
	emotion();
});

onUnmounted(() => {
	clearInterval(interval);
});
</script>
