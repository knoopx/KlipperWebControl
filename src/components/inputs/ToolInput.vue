<style scoped>
.tool-input {
	min-width: 4rem;
}
</style>

<template>
	<v-combobox ref="input" type="number" min="-273" max="1999" step="any" v-model.number="value" :items="items" @keydown.native="onkeydown" @keyup.enter="apply" @change="onchange" @blur="onblur" :label="label" :loading="applying" :disabled="uiFrozen" class="tool-input">
	</v-combobox>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions } from 'vuex'

export default {
	computed: {
		...mapGetters(['uiFrozen']),
		...mapState('machine/model', ['heat', 'tools']),
		...mapState('machine/settings', ['temperatures']),
		items() {
			const key = 'active';
			if (this.tool || this.all) {
				return this.temperatures.tool[key];
			}
			if (this.bed) {
				return this.temperatures.bed[key];
			}

			console.warn('[tool-input] Failed to retrieve temperature presets');
			return [];
		}
	},
	data() {
		return {
			applying: false,
			input: null,
			actualValue: 0,
			value: 0
		}
	},
	props: {
		label: String,
		active: Boolean,
		tabTarget: [Object, HTMLAnchorElement],

		all: Boolean,
		heaterIndex: Number,
		tool: Object,
		bed: Object,
		bedIndex: Number,
	},
	methods: {
		...mapActions('machine', ['sendCode']),
		async apply() {
			this.$refs.input.isMenuActive = false;			// FIXME There must be a better solution than this

			if (!this.applying && this.isNumber(this.value)) {
				this.applying = true;
				try {
					if (this.value >= -273.15 && this.value <= 1999) {
						if (this.tool) {
							// Set tool temp
							const currentTemps = this.tool['active'];
							const value = this.value, heaterIndex = this.heaterIndex;
							const newTemps = currentTemps.map((temp, i) => (i === heaterIndex) ? value : temp).reduce((a, b) => `${a}:${b}`);
							await this.sendCode(`M104 T${this.tool.number} S${newTemps}`);
						} else if (this.bed) {
							// Set bed temp
							const currentTemps = this.bed['active'];
							const value = this.value, heaterIndex = this.heaterIndex;
							const newTemps = currentTemps.map((temp, i) => (i === heaterIndex) ? value : temp).reduce((a, b) => `${a}:${b}`);
							await this.sendCode(`M140 S${newTemps}`);
						} else if (this.all) {
							// Set all temps
							let code = '';
							const targetTemp = this.value;
							this.tools.forEach(function(tool) {
								if (tool.heaters.length) {
									const temps = tool.heaters.map(() => targetTemp).reduce((a, b) => a + ':' + b);
									code += `M104 T${tool.number} S${temps}\n`;
								}
							}, this);
							this.heat.beds.forEach(function(bed) {
								if (bed && bed.heaters.length) {
									const temps = bed.heaters.map(() => targetTemp).reduce((a, b) => a + ':' + b);
									code += `M140 S${temps}\n`;
								}
							}, this);
							await this.sendCode(code);
							this.actualValue = this.value;
						} else {
							console.warn('[tool-input] Invalid target for tool-input');
						}
					}
				} catch (e) {
					// should be handled before we get here
					console.warn(e);
				}
				this.applying = false;
			} else {
				this.$makeNotification('warning', this.$t('error.enterValidNumber'));
			}
		},
		onchange(value) {
			// Note that value is of type String when a user enters a value and then leaves it without confirming...
			if (value.constructor === Number) {
				this.apply();
			}
		},
		onkeydown(e) {
			if (e.keyCode === 9 && this.tabTarget) {
				e.preventDefault();
				this.tabTarget.focus();
			}
		},
		onblur() {
			this.value = this.actualValue;
		},
		blur() {
			this.input.blur();
		},
		focus() {
			this.input.focus();
		}
	},
	mounted() {
		this.input = this.$el.querySelector('input');
		if (this.tool) {
			this.value = this.tool['active'][this.heaterIndex];
		} else if (this.bed) {
			this.value = this.bed['active'][this.heaterIndex];
		}
		this.actualValue = this.value;
	},
	watch: {
		'tool.active'(to) {
			const val = (to instanceof Array) ? to[this.heaterIndex] : to;
			if (this.active && this.actualValue !== val) {
				this.actualValue = val;
				if (document.activeElement !== this.input) {
					this.value = val;
				}
			}
		},
		'bed.active'(to) {
			const val = (to instanceof Array) ? to[this.heaterIndex] : to;
			if (this.active && this.actualValue !== val) {
				this.actualValue = val;
				if (document.activeElement !== this.input) {
					this.value = val;
				}
			}
		},
	}
}
</script>
