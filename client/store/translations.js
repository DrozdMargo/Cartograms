import Vue from 'vue'
import debounce from 'lodash/debounce'
import has from 'lodash/has'
import get from 'lodash/get'
import merge from 'lodash/merge'
import toPairs from 'lodash/toPairs'
import fromPairs from 'lodash/fromPairs'
import sortBy from 'lodash/sortBy'

const getHash = (key, placeholders) => {
  if (placeholders) {
    return key + ':' + JSON.stringify(fromPairs(sortBy(toPairs(placeholders), 0)))
  }
  return key
}

export default {
  namespaced: true,
  state: {
    list: {},
    lang: null,
    missingKeys: {}, // not loaded yet
    absenceKeys: {}, // loading failed, not translated yet
  },
  mutations: {
    setTranslations (state, { translations }) {
      state.list = merge(state.list, translations)
    },
    setLang (state, lang) {
      const isChanged = state.lang && state.lang !== lang
      state.lang = lang
      if (isChanged) {
        state.list = {}
        state.missingKeys = {}
        state.absenceKeys = {}
      }
    },
    addMissingKey (state, { key, placeholders }) {
      const hash = getHash(key, placeholders)
      if (!state.absenceKeys[hash] && !state.missingKeys[hash]) {
        state.missingKeys[hash] = [ key, placeholders ]
      }
    },
    clearMissingKeys (state, absenceKeys) {
      state.missingKeys = {}
      state.absenceKeys = merge(state.absenceKeys, absenceKeys)
    },
  },
  getters: {
    t: state => (key, placeholders) => {
      const hash = getHash(key, placeholders)
      if (has(state.list, hash)) {
        return get(state.list, hash)
      }
      let term = key.split('.')[1]
      if (placeholders) {
        Object.keys(placeholders).forEach(k => {
          term = term.replace('{' + k + '}', placeholders[k])
        })
      }
      return term
    },
    isObtained: state => (key, placeholders) => {
      const hash = getHash(key, placeholders)
      return has(state.list, hash) || has(state.absenceKeys, hash) || has(state.missingKeys, hash)
    },
  },
  actions: {
    loadMissingTranslations: debounce(async ({ commit, state }) => {
      const missingKeysKeys = Object.keys(state.missingKeys)
      if (!missingKeysKeys.length) {
        return
      }
      const params = {
        lang: state.lang,
        placeholders: { ...state.missingKeys },
      }
      const response = await Vue.http.get('shared-data/translations', { params })
      if (typeof response.data.result === 'object' && Object.keys(response.data.result).length > 0) {
        commit('setTranslations', { translations: response.data.result })
      }
      const absenceKeys = {}
      missingKeysKeys.forEach(hash => {
        if (!has(response.data.result, hash)) {
          absenceKeys[hash] = true
        }
      })
      commit('clearMissingKeys', absenceKeys)
    }, 100),
  },
}
