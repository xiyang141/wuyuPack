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
const props = defineProps<{
	bpConfig: BpConfig;
}>();
const emit = defineEmits<{
	changeBan: [];
	noban: [];
}>();

const change = () => {
	emit("changeBan");
};

const noban = () => {
	emit("noban");
};
</script>
