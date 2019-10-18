'use strict'

import Vue from 'vue'

import BaseFileList from './BaseFileList.vue'
import EventList from './EventList.vue'
import JobFileList from './JobFileList.vue'
import MacroFileList from './MacroFileList.vue'
import MacroList from './MacroList.vue'
import SysFileList from './SysFileList.vue'

Vue.component('base-file-list', BaseFileList)
Vue.component('event-list', EventList)
Vue.component('job-file-list', JobFileList)
Vue.component('macro-file-list', MacroFileList)
Vue.component('macro-list', MacroList)
Vue.component('sys-file-list', SysFileList)

export default {
	EventList,
	JobFileList,
	MacroFileList,
	MacroList,
	SysFileList
}
