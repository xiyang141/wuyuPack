<template>
	<div class="wy-charInfoBg wy--explan">
		<div
			class="wy-explan"
			:class="{
				'wy--active': props.bpConfig.ban,
			}"
			@click="change()"
		>
			<div class="wy-bpBottom__button--planText">禁用分包</div>
		</div>
		<div
			class="wy-explan"
			:class="{
				'wy--active': props.bpConfig.noban,
			}"
			@click="noban()"
		>
			<div class="wy-bpBottom__button--planText">查看详情</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import type { BpConfig } from "../../type.d";
let props = defineProps<{
	bpConfig: BpConfig;
}>();
let emit = defineEmits<{
	changeBan: [];
	noban: [];
}>();

let change = () => {
	emit("changeBan");
};

let noban = () => {
	emit("noban");
};
</script>
