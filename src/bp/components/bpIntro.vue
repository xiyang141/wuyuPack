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

let props = defineProps<{
	bpConfig: BpConfig;
}>();

let current = computed(() => {
	let name = props.bpConfig.intro;
	let info = get.character(name);
	let obj = {
		hp: [],
		group: get.translation(info.group),
		color: get.translation(info.group + "Color"),
		skills: info.skills,
	};
	obj.hp.push([info.hp, info.maxHp]);
	if (info.hp2) {
		let max = info.maxHp2 || info.hp;
		obj.hp.push([info.hp2, max]);
	}
	return obj;
});

let update = () => {
	document.querySelector(".wy-intro__base--img").setBackground(props.bpConfig.intro, "character");
};

onActivated(() => {
	update();
});

onUpdated(() => {
	update();
});
</script>
