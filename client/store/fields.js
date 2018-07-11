import { Coordinates } from '@app/entities/Coordinates'

export default {
  namespaced: true,
  state: {
    landPlots: null,
    list: null,
  },
  mutations: {
    setLandPlots (state, data) {
      if (Array.isArray(data)) {
        state.landPlots = data.map(item => {
          const coordinates = new Coordinates(item.coordinates)
          return Object.assign(item, { coordinates })
        })
      }
      state.landPlots = data
    },
  },
}
