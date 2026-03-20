<template>
	<div class="wy-modeBg__game" @click="Start">开始游戏</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";

let gameStart = () => {
	game.wyrging(true);
};

let Start = () => {
	_status.wyrgMode.close();
	gameStart();
};
</script>
