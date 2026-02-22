<template>
	<div class="wy-charBg">
		<div class="wy-charBg__sort--line">
			<div class="wy-charBg__sort--pack">开启</div>
			<div
				class="wy-charBg__sort--sort"
				:class="{ 'wy--off': props.banInfo.pack.includes(props.banInfo.current) }"
				@click="wy_toggle_pack()"
			></div>
		</div>
		<div v-for="(sort, index) in props.current" class="wy-charBg__sort">
			<div class="wy-charBg__sort--line">
				<div v-html="get.translation(sort[0])" class="wy-charBg__sort--pack"></div>
				<div
					class="wy-charBg__sort--sort"
					:class="{ 'wy--off': props.banInfo.sort.includes(sort[0]) }"
					@click="wy_toggle_sort(sort, $event)"
				></div>
			</div>
			<div v-for="char in sort[1]" class="wy-charBg__charbk">
				<div class="wy-charBg__charbk--name" v-html="get.slimName(char)"></div>
				<div
					class="wy-charBg__charbk--lock"
					:class="{ 'wy--bp': props.banInfo.char.includes(char) }"
				></div>
				<div
					class="wy-charBg__charbk--img"
					:data-char="char"
					@click="wy_toggle_char(char, sort)"
					@[infoClick]="createInfo(char)"
				></div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { lib, game, ui, get, ai, _status } from 'noname';
	import { ref, nextTick, onMounted, onUpdated, onUnmounted } from 'vue';

	let infoClick = 'ontouchstart' in window ? 'touchstart' : 'contextmenu';

	let props = defineProps(['current', 'banInfo']);

	let emit = defineEmits(['changeChar', 'changeSort', 'changePack', 'show']);

	let clickTarget = [],
		clickTimer;

	let createInfo = (char) => {
		if (infoClick == 'touchstart') {
			if (clickTarget[0] == char) {
				emit('show', char);
				clickTarget = [];
				clearTimeout(clickTimer);
			}
		} else {
			emit('show', char);
		}
	};

	let wy_toggle_char = (char, sort) => {
		if (clickTarget[0] && clickTarget[0] != char) {
			emit('changeChar', clickTarget[0], clickTarget[1]);
			setTimeout((charx, sortx) => emit('changeChar', charx, sortx), 50, char, sort);
			clickTarget = [];
			clearTimeout(clickTimer);
		} else {
			clickTarget = [char, sort];
			clickTimer = setTimeout(
				(charx, sortx) => {
					if (clickTarget[0]) {
						emit('changeChar', charx, sortx);
						clickTarget = [];
					}
				},
				200,
				char,
				sort
			);
		}
	};

	let wy_toggle_sort = (sort, event) => {
		emit('changeSort', sort);
	};

	let wy_toggle_pack = () => {
		let open = props.banInfo.pack.includes(props.banInfo.current);
		emit('changePack', open);
	};

	let observe = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.setBackground(entry.target.dataset.char, 'character');
					observe.unobserve(entry.target);
				}
			});
		},
		{
			rootMargin: '80px',
		}
	);

	let update = () => {
		observe.disconnect();
		Array.from(document.querySelectorAll('.wy-charBg__charbk--img')).forEach((target) =>
			observe.observe(target)
		);
	};

	onMounted(() => {
		update();
	});

	onUpdated(() => {
		nextTick(() => update());
	});

	onUnmounted(() => {
		observe.disconnect();
		clearTimeout(clickTimer);
	});
</script>
