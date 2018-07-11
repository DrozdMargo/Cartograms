<template>
    <div class="row">
        <div class="col-md-3 cartogram-list" v-bind:style="leftColStyles">
            <form class="form-horizontal field-map-list" id="cartogram-edit-form" novalidate v-bind:style="leftFormStyles">
                <div class="form-group">
                    <label class="control-label">{{$t('field.Land Plot Name')}}</label>
                    <multi-select v-model="form.landPlot"
                                 label="name"
                                 track-by="id"
                                 :options="landPlots"
                                 :multiple="false"
                                 :searchable="true"
                                 :options-limit="300"
                                 :show-labels="false"
                                 :show-no-result="false"
                                 :hide-selected="false"
                                 :disabled="true">
                        <span slot="noResult">{{$t('cartogram.No keywords found')}}...</span>
                    </multi-select>
                </div>

                <div class="form-group">
                    <label v-uni-for="'date'" class="control-label">{{$t('common.Period')}}</label>
                    <div><input v-uni-id="'date'" type="text" v-model="form.formattedDate" disabled class="form-control"></div>
                </div>

                <div class="form-group left-part">
                    <label class="control-label">{{$t('cartogram.Soil Element Characteristic')}}</label>
                    <simple-select v-model="form.characteristic"
                                   :options="elementCharacteristics"
                                   :label-column="'name'"
                                   :value-column="'id'"
                                   :disabled="true"
                                   name="characteristicId" />
                </div>

                <div class="form-group right-part">
                    <label v-uni-for="'layer'" class="control-label">{{ $t('cartogram.Soil Element Layer') }}</label>
                    <simple-select v-model="form.layer"
                                   :options="elementLayers"
                                   :label-column="'depth'"
                                   :value-column="'id'"
                                   :disabled="true"
                                   name="layerId" />
                </div>

                <div class="form-group">
                    <label v-uni-for="'comment'" class="control-label">{{$t('common.Comment')}}</label>
                    <textarea v-uni-id="'comment'" v-model="form.comment" name="comment" class="form-control">
                    </textarea>
                </div>

                <div class="form-group">
                    <label v-uni-for="'element'" class="control-label">{{ $t('cartogram.Element') }}</label>
                    <simple-select v-model="element"
                                   :options="model.elements"
                                   :label-column="'name'"
                                   :value-column="'id'"
                                   name="elementId" />
                </div>

                <div class="list-title">
                    <h2>{{$t('cartogram.List of the points')}}</h2>
                </div>

                <div>
                    <div class="list-item-row" v-for="(point, index) in pointsOfSelectedElement">
                        <p class="control-label list-item" :title="getPointLabel(point, index)">{{ getPointLabel(point, index) }}</p>
                            <button type="button" @click="openEditPointDialog(point)" class="btn btn-eye-blue"></button>
                            <button type="button" @click="removePoint(point)" class="btn btn-delete"></button>
                    </div>
                </div>

                <div class="clearfix">
                    <button @click="openNewPointDialog" class="btn" type="button">{{ $t('cartogram.Add Point') }}</button>
                </div>

            </form>

            <div class="footer-panel">
                <button type="submit" class="btn btn-primary" @click="save" :class="['btn', 'btn-primary', {inactive: !canSubmitForm}]">
                    <span class="icon icon-ok"></span>
                    {{ $t('common.Save') }}
                </button>
                <router-link to="/crop/cartogram" class="btn btn-default">{{ $t('common.Back') }}</router-link>
            </div>

            <cartogram-point-dialog :elements="model.elements"
                                    :point="activePoint"
                                    @close="closePointDialog"
                                    @submit="submitPoint"
                                    v-if="isShowPointDialog"
                                    :land-plot="form.landPlot"/>

        </div>

        <div class="col-md-9">
            <cartogram-map :height="clientHeight"
                           :plot="model.landPlot"
                           :cells="cellsPolygons"
                           :points="form.points"
                           @select-point="openEditPointDialog"
                           @plot-clicked="plotClicked"
                           @cell-clicked="plotClicked" />
        </div>
    </div>
</template>

<script>
  import CartogramMap from '@app/components/cartogram/CartogramMap'
  import CollapseMenu from '@app/components/BaseComponents/CollapseMenu'
  import Multiselect from 'vue-multiselect'
  import CartogramPointDialog from '@app/components/cartogram/CartogramPointDialog'
  import SimpleSelect from '@app/components/BaseComponents/SimpleSelect'
  import { cellsToPolygons } from '@app/components/cartogram/utils'
  import Vue from 'vue'
  import { mapState } from 'vuex'

  export default {
    name: 'CartogramEdit',
    components: {
      'simple-select': SimpleSelect,
      'cartogram-map': CartogramMap,
      'collapse-menu': CollapseMenu,
      'multi-select': Multiselect,
      'cartogram-point-dialog': CartogramPointDialog,
    },
    mounted () {
      this.handlerHeight()
      window.addEventListener('load', this.handlerHeight)
      window.addEventListener('resize', this.handlerHeight)
      this.drawCartogram()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handlerHeight)
    },
    data () {
      const id = Number(this.$route.params.cartogramId)
      const composedCartograms = this.$store.getters['cartogram/composedCartograms']
      const cartogram = composedCartograms.find(item => item.id === id)

      return {
        // data
        form: {
          landPlot: cartogram.landPlot,
          characteristic: cartogram.characteristic,
          layer: cartogram.layer,
          comment: cartogram.comment,
          date: cartogram.date,
          formattedDate: cartogram.formattedDate,
          points: cartogram.inputPoints.concat([]),
        },
        // flags or temporary states
        element: cartogram.elements[0],
        cellsPolygons: [],
        isShowPointDialog: false,
        activePoint: null,
        // styles
        clientHeight: window.innerHeight - 50,
        leftColStyles: { height: window.innerHeight - 50 },
        leftFormStyles: { height: window.innerHeight - 150 },
      }
    },
    computed: {
      ...mapState('cartogram', ['elements', 'elementLayers', 'elementCharacteristics']),
      ...mapState('fields', ['landPlots']),
      model () {
        const id = Number(this.$route.params.cartogramId)
        const composedCartograms = this.$store.getters['cartogram/composedCartograms']
        return composedCartograms.find(item => item.id === id)
      },
      pointsOfSelectedElement () {
        return this.form.points.filter(p => {
          return Boolean(p.elements[this.element.id])
        })
      },
      canSubmitForm () {
        return this.form.points.length > 2
      },
    },
    watch: {
      element () {
        this.drawCartogram()
      },
    },
    methods: {
      async drawCartogram () {
        const params = { cartogramId: this.model.id, elemId: this.element.id }
        const response = await this.$http.get('crop/cartogram/predicted-cells', { params })
        this.cellsPolygons = cellsToPolygons(this.element.colors, response.data.cells, this.model.elementCells[this.element.id])
      },
      handlerHeight () {
        this.clientHeight = window.innerHeight - 100
        Vue.set(this.leftColStyles, 'height', this.clientHeight + 'px')
        Vue.set(this.leftFormStyles, 'height', this.clientHeight - 50 + 'px')
      },
      plotClicked (position) {
        this.isShowPointDialog = true
        this.activePoint = {
          position,
          elements: {},
        }
      },
      closePointDialog () {
        this.activePoint = null
        this.isShowPointDialog = false
      },
      submitPoint (point) {
        if (this.form.points.indexOf(this.activePoint) !== -1) {
          // edit point
          this.activePoint.position.lat = point.position.lat
          this.activePoint.position.lng = point.position.lng
          this.activePoint.elements = Object.assign({}, point.elements)
        } else {
          // add new point
          this.form.points.push(point)
        }
        this.closePointDialog()
      },
      openNewPointDialog () {
        this.isShowPointDialog = true
        this.activePoint = {
          position: { lat: null, lng: null },
          elements: {},
        }
      },
      openEditPointDialog (point) {
        this.activePoint = point
        this.isShowPointDialog = true
      },
      removePoint (point) {
        const idx = this.form.points.indexOf(point)
        console.log(idx)
        if (idx > -1) {
          const el = this.element
          const elements = Object.assign({}, this.form.points[idx].elements)
          delete elements[el.id]
          this.form.points[idx].elements = elements
          const elemIds = Object.keys(this.form.points[idx].elements)
          if (!elemIds.length) {
            this.form.points.splice(idx, 1)
          }
        }
        console.log(this.form.points)
      },
      getPointLabel (point, index) {
        return point.elements[this.element.id]
          + ' - ' + this.$t('document.Latitude') + ': ' + Number(point.position.lat).toFixed(4)
          + ' - ' + this.$t('document.Longitude') + ': ' + Number(point.position.lng).toFixed(4)
      },
      // actions:
      async save () {
        const id = this.model.id
        const data = {
          date: this.form.date,
          characteristicId: this.form.characteristic.id,
          layerId: this.form.layer.id,
          plotId: this.form.landPlot.id,
          comment: this.form.comment,
          points: this.form.points.concat([]),
        }
        const model = await this.$store.dispatch('cartogram/updateCartogram', { data, id })
        if (model) {
          this.$router.push({ path: '/crop/cartogram' })
        }
      },
    },
  }
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
    .row-btn-wrap {
        float: right;
        height: 30px;
        padding-top: 8px;
    }

    label {
        padding-top: 0 !important;
    }

</style>
