<template>
	<div class="wy-explans" v-if="expand">
		<div
			@click="changePlan(planx, $event)"
			class="wy-explan"
			v-for="(plan, planx) in props.banInfo.plans"
		>
			<div v-if="props.currentPlan == planx" class="wy--using"></div>
			<input
				class="wy-bpBottom__button--planText"
				:class="{ 'wy--noEdit': current != planx }"
				:value="plan"
				:readonly="current != planx"
				@keyup.enter="changePlanName(planx, $event)"
				@blur="changePlanName(planx, $event)"
			/>
			<div class="wy-bpBottom__button--changeName" @click="editName(planx, $event)"></div>
			<div class="wy-bpBottom__button--delPlan" @click="delPlan(planx)"></div>
		</div>
		<input
			class="wy-explan wy-explan--input"
			placeholder="新建方案"
			type="text"
			@keyup.enter="createPlan($event)"
			@blur="createPlan($event)"
		/>
	</div>
</template>
<script setup lang="ts">
	import { ref, nextTick } from 'vue';

	let props = defineProps(['expand', 'banInfo', 'currentPlan']);
	let emit = defineEmits(['changePlan', 'createPlan', 'changePlanName', 'delPlan']);
	let current = ref('');

	let changePlan = (planx, event) => {
		if (event.target == event.currentTarget) {
			emit('changePlan', planx);
		}
	};

	let createPlan = (event) => {
		if (event.target.value.trim() != '') {
			emit('createPlan', event.target.value.trim());
			nextTick(() => {
				event.target.value = '';
			});
		}
	};

	let editName = (plan, event) => {
		current.value = plan;
		event.currentTarget.previousElementSibling.focus();
	};
	let changePlanName = (plan, event) => {
		if (event.target.value.trim() != '') {
			emit('changePlanName', plan, event.target.value.trim());
			current.value = '';
		}
	};

	let delPlan = (plan) => {
		if (Object.keys(props.banInfo.plans).length > 1) {
			emit('delPlan', plan);
		}
	};
</script>
