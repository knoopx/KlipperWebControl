<template>
	<v-card>
		<v-card-title class="pb-1">
			<v-icon small class="mr-1">build</v-icon> {{ $t('panel.jobControl.caption') }}
		</v-card-title>

		<v-card-text class="pt-0">
			<code-btn color="warning" block :disabled="uiFrozen || !isPrinting" :code="isPaused ? 'RESUME' : 'PAUSE'" tabindex="0">
				<v-icon class="mr-1">{{ isPaused ? "play_arrow" : "pause" }}</v-icon> {{ pauseResumeText }}
			</code-btn>

			<code-btn v-if="isPaused" color="error" block code="ABORT">
				<v-icon class="mr-1">stop</v-icon> {{ cancelText }}
			</code-btn>

			<code-btn v-if="!isPrinting && processAnotherCode" color="success" block :code="processAnotherCode">
				<v-icon class="mr-1">refresh</v-icon> {{ processAnotherText }}
			</code-btn>
		</v-card-text>
	</v-card>
</template>

<script>
'use strict'

import { mapState, mapGetters } from 'vuex'

export default {
	computed: {
		...mapState('machine/model', ['job', 'state']),
		...mapGetters(['uiFrozen']),
		...mapGetters('machine/model', ['isPaused', 'isPrinting']),
		pauseResumeText() {
			if (this.state.mode === 'FFF') {
				return this.$t(this.isPaused ? 'panel.jobControl.resumePrint' : 'panel.jobControl.pausePrint');
			}
			return this.$t(this.isPaused ? 'panel.jobControl.resumeJob' : 'panel.jobControl.pauseJob');
		},
		cancelText() {
			if (this.state.mode === 'FFF') {
				return this.$t('panel.jobControl.cancelPrint');
			}
			return this.$t('panel.jobControl.cancelJob');
		},
		processAnotherCode() {
			if (this.job.lastFileName) {
				return `PRINT_FILE FILE="${this.job.lastFileName}"`;
			}
			return undefined;
		},
		processAnotherText() {
			if (this.state.mode === 'FFF') {
				return this.$t('panel.jobControl.repeatPrint');
			}
			return this.$t('panel.jobControl.repeatJob');
		}
	},
}
</script>
