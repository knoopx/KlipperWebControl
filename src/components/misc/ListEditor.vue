<template>
	<v-layout row wrap>
		<template v-if="items.active !== undefined">
			<v-flex xs12 class="mt-3">
				<v-chip close v-for="(temp, index) in items.active" :key="temp" @input="removeActive(index)" @keyup.delete="removeActive(index)">
					{{ temp }} {{ unit }}
				</v-chip>
			</v-flex>
			<v-flex xs12>
				<v-layout row align-center>
					<v-flex>
						<v-text-field v-model.number="activeValue" type="number" min="-273" max="1999" :label="$t('input.addTemperature')" @keyup.enter="addActive"></v-text-field>

					</v-flex>
					<v-flex shrink>
						<v-btn color="primary" :disabled="!canAddActive" @click="addActive">
							<v-icon class="mr-1">add</v-icon> {{ $t('button.add.caption') }}
						</v-btn>
					</v-flex>
				</v-layout>
			</v-flex>
		</template>
		<template v-else>
			<v-flex xs12 class="mt-3">
				<v-chip close v-for="(temp, index) in items" :key="temp" @input="remove(index)" @keyup.delete="remove(index)">
					{{ temp }} {{ unit }}
				</v-chip>
			</v-flex>
			<v-flex xs12>
				<v-layout row align-center>
					<v-flex>
						<v-text-field v-if="temperature" v-model.number="value" type="number" min="-273" max="1999" :label="$t('input.addTemperature')" @keyup.enter="canAdd && add"></v-text-field>
						<v-text-field v-else v-model.number="value" type="number" min="0" :label="$t('input.addRPM')" @keyup.enter="canAdd && add"></v-text-field>
					</v-flex>
					<v-flex shrink>
						<v-btn color="primary" :disabled="!canAdd" @click="add">
							<v-icon class="mr-1">add</v-icon> {{ $t('button.add.caption') }}
						</v-btn>
					</v-flex>
				</v-layout>
			</v-flex>
		</template>
	</v-layout>
</template>

<script>
'use strict'

import { mapState, mapMutations } from 'vuex'

export default {
	props: {
		itemKey: String,
		temperature: Boolean
	},
	computed: {
		...mapState('machine', ['settings']),
		items() {
			if (this.settings[this.itemKey] !== undefined) {
				return this.settings[this.itemKey];
			}
			return this.settings.temperatures[this.itemKey];
		},
		unit() { return this.temperature ? 'C' : 'RPM'; },

		canAddActive() { return this.isNumber(this.activeValue) && this.items.active.indexOf(this.activeValue) === -1; },
		canAdd() { return this.isNumber(this.value) && this.items.indexOf(this.value) === -1; }
	},
	data() {
		return {
			activeValue: 0,
			value: 0
		}
	},
	methods: {
		...mapMutations('machine/settings', ['update']),
		removeActive(index) {
			const updateData = { temperatures: {} };
			updateData.temperatures[this.itemKey] = {};
			updateData.temperatures[this.itemKey].active = this.items.active.filter((temp, i) => i !== index);
			this.update(updateData);
		},
		addActive() {
			if (this.canAddActive) {
				const updateData = { temperatures: {} };
				updateData.temperatures[this.itemKey] = { active: this.items.active.slice() };
				updateData.temperatures[this.itemKey].active.push(this.activeValue);
				updateData.temperatures[this.itemKey].active.sort((a, b) => b - a);
				this.update(updateData);
			}
		},
		remove(index) {
			const updateData = {};
			if (this.settings[this.itemKey] === undefined) {
				updateData.temperatures = {};
				updateData.temperatures[this.itemKey] = this.items.filter((temp, i) => i !== index);
			} else {
				updateData[this.itemKey] = this.items.filter((temp, i) => i !== index);
			}
			this.update(updateData);
		},
		add() {
			if (this.canAdd) {
				const updateData = {};
				if (this.settings[this.itemKey] === undefined) {
					updateData.temperatures = {};
					updateData.temperatures[this.itemKey] = this.items.slice();
					updateData.temperatures[this.itemKey].push(this.value);
					updateData.temperatures[this.itemKey].sort((a, b) => b - a);
				} else {
					updateData[this.itemKey] = this.items.slice();
					updateData[this.itemKey].push(this.value);
					updateData[this.itemKey].sort((a, b) => b - a);
				}
				this.update(updateData);
			}
		}
	}
}
</script>
