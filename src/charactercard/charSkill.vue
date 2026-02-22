<template>
	<div class="wy-charactercardBg__skillSkin--skill">
		<div class="wy-charactercardBg__skill--buttons">
			<div
				class="wy-charactercardBg__skill--button"
				v-for="item in skillList"
				:class="{
					'wy--active': item == currentSkill,
				}"
				@click="changeSkill(item)"
			>
				{{ get.translation(item) }}
			</div>
		</div>
		<div
			:class="{
				'wy--trigger': trigger,
				'wy--enable': !trigger,
			}"
		></div>
		<div class="wy-charactercardBg__skill--info">{{ get.skillInfoTranslation(currentSkill) }}</div>
		<div class="wy-charactercardBg__skill--poptip" v-if="faq" v-html="faq"></div>
		<div class="wy-charactercardBg__skill--poptip" v-for="poptip in poptips" v-html="poptip"></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { computed, ref } from "vue";

let props = defineProps(["currentChar"]);
let skillList = get.character(props.currentChar, 3);
let currentSkill = ref(skillList[0]);
let trigger = ref(get.info(currentSkill.value).trigger);

let poptips = computed(() => {
	let str = get.skillInfoTranslation(currentSkill.value, null, false);
	let poptipMap = str.matchAll(/poptip = ([^>\s]+)/g);
	return [...poptipMap].map(poptip => `${get.poptip(poptip[1])} : ${lib.poptip.getInfo(poptip[1])}`);
});

let faq = computed(() => {
	let info = lib.translate[currentSkill.value + "_faq"];
	if (info) {
		return `${get.translation(currentSkill.value + "_faq")} : ${lib.translate[currentSkill.value + "_faq_info"]}`;
	}
	return false;
});

let changeSkill = skill => {
	currentSkill.value = skill;
	trigger.value = get.info(skill)?.trigger;
};
</script>
