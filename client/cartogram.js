/* Entry point for `Cartogram` page script */
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import cartogramModule from '@app/store/cartogram'
import fieldsModule from '@app/store/fields'
import translationsModule from '@app/store/translations'
import List from '@app/components/cartogram/CartogramList'
import Create from '@app/components/cartogram/CartogramCreate'
import Edit from '@app/components/cartogram/CartogramEdit'
import VueResource from 'vue-resource'
import VueUniqIds from 'vue-uniq-ids'
import Styles from './assets/styles/main.scss'
import VueForm from 'vue-form'
import I18N from '@app/plugins/i18n'
import * as moment from 'moment'



/**
 * @typedef {Object} Environment
 * @property {String} stage 'dev' or 'prod'
 * @property {Boolean} isDebug
 * @property {String} gooKey
 * @property {String} lang
 * @property {String} baseUrl
 * @property {String} csrf
 */

/**
 * @typedef {Object} CartogramProps
 * @property {Array} elementCharacteristics
 * @property {Array} elementUnits
 * @property {Array} elementLayers
 * @property {Array} elements
 * @property {Array} landPlots
 * @property {Array} cartograms
 */

const rootElement = document.getElementById('cartogram')

/**
 * @type {Environment}
 */
const env = JSON.parse(rootElement.getAttribute('data-env'))

/**
 * @type {CartogramProps}
 */
const props = JSON.parse(rootElement.getAttribute('data-props'))

const gooMapConfig = {
  load: {
    key: env.gooKey,
    libraries: 'places, drawing, visualization',
  },
}

const storeConfig = {
  modules: {
    fields: fieldsModule,
    cartogram: cartogramModule,
    translations: translationsModule,
  },
}

const routerConfig = {
  base: env.baseUrl + '/' + env.lang,
  mode: 'history',
  routes: [
    {
      path: '/crop/cartogram',
      name: 'List',
      component: List,
    },
    {
      path: '/crop/cartogram/new',
      props: true,
      name: 'Create',
      component: Create,
    },
    {
      path: '/crop/cartogram/edit/:cartogramId',
      name: 'Edit',
      props: true,
      component: Edit,
    },
  ],
}

Vue.use(I18N)
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(VueResource)
Vue.use(VueGoogleMaps, gooMapConfig)
Vue.use(VueUniqIds)
Vue.use(VueForm)
Vue.use(Styles)
Vue.use(require('vue-moment'), {
    moment,
})


Vue.config.productionTip = env.stage === 'prod'
Vue.config.devtools = env.isDebug
Vue.config.debug = env.isDebug
Vue.http.options.root = env.baseUrl + '/' + env.lang
Vue.http.headers.common['X-CSRF-Token'] = env.csrf

const store = new Vuex.Store(storeConfig)
const router = new VueRouter(routerConfig)

store.commit('cartogram/setCharacteristics', props.elementCharacteristics || null)
store.commit('cartogram/setLayers', props.elementLayers || null)
store.commit('cartogram/setUnits', props.elementUnits || null)
store.commit('cartogram/setElements', props.elements || null)
store.commit('cartogram/setCartograms', props.cartograms)
store.commit('fields/setLandPlots', props.landPlots || null)
store.commit('translations/setLang', env.lang)

new Vue({
  el: rootElement,
  router,
  store,
  Styles,
  data: env,
  render: h => h('router-view'),
})
