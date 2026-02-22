<template>
	<div class="wy-areaBg__packBg">
		<div
			v-for="(key, index) in list"
			class="wy-areaBg__pack"
			@click="changePack(key)"
			:class="{ 'wy--ban': banList.includes(key), 'wy--active': current == key }"
			v-html="get.translation(key + '_character_config')"
		></div>
	</div>
</template>
<script setup lang="ts">
	import { lib, game, ui, get, ai, _status } from 'noname';
	import { onMounted, ref, nextTick } from 'vue';

	let list = ref(Object.keys(lib.characterPack));
	let index = list.value.findIndex((item) => item == 'standard');
	list.value = list.value.slice(index).concat(list.value.slice(0, index));
	let current = ref('standard');
	let emit = defineEmits(['changePack']);
	defineProps(['banList']);

	let changePack = (pack) => {
		current.value = pack;
		emit('changePack', pack);
		nextTick(() => {
			document.querySelector('.wy-charBg').scrollTop = 0;
		});
	};

	onMounted(() => {
		emit('changePack', 'standard');
	});
</script>
