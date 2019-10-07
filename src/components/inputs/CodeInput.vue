<style scoped>
.grow {
	flex-grow: 1;
}
</style>

<template>
	<v-layout row class="component" :class="{ 'mt-2' : solo, 'grow' : grow }">
		<v-flex>
			<v-combobox ref="input" v-model.trim="code" :items="displayedCodes" :menu-props="$vuetify.breakpoint.xsOnly ? { maxHeight: 125 } : undefined" :solo="solo" :disabled="uiFrozen" :loading="sendingCode" :placeholder="$t('input.code.placeholder')" @keyup.enter="send" @change="change" hide-details>
				<template slot="item" slot-scope="{ item }">
					<code>{{ item.text }}</code>
					<v-spacer></v-spacer>
					<v-btn icon @click.prevent.stop="removeCode(item.value)">
						<v-icon>delete</v-icon>
					</v-btn>
				</template>
			</v-combobox>
		</v-flex>

		<v-flex shrink>
			<v-btn color="info" :disabled="uiFrozen" :loading="sendingCode" @click="doSend">
				<v-icon class="mr-2">send</v-icon> {{ $t('input.code.send') }}
			</v-btn>
		</v-flex>
	</v-layout>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

export default {
	computed: {
		...mapGetters(['uiFrozen']),
		...mapState('machine/settings', ['codes']),
		displayedCodes() {
			return this.codes.map(code => ({ text: code, value: code }));
		}
	},
	data() {
		return {
			code: '',
			sendPending: false,
			sendingCode: false
		}
	},
	props: {
		grow: Boolean,
		solo: Boolean
	},
	methods: {
		...mapActions('machine', ['sendCode']),
		...mapMutations('machine/settings', ['addCode', 'removeCode']),
		change(value) {
			if (value && (this.sendPending || value.constructor !== String)) {
				this.sendPending = false;
				this.send();
			}
		},
		doSend() {
			if (this.$refs.input.isMenuActive) {
				this.$refs.input.isMenuActive = false;		// FIXME There must be a better solution than this
				this.sendPending = true;
			} else {
				this.send();
			}
		},
		async send() {
			this.$refs.input.isMenuActive = false;			// FIXME There must be a better solution than this

			const code = (this.code.constructor === String) ? this.code : this.code.value;
			if (code && code.trim() !== '' && !this.sendingCode) {
				let codeToSend = code.trim();
				// Send the code and wait for completion
				this.sendingCode = true;
				try {
					const reply = await this.sendCode({ code: codeToSend, fromInput: true });
					if (!reply.startsWith('Error: ') && !reply.startsWith('Warning: ') && this.codes.indexOf(codeToSend) === -1) {
						// Automatically remember successful codes
						this.addCode(codeToSend);
					}
				} catch (e) {
					// handled before we get here
				}
				this.sendingCode = false;
			}
		}
	},
	watch: {
		uiFrozen(to) {
			if (to) {
				// Clear input when the UI is frozen
				this.code = '';
			}
		}
	}
}
</script>
