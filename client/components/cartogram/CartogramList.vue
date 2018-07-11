<template>
    <div class="row">
        <div class="col-md-3 cartogram-list field-map-list" v-bind:style="leftColStyles">
            <div id="all-cartograms" v-bind:style="leftFormStyles">
                <div class="form-group">
                    <label class="control-label">{{$t('field.Land Plot Name')}}</label>
                    <multi-select v-model="filter.landPlot"
                                  label="name"
                                  track-by="id"
                                  :placeholder="$t('cartogram.Choose land plot')"
                                  :options="landPlots"
                                  :multiple="false"
                                  :searchable="true"
                                  :options-limit="300"
                                  :show-labels="false"
                                  :show-no-result="false"
                                  :hide-selected="false"
                                  :allow-empty="true"
                                  @input="focusPlot">
                        <span slot="noResult">{{$t('cartogram.No keywords found')}}...</span>
                    </multi-select>
                </div>

                <div class="form-group">
                    <label class="control-label">{{$t('common.Period')}}</label>
                    <div class="full-width">
                        <date-picker v-model="filter.dateRange" range :lang="langOptions" confirm :format="dateFormat"/>
                    </div>
                </div>

                <div class="form-group">
                    <label v-uni-for="'characteristic'" class="control-label">
                        {{$t('cartogram.Soil Element Characteristic')}}
                    </label>
                    <simple-select v-model="filter.characteristic"
                                   :options="elementCharacteristics"
                                   :label-column="'name'"
                                   :value-column="'id'"
                                   :prompt="$t('common.Not set')"
                                   name="characteristicId"/>
                </div>

                <div class="panel-group cartogram-panel-list">
                    <div v-for="group in filteredCartogramGroups" class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <a data-toggle="collapse"
                                   class="collapse-toggle collapsed"
                                   :href="'#plot-' + group.landPlot.id"
                                   @click="focusPlot(group.landPlot)">
                                    {{group.landPlot.name }}
                                </a>
                            </h4>
                        </div>
                        <div class="panel-collapse collapse" :id="'plot-' + group.landPlot.id">
                            <div class="panel-body">
                                <div class="panel-group">
                                    <div class="panel panel-default" v-for="cartogram in group.models">
                                        <div class="panel-heading">
                                            <h4 class="panel-title">
                                                <a data-toggle="collapse" :href="'#cartogram-' +  cartogram.id"
                                                   class="title-list">
                                                    {{cartogramTitle(cartogram)}}
                                                    <i class="has-comment" v-if="cartogram.comment.length">11</i>
                                                </a>
                                            </h4>
                                        </div>
                                        <div class="panel-collapse collapse" :id="'cartogram-' + cartogram.id">
                                            <div class="panel-body cartogram-content">
                                                <div class="cartogram-content-button">
                                                    <a class="btn" :href="exportUrl(cartogram.id)">
                                                        {{$t('common.Export')}}
                                                    </a>
                                                    <router-link :to="{path: '/crop/cartogram/edit/' + cartogram.id}"
                                                                 class="btn">
                                                        {{$t('common.Edit')}}
                                                    </router-link>
                                                    <button type="button" class="btn"
                                                            @click="deleteCartogram(cartogram.id)">
                                                        {{$t('common.Delete')}}
                                                    </button>
                                                </div>
                                                <p v-for="element in cartogram.elements">
                                                    <button class="btn-element"
                                                            type="button"
                                                            @click="drawCartogram(cartogram.id, element.id)">
                                                        {{element.name}}
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-panel">
                <router-link class="btn btn btn-new" :to="{ name: 'Create', params: filter}">{{
                    $t('cartogram.Create Cartogram') }}
                </router-link>
            </div>

        </div>
        <div class="col-md-9">
            <div v-bind:class="{'loader-wrap': showSpinner}">
                <div class="loader"></div>
            </div>
            <maps :height="clientHeight" :focused-plot="focusedLandPlot" :cells="cellsPolygons"
                  @cells-complete="showSpinner = false"/>
        </div>
    </div>
</template>

<script>
  import Map from '@app/components/maps/Map'
  import CollapseMenu from '@app/components/BaseComponents/CollapseMenu'
  import DatePicker from 'vue2-datepicker'
  import Multiselect from 'vue-multiselect'
  import Vue from 'vue'
  import SimpleSelect from '@app/components/BaseComponents/SimpleSelect'
  import {SwappingSquaresSpinner} from 'epic-spinners'
  import {cellsToPolygons} from '@app/components/cartogram/utils'
  import {mapGetters, mapState} from 'vuex'
  import config from '@app/config'

  export default {
    name: 'CartogramList',
    components: {
      'maps': Map,
      'collapse-menu': CollapseMenu,
      'date-picker': DatePicker,
      'multi-select': Multiselect,
      'spinner': SwappingSquaresSpinner,
      'simple-select': SimpleSelect,
    },
    mounted() {
      this.handlerHeight()
      window.addEventListener('load', this.handlerHeight)
      window.addEventListener('resize', this.handlerHeight)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.handlerHeight)
    },
    data() {
      return {
        // source
        landPlots: this.$store.state.fields.landPlots,
        elementCharacteristics: this.$store.state.cartogram.elementCharacteristics,
        elementLayers: this.$store.state.cartogram.elementLayers,
        elements: this.$store.state.cartogram.elements,
        lang: this.$store.state.translations.lang,
        // form
        filter: {
          dateRange: [],
          landPlot: null,
          characteristic: null,
        },
        // datepicker
        dateFormat: config.dateFormat,
        shortcuts: [{
            start: new Date(),
            end: new Date(),
          },
        ],
        // temp state
        cellsPolygons: [],
        focusedLandPlot: null,
        showSpinner: false,
        // styles
        clientHeight: window.innerHeight - 50,
        leftFormStyles: {height: window.innerHeight - 150},
        leftColStyles: {},
      }
    },
    computed: {
      ...mapGetters('cartogram', ['composedCartograms']),
      filteredCartograms() {
        const {dateRange: [start, end], characteristic, landPlot} = this.filter
        return this.composedCartograms.filter(cartogram => {
          if (start && end && (cartogram.date < start.getTime() || cartogram.date > end.getTime())) {
            return false
          }
          if (characteristic && cartogram.characteristic.id !== characteristic.id) {
            return false
          }
          if (landPlot && cartogram.landPlot.id !== landPlot.id) {
            return false
          }
          return true
        })
      },
      filteredCartogramGroups() {
        const groups = {}
        this.filteredCartograms.forEach(cartogram => {
          if (!groups[cartogram.landPlot.id]) {
            groups[cartogram.landPlot.id] = {
              landPlot: cartogram.landPlot,
              models: [],
            }
          }
          groups[cartogram.landPlot.id].models.push(cartogram)
        })
        return groups
      },
      langOptions() {
        return this.lang === 'uk' ? config.datePickerUkOptions : this.lang
      },
    },
    methods: {
      exportUrl(id) {
        return `/crop/cartogram/export-kml?id=${ id }`
      },
      handlerHeight() {
        this.clientHeight = window.innerHeight - 100
        Vue.set(this.leftColStyles, 'height', this.clientHeight + 'px')
        Vue.set(this.leftFormStyles, 'height', this.clientHeight - 50 + 'px')
      },
      focusPlot(plot) {
        if (plot !== this.focusedLandPlot) {
          this.cellsPolygons = []
        }
        this.focusedLandPlot = plot
      },
      cartogramTitle(cartogram) {
        return `${ cartogram.formattedDate } \\ ${ cartogram.characteristic.name } \\ ${ cartogram.layer.depth }`
      },
      // actions:
      async deleteCartogram(id) {
        this.$store.dispatch('cartogram/deleteCartogram', id)
      },
      async drawCartogram(cartogramId, elemId) {
        this.showSpinner = true
        try {
          const params = {cartogramId, elemId}
          const response = await this.$http.get('crop/cartogram/predicted-cells', {params})
          const colors = this.elements.find(el => el.id === elemId).colors
          const cartogram = this.composedCartograms.find(item => item.id === cartogramId)
          this.cellsPolygons = cellsToPolygons(colors, response.data.cells, cartogram.elementCells[elemId])
          this.focusedLandPlot = cartogram.landPlot
        } catch (e) {
          console.error(e.message)
        } finally {
          this.showSpinner = false
        }
      },
    },
  }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style lang="scss">

    .full-width .mx-datepicker {
        width: 100% !important;
    }

    .map-preloader {
        position: absolute;
        z-index: 99;
        background-color: rgba(0, 0, 0, 0.3);
        vertical-align: middle;
        text-align: center;
        width: 100%;
        height: 100%;
        .swapping-squares-spinner {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            position: absolute;
        }
    }

</style>
