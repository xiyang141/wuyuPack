<template>
	<div class="wy-charactercardBg__skillSkin--skill">
		<div class="wy-charactercardBg__skill--buttons">
			<div
				class="wy-charactercardBg__skill--button"
				v-for="item in props.skills"
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
				'wy--trigger': skillTrigger,
				'wy--enable': !skillTrigger,
			}"
			v-show="currentSkill"
		></div>
		<div class="wy-charactercardBg__skill--info">{{ get.skillInfoTranslation(currentSkill) }}</div>
		<div class="wy-charactercardBg__skill--poptip" v-if="faq" v-html="faq"></div>
		<div class="wy-charactercardBg__skill--poptip" v-for="poptip in poptips" v-html="poptip"></div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { computed, ref } from "vue";

let props = defineProps<{
	skills: string[];
}>();
let currentSkill = ref(props.skills[0]);
let skillTrigger = ref(get.info(currentSkill.value)?.trigger);

let poptipTrans = str => {
	let list = [];
	let poptipMap = [...str.matchAll(/poptip = ([^>\s]+)/g)];
	let names = poptipMap.map(poptip => lib.poptip.getName(poptip[1]));
	let infos = poptipMap.map(poptip => get.plainText(lib.poptip.getInfo(poptip[1])));
	names.forEach((name, index) => {
		list.push(`${name}: ${infos[index]}`);
	});
	infos.forEach(info => {
		list.addArray(poptipTrans(info));
	});
	return list;
};

let poptips = computed(() => {
	let str1 = get.skillInfoTranslation(currentSkill.value, null, false);
	let pop1 = poptipTrans(str1);
	let str2 = get.translation(currentSkill.value + "_faq_info");
	let pop2 = poptipTrans(str2);
	return pop1.concat(pop2).unique();
});

let faq = computed(() => {
	if (lib.translate[currentSkill.value + "_faq"]) {
		let info = get.translation(currentSkill.value + "_faq");
		let intro = get.plainText(lib.translate[currentSkill.value + "_faq_info"]);
		return `${info} : ${intro}`;
	}
	return false;
});

let changeSkill = skill => {
	currentSkill.value = skill;
	skillTrigger.value = get.info(skill)?.trigger;
};
</script>
