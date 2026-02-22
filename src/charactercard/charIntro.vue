<template>
	<div class="wy-charactercardBg__skillSkin--skill wy-charactercardBg__intro">{{ get.characterIntro(props.currentChar) }}</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";

let props = defineProps(["currentChar"]);
</script>
