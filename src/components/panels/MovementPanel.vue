<style>
.move-btn {
	padding-left: 0;
	padding-right: 0;
	min-width: 0;
}

.center-menu-item > div {
	justify-content: center;
}
</style>

<template>
	<v-card>
		<v-card-title class="pt-2 pb-0">
			<code-btn color="primary" small code="G28" :title="$t('button.home.titleAll')" class="ml-0 hidden-sm-and-down">
				{{ $t('button.home.captionAll') }}
			</code-btn>

			<v-spacer class="hidden-sm-and-down"></v-spacer>

			<v-icon small class="mr-1">swap_horiz</v-icon> {{ $t('panel.movement.caption') }}

			<v-spacer></v-spacer>

			<v-menu offset-y left :disabled="uiFrozen" v-tab-control>
				<template slot="activator">
					<v-btn color="primary" small class="mx-0" :disabled="uiFrozen">
						{{ $t('panel.movement.compensation') }} <v-icon>arrow_drop_down</v-icon>
					</v-btn>
				</template>

				<v-card>
					<v-list>
						<v-list-tile @click="sendCode('BED_MESH_CALIBRATE')">
							<v-icon class="mr-1">view_module</v-icon> Bed Mesh Calibrate
						</v-list-tile>

						<v-list-tile :disabled="!move.compensation" @click="sendCode('BED_MESH_CLEAR')">
							<v-icon class="mr-1">clear</v-icon> Bed Mesh Clear
						</v-list-tile>

						<v-divider></v-divider>

						<v-list-tile @click="sendCode('PROBE_CALIBRATE')">
							<v-icon class="mr-1">view_module</v-icon> Probe Calibrate
						</v-list-tile>
					</v-list>
				</v-card>
			</v-menu>
		</v-card-title>

		<v-card-text class="pt-0 pb-2">
			<!-- Mobile home buttons -->
			<v-layout justify-center row wrap class="hidden-md-and-up">
				<v-flex>
					<code-btn color="primary" code="G28" :title="$t('button.home.titleAll')" block>
						{{ $t('button.home.captionAll') }}
					</code-btn>
				</v-flex>
				<template v-if="move.geometry.type !== 'delta'">
					<v-flex v-for="axis in displayedAxes" :key="axis.letter">
						<code-btn :color="axis.homed ? 'primary' : 'warning'" :disabled="uiFrozen" :title="$t('button.home.title', [axis.letter])" :code="`G28 ${axis.letter}`" block>

							{{ $t('button.home.caption', [axis.letter]) }}
						</code-btn>
					</v-flex>
				</template>
			</v-layout>

			<v-layout row>
				<!-- Regular home buttons -->
				<v-flex v-if="move.geometry.type !== 'delta'" shrink class="hidden-sm-and-down">
					<v-layout column>
						<v-flex v-for="axis in displayedAxes" :key="axis.letter">
							<code-btn :color="axis.homed ? 'primary' : 'warning'" :disabled="uiFrozen" :title="$t('button.home.title', [axis.letter])" :code="`G28 ${axis.letter}`" class="ml-0">

								{{ $t('button.home.caption', [axis.letter]) }}
							</code-btn>
						</v-flex>
					</v-layout>
				</v-flex>

				<!-- Jog control -->
				<v-flex>
					<v-layout row wrap>
						<!-- Decreasing movements -->
						<v-flex>
							<v-layout row>
								<!-- Decreasing movements -->
								<v-flex v-for="index in numMoveSteps" :key="-index" :class="getMoveCellClass(index - 1)">
									<v-layout column>
										<v-flex v-for="axis in displayedAxes" :key="axis.letter">
											<code-btn :code="`G91\nG1 ${axis.letter}${-moveSteps(axis.letter)[index - 1]} F${moveFeedrate}\nG90`" no-wait @contextmenu.prevent="showMoveStepDialog(axis.letter, index - 1)" block class="move-btn">
												<v-icon>keyboard_arrow_left</v-icon> {{ axis.letter + showSign(-moveSteps(axis.letter)[index - 1]) }}
											</code-btn>
										</v-flex>
									</v-layout>
								</v-flex>
							</v-layout>
						</v-flex>

						<v-flex shrink class="hidden-sm-and-down px-1"></v-flex>

						<!-- Increasing movements -->
						<v-flex>
							<v-layout row>
								<v-flex v-for="index in numMoveSteps" :key="index" :class="getMoveCellClass(numMoveSteps - index)">
									<v-layout column>
										<v-flex v-for="axis in displayedAxes" :key="axis.letter">
											<code-btn :code="`G91\nG1 ${axis.letter}${moveSteps(axis.letter)[numMoveSteps - index]} F${moveFeedrate}\nG90`" no-wait @contextmenu.prevent="showMoveStepDialog(axis.letter, numMoveSteps - index)" block class="move-btn">
												{{ axis.letter + showSign(moveSteps(axis.letter)[numMoveSteps - index]) }} <v-icon>keyboard_arrow_right</v-icon>
											</code-btn>
										</v-flex>
									</v-layout>
								</v-flex>
							</v-layout>
						</v-flex>
					</v-layout>
				</v-flex>
			</v-layout>
		</v-card-text>

		<mesh-edit-dialog :shown.sync="showMeshEditDialog"></mesh-edit-dialog>
		<input-dialog :shown.sync="moveStepDialog.shown" :title="$t('dialog.changeMoveStep.title')" :prompt="$t('dialog.changeMoveStep.prompt')" :preset="moveStepDialog.preset" is-numeric-value @confirmed="moveStepDialogConfirmed"></input-dialog>

		<v-alert :value="!!unhomedAxes.length" type="warning">
			{{ $tc('panel.movement.axesNotHomed', unhomedAxes.length) }}
			<strong>
				{{ unhomedAxes.length ? unhomedAxes.map(axis => axis.letter).reduce((a, b) => `${a}, ${b}`) : '' }}
			</strong>
		</v-alert>

		<v-alert :value="!move.axes.length" type="info">
			{{ $t('panel.movement.noAxes') }}
		</v-alert>
	</v-card>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

export default {
	computed: {
		...mapGetters(['isConnected', 'uiFrozen']),
		...mapState('machine/model', ['move']),
		...mapState('machine/settings', ['moveFeedrate']),
		...mapGetters('machine/settings', ['moveSteps', 'numMoveSteps']),
		displayedAxes() { return this.move.axes.filter(axis => axis.visible); },
		unhomedAxes() { return this.move.axes.filter(axis => axis.visible && !axis.homed); }
	},
	data() {
		return {
			dropdownShown: false,
			showMeshEditDialog: false,
			moveStepDialog: {
				shown: false,
				axis: 'X',
				index: 0,
				preset: 0
			}
		}
	},
	methods: {
		...mapActions('machine', ['sendCode']),
		...mapMutations('machine/settings', ['setMoveStep']),
		getMoveCellClass(index) {
			let classes = '';
			if (index === 0 || index === 5) {
				classes += 'hidden-lg-and-down';
			}
			if (index > 1 && index < 4 && index % 2 === 1) {
				classes += 'hidden-md-and-down';
			}
			return classes;
		},
		showSign: (value) => (value > 0) ? `+${value}` : value,
		showMoveStepDialog(axis, index) {
			this.moveStepDialog.axis = axis;
			this.moveStepDialog.index = index;
			this.moveStepDialog.preset = this.moveSteps(this.moveStepDialog.axis)[this.moveStepDialog.index];
			this.moveStepDialog.shown = true;
		},
		moveStepDialogConfirmed(value) {
			this.setMoveStep({ axis: this.moveStepDialog.axis, index: this.moveStepDialog.index, value });
		}
	},
	watch: {
		isConnected() {
			// Hide dialogs when the connection is interrupted
			this.showMeshEditDialog = false;
			this.moveStepDialog.shown = false;
		}
	}
}
</script>
