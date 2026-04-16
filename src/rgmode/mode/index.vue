<template>
	<div class="wy-modeBg__game" @click="Start">开始游戏</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";

const gameStart = () => {
	game.wyrging(true);
};

const Start = () => {
	_status.wyrgMode.close();
	gameStart();
};
</script>
