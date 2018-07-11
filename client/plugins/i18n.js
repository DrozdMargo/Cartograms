/**
 * A simple implementation of i18n feature based on locale stored in vuex
 *
 * When translation is missing translation method passes it to store which
 * manages fetching translations from server by batches
 */
export default class I18N {
  static install (Vue) {
    Vue.mixin({
      methods: {
        $t (key, placeholders) {
          const isObtained = this.$store.getters['translations/isObtained']
          const t = this.$store.getters['translations/t']
          if (!isObtained(key, placeholders)) {
            this.$store.commit('translations/addMissingKey', { key, placeholders })
            this.$store.dispatch('translations/loadMissingTranslations')
          }
          return t(key, placeholders)
        },
      },
    })
  }
}
