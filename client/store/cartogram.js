import Vue from 'vue'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import config from '@app/config'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import map from 'lodash/map'

const extractInputCells = cartogram => {
  const inputPoints = []
  const inputPointsIndexes = {}
  cartogram.inputCells.forEach(cell => {
    const index = cell.pointLat + ':' + cell.pointLng
    if (!inputPointsIndexes[index]) {
      const point = {
        cellId: cell.id,
        position: { lat: cell.pointLat, lng: cell.pointLng },
        elements: { },
      }
      inputPoints.push(point)
      inputPointsIndexes[index] = point
    }
    inputPointsIndexes[index].elements[cell.soilElementId] = cell.value
  })
  return inputPoints
}

export default {
  namespaced: true,
  state: {
    elementCharacteristics: null,
    elementLayers: null,
    elementUnits: null,
    elements: null,
    list: null,
    page: 0,
  },
  mutations: {
    setCharacteristics (state, data) {
      state.elementCharacteristics = data
    },
    setLayers (state, data) {
      state.elementLayers = data
    },
    setUnits (state, data) {
      state.elementUnits = data
    },
    setElements (state, data) {
      state.elements = data
    },
    setCartograms (state, data, page = 0) {
      state.list = data
      state.page = page
    },
    addCartogram (state, cartogram) {
      state.list.push(cartogram)
    },
    setCartogram (state, cartogram) {
      const ind = findIndex(state.list, item => item.id === cartogram.id)
      if (ind > -1) {
        state.list.splice(ind, 1, cartogram)
      }
    },
    dropCartogram (state, id) {
      const idx = findIndex(state.list, item => item.id === id)
      if (idx > -1) {
        state.list.splice(idx, 1)
      }
    },
  },
  getters: {
    findElement: (state) => (conditions) => {
      return state.elements.find(item => item.id == conditions)
    },
    findCharacteristic: (state) => (conditions) => {
      return state.elementCharacteristics.find(item => item.id == conditions)
    },
    findLayer: (state) => (conditions) => {
      return state.elementLayers.find(item => item.id == conditions)
    },
    findUnit: (state) => (conditions) => {
      return state.elementUnits.find(item => item.id == conditions)
    },
    composedCartograms: (state, getters, globalState) => {
      const composedCartograms = new Array(state.list.length)
      state.list.forEach((cartogram, index) => {
        const elementIds = uniq(map(cartogram.inputCells, 'soilElementId'))
        const elements = state.elements.filter(el => elementIds.includes(el.id))
        composedCartograms[index] = {
          id: cartogram.id,
          landPlot: find(globalState.fields.landPlots, { id: cartogram.landPlotId }),
          characteristic: find(state.elementCharacteristics, { id: cartogram.characteristicId }),
          layer: find(state.elementLayers, { id: cartogram.layerId }),
          date: cartogram.date,
          formattedDate: Vue.moment.unix(cartogram.date).format(config.dateFormat),
          comment: cartogram.comment,
          inputPoints: extractInputCells(cartogram),
          inputCells: cartogram.inputCells,
          elementCells: groupBy(cartogram.inputCells, 'soilElementId'),
          elements,
        }
      })
      return composedCartograms
    },
  },
  actions: {
    async loadCartograms ({ commit }, { page = 0, size = 50 } = {}) {
      const response = await Vue.http.get('crop/cartogram/search', {
        params: {
          page,
          size,
        },
      })
      commit('setCartograms', response.data.data, page)
    },
    async createCartogram ({ commit }, data) {
      const response = await Vue.http.post('crop/cartogram/create', data, {
        emulateJSON: true,
      })
      if (response.data.processed) {
        commit('addCartogram', response.data.model)
        return response.data.model
      }
      throw new Error(response.data.errors)
    },
    async deleteCartogram ({ commit }, id) {
      const response = await Vue.http.get('crop/cartogram/delete?id=' + id)
      if (response.body.processed && response.body.affected) {
        commit('dropCartogram', id)
      }
    },
    async updateCartogram ({ commit }, request) {
      const response = await Vue.http.post('crop/cartogram/update?id=' + request.id, request.data, {
        emulateJSON: true,
      })
      if (response.data.processed) {
        commit('setCartogram', response.data.model)
        return response.data.model
      }
      throw new Error(response.data.errors)
    },
  },
}
