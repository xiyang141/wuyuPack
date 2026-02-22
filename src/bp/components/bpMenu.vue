<template>
	<div class="wy__close" @click="close()"></div>
</template>
<script setup lang="ts">
	import { lib, game, ui, get, ai, _status } from 'noname';
	let close = () => {
		game.pause2();
		ui.click.wuyu_bpClose();
		delete ui.click.wuyu_bpClose;
	};
</script>
