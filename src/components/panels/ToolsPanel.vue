<style scoped>
table {
	width: 100%;
	border-spacing: 0;
}

table td,
table th {
	text-align: center;
}

table.tools th,
table.tools td {
	width: 20%;
}

table.extra th,
table.extra td {
	width: 25%;
}

table.extra tr > th:first-child,
table.extra tr > td:first-child {
	width: 50%;
}
</style>

<template>
	<v-card>
		<v-card-title class="py-2">
			<panel-link :active="currentPage !== 'tools'" @click="currentPage = 'tools'" class="mr-2">
				<v-icon small>build</v-icon> {{ $t('panel.tools.caption') }}
			</panel-link>
			<panel-link :active="currentPage !== 'extra'" @click="currentPage = 'extra'">
				<v-icon small>timeline</v-icon> {{ $t('panel.tools.extra.caption') }}
			</panel-link>

			<v-spacer></v-spacer>

			<v-menu v-model="dropdownShown" offset-y left :close-on-content-click="false" :disabled="uiFrozen">
				<a slot="activator" ref="dropdownActivator" href="#" @click.prevent tabindex="0" @keyup.enter="showDropdown">
					<v-icon small>more_horiz</v-icon> {{ $t('panel.tools.controlAll') }}
				</a>
				<v-card>
					<v-layout justify-center column class="pt-2 px-2">
						<v-btn block color="primary" class="mb-3 pa-2" :disabled="!canTurnEverythingOff" @click="turnEverythingOff">
							<v-icon class="mr-1">power</v-icon> {{ $t('panel.tools.turnEverythingOff') }}
						</v-btn>

						<tool-input ref="allActive" :label="$t('panel.tools.allActiveTemperatures')" all active></tool-input>
					</v-layout>
				</v-card>
			</v-menu>
		</v-card-title>

		<v-card-text class="pa-0">
			<template v-if="currentPage === 'tools'">
				<!-- Tools -->
				<table class="tools" v-show="tools.length">
					<thead>
						<th class="pl-2">{{ $t('panel.tools.tool', ['']) }}</th>
						<th>{{ $t('panel.tools.heater', ['']) }}</th>
						<th>{{ $t('panel.tools.current', ['']) }}</th>
						<th class="pr-2">{{ $t('panel.tools.active') }}</th>
					</thead>
					<tbody>
						<template v-for="(tool, index) in tools">
							<tr :class="{ [selectedToolClass] : (tool.number === state.currentTool) }" :key="`tool-${index}-${tool.heaters.length && tool.heaters[0]}`">
								<th :rowspan="Math.max(1, tool.heaters.length)" class="pl-2" :class="{ 'pt-2 pb-2' : !tool.heaters.length}">
									<a href="#" @click.prevent="toolClick(tool)">
										{{ tool.name || $t('panel.tools.tool', [tool.number]) }}
									</a>
									<br/>
									<span class="font-weight-regular caption">
										T{{ tool.number }}
									</span>
								</th>

								<th>
									<a v-if="tool.heaters.length" href="#" :class="getHeaterColor(tool.heaters[0])" @click.prevent="toolHeaterClick(tool, tool.heaters[0])">
										{{ formatHeaterName(heat.heaters[tool.heaters[0]], tool.heaters[0]) }}
									</a>
									<br/>
									<span v-if="tool.heaters.length && heat.heaters[tool.heaters[0]].state !== null" class="font-weight-regular caption">
										{{ $t(`generic.heaterStates[${heat.heaters[tool.heaters[0]].state}]`) }}
									</span>
								</th>
								<td class="text-center">
									<span v-if="tool.heaters.length">
										{{ formatHeaterValue(heat.heaters[tool.heaters[0]]) }}
									</span>
								</td>
								<td class="pl-2 pr-2">
									<tool-input v-if="tool.heaters.length" :tool="tool" :heaterIndex="0" active></tool-input>
								</td>
							</tr>

							<tr v-for="(heater, heaterIndex) in tool.heaters.slice(1)" :class="{ 'grey lighten-4' : tool.number === state.currentTool }" :key="`tool-${index}-${heater}`">
								<th>
									<a href="#" :class="getHeaterColor(heater)" @click.prevent="toolHeaterClick(tool, heater)">
										{{ formatHeaterName(heat.heaters[heater], heater) }}
									</a>
									<br/>
									<span v-if="heat.heaters[heater].state !== null" class="font-weight-regular caption">
										{{ $t(`generic.heaterStates[${heat.heaters[heater].state}]`) }}
									</span>
								</th>
								<td>
									{{ formatHeaterValue(heat.heaters[heater]) }}
								</td>
								<td class="pl-2 pr-2">
									<tool-input :tool="tool" :heaterIndex="heaterIndex + 1" active></tool-input>
								</td>
							</tr>

							<tr v-if="index !== tools.length - 1" :key="`div-tool-${index}`">
								<td colspan="5">
									<v-divider></v-divider>
								</td>
							</tr>
						</template>

						<!-- Beds -->
						<template v-for="(bed, index) in heat.beds">
							<template v-if="bed">
								<tr :key="`div-bed-${index}`">
									<td colspan="5">
										<v-divider></v-divider>
									</td>
								</tr>

								<tr :key="`bed-${index}-${bed.heaters.length && bed.heaters[0]}`">
									<th :rowspan="Math.max(1, bed.heaters.length)" class="pl-2" :class="{ 'pt-2 pb-2' : !bed.heaters.length}">
										<a href="#" @click.prevent="bedClick(bed, index)">
											{{ bed.name || $t('panel.tools.bed', [(heat.beds.length !== 1) ? index : '']) }}
										</a>
									</th>

									<th>
										<a v-if="bed.heaters.length" href="#" :class="getHeaterColor(bed.heaters[0])" @click.prevent="bedHeaterClick(bed, index, bed.heaters[0])">
											{{ formatHeaterName(heat.heaters[bed.heaters[0]], bed.heaters[0]) }}
										</a>
										<br/>
										<span v-if="bed.heaters.length > 0 && heat.heaters[bed.heaters[0]].state !== null" class="font-weight-regular caption">
											{{ $t(`generic.heaterStates[${heat.heaters[bed.heaters[0]].state}]`) }}
										</span>
									</th>
									<td class="text-center">
										<span v-if="bed.heaters.length">
											{{ formatHeaterValue(heat.heaters[bed.heaters[0]]) }}
										</span>
									</td>
									<td class="pl-2 pr-2">
										<tool-input v-if="bed.heaters.length" :bed="bed" :bedIndex="0" :heaterIndex="0" active></tool-input>
									</td>
								</tr>
								<tr v-for="(heater, heaterIndex) in bed.heaters.slice(1)" :key="`bed-${index}-${heater}`">
									<th>
										<a href="#" :class="getHeaterColor(heater)" @click.prevent="bedHeaterClick(bed, index, heater)">
											{{ formatHeaterName(heat.heaters[heater], heater) }}
										</a>
										<br/>
										<span v-if="heat.heaters[heater].state !== null" class="font-weight-regular caption">
											{{ $t(`generic.heaterStates[${heat.heaters[heater].state}]`) }}
										</span>
									</th>
									<td>
										{{ formatHeaterValue(heat.heaters[heater]) }}
									</td>
									<td class="pl-2 pr-2">
										<tool-input :bed="bed" :bedIndex="index" :heaterIndex="heaterIndex + 1" active></tool-input>
									</td>
								</tr>
							</template>
						</template>
					</tbody>
				</table>
				<v-alert :value="!tools.length" type="info">
					{{ $t('panel.tools.noTools') }}
				</v-alert>

				<reset-heater-fault-dialog :shown.sync="resetHeaterFault" :heater="faultyHeater"></reset-heater-fault-dialog>
			</template>

			<template v-else-if="currentPage === 'extra'">
				<table class="extra ml-2 mr-2" v-show="heat.extra.length">
					<thead>
						<th class="hidden-sm-and-down"></th>
						<th>{{ $t('panel.tools.extra.sensor') }}</th>
						<th>{{ $t('panel.tools.extra.value') }}</th>
					</thead>
					<tbody>
						<tr v-for="(extraHeater, index) in heat.extra" :key="`extra-${index}-${extraHeater}`">
							<td class="hidden-sm-and-down">
								<v-switch class="ml-3" :input-value="displayedExtraTemperatures.indexOf(index) !== -1" @change="toggleExtraHeaterVisibility(index)" :label="$t('panel.tools.extra.showInChart')" :disabled="uiFrozen"></v-switch>
							</td>
							<th class="py-2" :class="getExtraHeaterColor(index)">
								{{ formatHeaterName(extraHeater, index + 100) }}
							</th>
							<td class="py-2">
								{{ formatHeaterValue(extraHeater) }}
							</td>
						</tr>
					</tbody>
				</table>
				<v-alert :value="!heat.extra.length" type="info">
					{{ $t('panel.tools.extra.noItems') }}
				</v-alert>
			</template>
		</v-card-text>
	</v-card>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

import { getHeaterColor, getExtraHeaterColor } from '../../utils/colors.js'
import { DisconnectedError } from '../../utils/errors.js'

export default {
	computed: {
		...mapGetters(['isConnected', 'uiFrozen']),
		...mapState('machine/model', ['heat', 'state', 'tools']),
		...mapState('machine/settings', ['displayedExtraTemperatures']),
		...mapState('settings', ['darkTheme']),
		canTurnEverythingOff() {
			return !this.uiFrozen && this.heat.heaters.some(heater => heater.state);
		},
		selectedToolClass() {
			return this.darkTheme ? 'grey darken-3' : 'blue lighten-5';
		}
	},
	data() {
		return {
			dropdownShown: false,
			turningEverythingOff: false,

			currentPage: 'tools',
			waitingForCode: false,

			resetHeaterFault: false,
			faultyHeater: -1
		}
	},
	methods: {
		...mapActions('machine', ['sendCode']),
		...mapMutations('machine/settings', ['toggleExtraHeaterVisibility']),

		showDropdown() {
			this.dropdownShown = !this.dropdownShown;
			if (this.dropdownShown) {
				const input = this.$refs.allActive;
				setTimeout(() => input.focus(), 300);
			}
		},
		async turnEverythingOff() {
			let code = '';
			this.tools.forEach(function(tool) {
				if (tool.heaters.length) {
					const temps = tool.heaters.map(() => '-273.15').reduce((a, b) => a + ':' + b);
					code += `M104 T${tool.number} S${temps}\n`;
				}
			});
			this.heat.beds.forEach(function(bed) {
				if (bed && bed.heaters.length) {
					code += `M140 S-273.15\n`;
				}
			});

			this.turningEverythingOff = true;
			try {
				await this.sendCode(code);
			} catch (e) {
				if (!(e instanceof DisconnectedError)) {
					this.$log('error', this.$t('error.turnOffEverythingFailed'), e.message);
				}
			}
			this.turningEverythingOff = false;
		},

		getHeaterColor: heater => getHeaterColor(heater),
		getExtraHeaterColor: heater => getExtraHeaterColor(heater),
		formatHeaterName(heater, index) {
			if (heater && heater.name) {
				const matches = /(.*)\[(.*)\]$/.exec(heater.name);
				if (matches) {
					return matches[1];
				}
				return heater.name;
			}
			return this.$t('panel.tools.heater', [index]);
		},
		formatHeaterValue(heater) {
			let unit = (heater.sensor >= 450 && heater.sensor < 500) ? '%RH' : 'C';
			if (heater.name) {
				const matches = /(.*)\[(.*)\]$/.exec(heater.name);
				if (matches) {
					return this.$display(heater.current, 1, matches[2]);
				}
			}
			return this.$display(heater.current, 1, unit);
		},
		toolClick(tool) {
			if (!this.isConnected) {
				return;
			}

			this.waitingForCode = true;
			try {
				if (this.state.currentTool === tool.number) {
					// Deselect current tool
					this.sendCode('T-1');
				} else {
					// Select new tool
					this.sendCode(`T${tool.number}`);
				}
			} catch (e) {
				if (!(e instanceof DisconnectedError)) {
					this.$log('error', e.message);
				}
			}
			this.waitingForCode = false;
		},
		toolHeaterClick(tool, index) {
			if (!this.isConnected) {
				return;
			}
			const heater = this.heat.heaters[index]

			switch (heater.state) {
				case 0:		// Off
					break;

				case 1:		// Active, turn it off
					this.sendCode(`M104 T${index} S0`);
					break;
			}
		},

		bedClick(bed, bedIndex) {
			if (bed.heaters.length) {
				// There is no special action for clicking Bed yet
				this.bedHeaterClick(bed, bedIndex, bed.heaters[0]);
			}
		},
		bedHeaterClick(bed, bedIndex, heater) {
			if (!this.isConnected) {
				return;
			}

			let temps;
			switch (this.heat.heaters[heater].state) {
				case 0:		// Off
					temps = (bed.active instanceof Array) ? bed.active.reduce((a, b) => `${a}:${b}`) : bed.active;
					this.sendCode(`M140 S${temps}`);
					break;

				case 1:		// On
					this.sendCode(`M144 S-273.15`);
					break;
			}
		},
	}
}
</script>
