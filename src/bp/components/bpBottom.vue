<template>
	<div class="wy-bpBottom">
		<div
			class="wy-bpBottom__button"
			@click="changeBan_forbid()"
			:class="{ 'wy--active': current == 'forbid' }"
		>
			<div class="wy-bpBottom__button--text">仅点将可用</div>
		</div>
		<div
			class="wy-bpBottom__button"
			@click="changeBan_ai()"
			:class="{ 'wy--active': current == 'ai' }"
		>
			<div class="wy-bpBottom__button--text">AI禁用</div>
		</div>
		<div
			class="wy-bpBottom__button"
			@click="changeBan_plan()"
			:class="{ 'wy--active': current == 'plan' }"
		>
			<div class="wy-bpBottom__button--text">
				{{ props.banInfo.plans[currentPlan] }}
			</div>
			<div class="wy-bpBottom__button--manage" @click.stop="expandPlans"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { ref } from 'vue';

	let current = ref('plan');
	let props = defineProps(['banInfo', 'currentPlan']);
	let emit = defineEmits(['changeBan', 'expandPlans']);

	let changeBan_forbid = () => {
		current.value = 'forbid';
		emit('changeBan', 'forbid');
	};
	let changeBan_ai = () => {
		current.value = 'ai';
		emit('changeBan', 'ai');
	};
	let changeBan_plan = () => {
		current.value = 'plan';
		emit('changeBan', props.currentPlan);
	};
	let expandPlans = () => {
		emit('expandPlans');
	};
</script>
