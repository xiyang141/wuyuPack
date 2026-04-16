<template>
	<div class="wy-charInfoBg wy--intro">
		<div class="wy-intro__base">
			<div class="wy-intro__base--img"></div>
			<div class="wy-intro__base--name" v-html="get.slimName(props.bpConfig.intro)"></div>
			<div class="wy-intro__base--hpLine" v-for="item in current.hp">
				<div class="wy-intro__base--hp"></div>
				<div class="wy-intro__base--hpNum">x {{ item[0] }}/{{ item[1] }}</div>
			</div>
			<div class="wy-intro__base--group">
				<div
					class="wy-intro__base--groupName"
					:style="{
						color: current.color,
					}"
				>
					{{ current.group }}
				</div>
			</div>
		</div>
		<div class="wy-intro__skills">
			<div class="wy-intro__skill" v-for="item in current.skills">
				<div class="wy-intro__skill--intro wy--name">{{ get.translation(item) }}</div>
				<div class="wy-intro__skill--intro">{{ get.skillInfoTranslation(item, false, true) }}</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { lib, game, ui, get, ai, _status } from "noname";
import { computed, onUpdated, onActivated } from "vue";
import type { BpConfig } from "../../type.d";

const props = defineProps<{
	bpConfig: BpConfig;
}>();

const current = computed(() => {
	const name = props.bpConfig.intro;
	const info = get.character(name);
	const obj = {
		hp: [],
		group: get.translation(info.group),
		color: get.translation(info.group + "Color"),
		skills: info.skills,
	};
	obj.hp.push([info.hp, info.maxHp]);
	//@ts-ignore	
	if (info.hp2) {
		//@ts-ignore
		const max = info.maxHp2 || info.hp;
		//@ts-ignore
		obj.hp.push([info.hp2, max]);
	}
	return obj;
});

const update = () => {
	document.querySelector(".wy-intro__base--img").setBackground(props.bpConfig.intro, "character");
};

onActivated(() => {
	update();
});

onUpdated(() => {
	update();
});
</script>
