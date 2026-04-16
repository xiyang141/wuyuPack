<template>
	<div class="wy-charBg">
		<div v-for="char in all" class="wy-charBg__charbk" v-show="props.show.includes(char)">
			<div class="wy-charBg__charbk--name" v-html="get.slimName(char)"></div>
			<div class="wy-charBg__charbk--lock" :class="{ 'wy--bp': props.ban.includes(char) }"></div>
			<div class="wy-charBg__charbk--img" :data-char="char" @click="wy_toggle_char(char)" @[infoClick]="createInfo(char)"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { onMounted, onUnmounted } from "vue";

const infoClick = "ontouchstart" in window ? "touchstart" : "contextmenu";
const props = defineProps<{
	show: string[];
	ban: string[];
	all: string[];
}>();

const emit = defineEmits<{
	ban: [char: string];
	show: [char: string];
}>();

let clickTarget = "",
	clickTimer;

const createInfo = char => {
	if (infoClick == "touchstart") {
		if (clickTarget == char) {
			emit("show", char);
			clickTarget = "";
			clearTimeout(clickTimer);
		}
	} else {
		emit("show", char);
	}
};

const wy_toggle_char = char => {
	if (clickTarget && clickTarget != char) {
		emit("ban", clickTarget);
		setTimeout(charx => emit("ban", charx), 50, char);
		clickTarget = "";
		clearTimeout(clickTimer);
	} else {
		clickTarget = char;
		clickTimer = setTimeout(
			charx => {
				if (clickTarget[0]) {
					emit("ban", charx);
					clickTarget = "";
				}
			},
			200,
			char
		);
	}
};

const observe = new IntersectionObserver(
	entries => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.setBackground(entry.target.dataset.char, "character");
				observe.unobserve(entry.target);
			}
		});
	},
	{
		rootMargin: "80px",
	}
);

onMounted(() => {
	Array.from(document.querySelectorAll(".wy-charBg__charbk--img")).forEach(target => observe.observe(target));
});

onUnmounted(() => {
	observe.disconnect();
	clearTimeout(clickTimer);
});
</script>
