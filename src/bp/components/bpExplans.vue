<template>
	<div class="wy-charInfoBg wy--explan">
		<input
			class="wy-explan wy-explan--input"
			placeholder="新建方案"
			type="text"
			@keyup.enter="createPlan($event.currentTarget)"
			@blur="createPlan($event.currentTarget)"
		/>
		<div @click="changePlan(plan)" class="wy-explan" v-for="(tarn, plan) in props.banInfo.plans">
			<div v-if="props.banInfo.plan == plan" class="wy--using"></div>
			<input
				class="wy-bpBottom__button--planText"
				:class="{ 'wy--noEdit': editing != plan }"
				:value="tarn"
				:readonly="editing != plan"
				@keyup.enter="changePlanName(plan, $event.currentTarget)"
				@blur="changePlanName(plan, $event.currentTarget)"
			/>
			<div class="wy-bpBottom__button--changeName" @click.stop="editName(plan, $event.currentTarget)"></div>
			<div class="wy-bpBottom__button--delPlan" @click.stop="delPlan(plan)"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { BanInfo } from "../../type.d";

let props = defineProps<{
	banInfo: BanInfo;
}>();
let emit = defineEmits<{
	changePlan: [plan: string];
	createPlan: [name: string];
	changePlanName: [plan: string, name: string];
	delPlan: [plan: string];
}>();
let editing = ref("");

let changePlan = plan => {
	emit("changePlan", plan);
};

let createPlan = target => {
	if (target.value.trim() != "") {
		emit("createPlan", target.value.trim());
		nextTick(() => {
			target.value = "";
		});
	}
};

let editName = (plan, target) => {
	editing.value = plan;
	target.previousElementSibling.focus();
};
let changePlanName = (plan, target) => {
	console.log("hhh");
	if (target.value.trim() != "") {
		emit("changePlanName", plan, target.value.trim());
		editing.value = "";
	}
};

let delPlan = plan => {
	if (plan == props.banInfo.plan) {
		return;
	}
	emit("delPlan", plan);
};
</script>
