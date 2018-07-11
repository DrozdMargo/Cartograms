<template>
    <div class="row">
        <div class="col-sm-3 cartogram-list" v-bind:style="leftColStyles">
            <div class="alert alert-warning" role="alert" style="margin: 15px;" v-if="importing.showWarning">
                <button type="button" class="close" aria-label="Close" @click="clearWarning">
                    <span aria-hidden="true">&times;</span>
                </button>
                {{ warningMessage }}
            </div>

            <div id="cartogram-create-form" v-bind:style="leftFormStyles">
                <div class="form-group" v-bind:class="{error: noLandPlot}">
                    <label class="control-label">{{$t('field.Land Plot Name')}}</label>
                    <multi-select v-model="form.landPlot"
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
                                  @input="$emit('select-plot', form.landPlot)">
                        <span slot="noResult">{{$t('cartogram.No keywords found')}}...</span>
                    </multi-select>
                </div>

                <div class="form-group">
                    <label class="control-label">{{$t('common.Period')}}</label>
                    <div class="full-width">
                        <date-picker v-model="form.date" :lang="langOptions" :format="dateFormat"/>
                    </div>
                </div>

                <div class="form-group left-part">
                    <label class="control-label">{{$t('cartogram.Soil Element Characteristic')}}</label>
                    <simple-select v-model="form.characteristic"
                                   :options="elementCharacteristics"
                                   :label-column="'name'"
                                   :value-column="'id'"
                                   name="characteristicId"/>
                </div>

                <div class="form-group right-part">
                    <label class="control-label">{{ $t('cartogram.Soil Element Layer') }}</label>
                    <simple-select v-model="form.layer"
                                   :options="filteredLayers"
                                   :label-column="'depth'"
                                   :value-column="'id'"
                                   name="layerId"/>
                </div>

                <div class="form-group">
                    <label class="control-label">{{$t('common.Comment')}}</label>
                    <textarea v-model="form.comment" name="comment" class="form-control" title=""></textarea>
                </div>

                <div class="list-title">
                    <h2>{{ $t('cartogram.List of the points') }}</h2>
                </div>

                <div v-if="points.length > 0">
                    <div class="list-item-row" v-for="(point, index) in points">
                        <p class="control-label list-item">
                            {{ getPointLabel(point, index) }}
                            <span v-for="(value, elemId) in point.elements">
                        , {{ getPointElementLabel(elemId, value) }}
                    </span>
                        </p>
                        <button @click="openEditPointDialog(point)" class="btn btn-eye-blue"></button>
                        <button @click="removePoint(index)" class="btn btn-delete"></button>
                    </div>
                </div>

                <div>
                    <p v-if="points.length < 1">{{ $t('cartogram.Create at least 3 points') }}</p>
                    <button @click="openNewPointDialog" class="btn">{{ $t('cartogram.Add Point') }}</button>
                </div>

                <div class="footer-panel">
                    <div class="btn-inline">
                        <a :href="downloadTemplateUrl" :class="['btn', { 'inactive': !canDownloadTemplate }]">
                            {{$t('cartogram.Generate Template') }}
                        </a>
                        <form action="">
                            <label v-uni-for="'import-control'" :class="['btn', { 'inactive': !canImportTemplate }]">
                                {{$t('common.Import')}}
                                <input type="file"
                                       name="import"
                                       @change="importPoints"
                                       ref="importControl"
                                       v-uni-id="'import-control'"
                                       class="hidden"/>
                            </label>
                        </form>
                    </div>

                    <button type="submit" class="btn btn-primary" @click="save" :class="{ inactive: !canSubmitForm}">
                        <span class="icon icon-ok"></span>
                        {{ $t('common.Save') }}
                    </button>
                    <router-link to="/crop/cartogram" class="btn btn-default">{{ $t('common.Back') }}</router-link>
                </div>
            </div>
        </div>

        <div class="col-sm-9" >
            <div v-bind:class="{'loader-wrap': showLoading}">
                <div class="loader"></div>
            </div>

            <cartogram-map :points="points"
                           :plot="form.landPlot"
                           :height="clientHeight"
                           @select-point="openEditPointDialog"
                           @plot-clicked="plotClicked"/>
        </div>

        <cartogram-point-dialog :elements="filteredElements"
                                :point="pointDialog.point"
                                @close="closePointDialog"
                                @submit="savePoint"
                                :land-plot="form.landPlot"
                                v-if="pointDialog.show"/>

        <simple-dialog @submit="resetForm" :width="400" v-if="errorTemplate">
            <p>you are using old template, please generate new and then import</p>
            <div class="text-right">
                <button class="btn btn-primary" @click="errorTemplate = false">
                    <span class="icon icon-ok"></span>
                    {{ $t('common.Ok') }}
                </button>
            </div>
        </simple-dialog>
    </div>
</template>

<script>
  import Vue from 'vue'
  import MultiSelect from 'vue-multiselect'
  import SimpleSelect from '@app/components/BaseComponents/SimpleSelect'
  import SimpleDialog from '@app/components/BaseComponents/SimpleDialog'
  import SpinnerBalls from '@app/components/BaseComponents/SpinnerBalls'
  import DatePicker from 'vue2-datepicker'
  import CartogramMap from '@app/components/cartogram/CartogramMap'
  import CartogramPointDialog from '@app/components/cartogram/CartogramPointDialog'
  import {composeImportedPoints} from '@app/components/cartogram/utils'
  import {mapState, mapGetters} from 'vuex'
  import config from '@app/config'
  import get from 'lodash/get'
  import sortBy from 'lodash/sortBy'

  export default {
    name: 'CartogramCreate',
    refs: {
      map: null,
      importControl: null,
    },
    components: {
      'date-picker': DatePicker,
      'multi-select': MultiSelect,
      'simple-select': SimpleSelect,
      'simple-dialog': SimpleDialog,
      'cartogram-point-dialog': CartogramPointDialog,
      'cartogram-map': CartogramMap,
      'spinner': SpinnerBalls,
    },
    data() {
      let characteristic = null
      let layer = null

      if (this.$route.params.characteristic) {
        characteristic = this.$route.params.characteristic
      } else {
        characteristic = get(this.$store.state.cartogram.elementCharacteristics, 0)
      }

      if (characteristic) {
        const layers = sortBy(this.$store.state.cartogram.elementLayers, 'depth')
        layer = layers.find(item => item.soilElementCharacteristicId === characteristic.id)
      }
      return {
        dateFormat: config.dateFormat,
        form: {
          landPlot: this.$route.params.landPlot ? this.$route.params.landPlot : this.landPlots,
          characteristic,
          layer,
          date: new Date(),
          comment: '',
        },
        points: [],
        pointDialog: {
          show: false,
          point: null,
        },
        importing: {
          extraPointsCount: null,
          showWarning: false,
        },
        clientHeight: window.innerHeight - 50,
        leftColStyles: {},
        leftFormStyles: {height: window.innerHeight - 150},
        noLandPlot: false,
        errorTemplate: false,
        showLoading: false,
      }
    },
    mounted() {
      this.handlerHeight()
      this.findFirstPlot()
      window.addEventListener('load', this.handlerHeight)
      window.addEventListener('resize', this.handlerHeight)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.handlerHeight)
    },
    computed: {
      ...mapState('cartogram', ['elements', 'elementCharacteristics']),
      ...mapState('fields', ['landPlots']),
      ...mapState('translations', ['lang']),
      ...mapGetters('cartogram', ['findElement', 'findUnit', 'findLayer', 'findCharacteristic']),
      elementLayers() {
        return sortBy(this.$store.state.cartogram.elementLayers, 'depth')
      },
      filteredElements() {
        return this.elements.filter(el => el.characteristicId === this.form.characteristic.id)
      },
      filteredPoints() {
        if (!this.form.landPlot) {
          return []
        }
        const newPoints = []
        this.points.forEach((point) => {
          if (point.landPlotId != this.form.landPlot.id) {
            return
          }
          const newPoint = {
            landPlotId: point.landPlotId,
            position: {lat: point.position.lat, lng: point.position.lng},
            elements: {},
          }
          let count = 0
          Object.keys(point.elements).forEach((elementId) => {
            const element = this.findElement(elementId)
            if (element.characteristicId == this.form.characteristic.id) {
              newPoint.elements[elementId] = point.elements[elementId]
              count++
            }
          })
          if (count) {
            newPoints.push(newPoint)
          }
        })
        return newPoints
      },
      filteredLayers() {
        return this.elementLayers.filter(item => item.soilElementCharacteristicId === this.form.characteristic.id)
      },
      warningMessage() {
        if (this.importing.extraPointsCount) {
          return this.$t('cartogram.{number} points has not imported since it is located outside of land plot', {
            number: this.importing.extraPointsCount,
          })
        }
        return this.$t('cartogram.Points has not imported since it is located outside of land plot')
      },
      canImportTemplate() {
        return this.form.landPlot
      },
      downloadTemplateUrl() {
        if (this.form.layer && this.form.characteristic) {
          return `/crop/cartogram/download-template?characteristicId=${ this.form.characteristic.id }&layerId=${ this.form.layer.id }`
        }
        return ''
      },
      canDownloadTemplate() {
        return this.form.characteristic && this.form.layer
      },
      canSubmitForm() {
        return this.form.date && this.form.landPlot && this.filteredPoints.length > 2
      },
      langOptions() {
        return this.lang === 'uk' ? config.datePickerUkOptions : this.lang
      },
    },
    watch: {
      'form.characteristic'() {
        if (this.form.characteristic) {
          this.form.layer = get(this.filteredLayers, 0)
        }
      },
      'form.landPlot'() {
        this.form.landPlot ? this.noLandPlot = false : this.noLandPlot = true
      },
    },
    methods: {
      handlerHeight() {
        this.clientHeight = window.innerHeight - 100
        Vue.set(this.leftColStyles, 'height', this.clientHeight + 'px')
        Vue.set(this.leftFormStyles, 'height', this.clientHeight - 100 + 'px')
      },
      savePoint(point) {
        if (this.points.indexOf(this.pointDialog.point) !== -1) {
          // edit point
          this.pointDialog.point.position.lat = point.position.lat
          this.pointDialog.point.position.lng = point.position.lng
          this.pointDialog.point.elements = Object.assign({}, point.elements)
        } else {
          // add new point
          point.landPlotId = this.form.landPlot.id
          this.points.push(point)
        }
        this.closePointDialog()
      },
      removePoint(index) {
        this.points.splice(index, 1)
      },
      closePointDialog() {
        this.pointDialog.point = null
        this.pointDialog.show = false
      },
      openEditPointDialog(point) {
        this.pointDialog.point = point
        this.pointDialog.show = true
      },
      openNewPointDialog() {
        if (this.form.landPlot) {
          this.pointDialog.point = {position: {}, elements: {}}
          this.pointDialog.show = true
        } else {
          this.noLandPlot = true
        }
      },
      async importPoints() {
        /* @type {HTMLInputElement} input */
        this.clearWarning()
        this.showLoading = true
        const input = this.$refs.importControl
        const formData = new FormData()
        formData.append('file', input.files[0])
        const landPlotId = this.form.landPlot.id
        const headers = {'Content-Type': 'multipart/form-data'}
        const url = 'crop/cartogram/parse-readings?landPlotId=' + landPlotId
        try {
          const response = await this.$http.post(url, formData, {headers})
          const data = response.body
          this.$refs.importControl.value = null
          const layer = this.findLayer(data.layerId)
          const characteristic = this.findCharacteristic(data.characteristicId)
          if (layer) {
            this.form.layer = layer
          }
          if (characteristic) {
            this.form.characteristic = characteristic
          }
          if (data.characteristicId === null || data.layerId === null) {
            this.errorTemplate = true
            this.resetForm()
            console.log('not valid template')
          }
          if (data.extraPointsCount) {
            this.importing.extraPointsCount = data.extraPointsCount
            this.importing.showWarning = true
          } else if (!data.values.length) {
            this.importing.showWarning = true
          } else {
            this.points = composeImportedPoints(data.values, landPlotId)
            this.importing.showWarning = false
          }
          this.showLoading = false
        } catch (e) {
          // TODO:
        }
      },
      async save() {
        this.showLoading = true
        const request = {
          date: parseInt(this.form.date.getTime() / 1000),
          characteristicId: this.form.characteristic.id,
          layerId: this.form.layer.id,
          plotId: this.form.landPlot.id,
          comment: this.form.comment,
          points: this.filteredPoints,
        }
        const model = await this.$store.dispatch('cartogram/createCartogram', request)
        if (model) {
          this.$router.push({
            path: `/crop/cartogram/edit/${ model.id }`,
          })
        }
      },
      plotClicked(position) {
        this.pointDialog.point = {position, elements: {}}
        this.pointDialog.show = true
      },
      clearWarning() {
        this.importing.showWarning = false
      },
      getPointLabel(point, index) {
        return index + 1 + '.'
          + ' ' + this.$t('document.Latitude') + ': ' + Number(point.position.lat).toFixed(4)
          + ', ' + this.$t('document.Longitude') + ': ' + Number(point.position.lng).toFixed(4)
      },
      getPointElementLabel(elementId, value) {
        const element = this.findElement(elementId)
        const unit = this.findUnit(element.unitId)
        return element.name + ' - ' + value + ' ' + unit.name
      },
      resetForm() {
        this.form.landPlot = null
        this.noLandPlot = false
      },
      findFirstPlot() {
        for (const plot of this.landPlots) {
          if (plot.coordinates.collection.length > 0) {
            this.form.landPlot = plot
            break
          }
        }
      },
    },
  }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style lang="scss" scoped>
    textarea {
        resize: none;
    }

    input {
        width: 90%;
    }

    .full-width .mx-datepicker {
        width: 100% !important;
    }

    .btn-inline {
        margin: 12px 0;
        .btn {
            display: inline-block;
            margin-right: 10px;
            padding: 4px 8px;
            @media(max-width: 1450px) {
                font-size: 10px;
            }
            @media(max-width: 1150px) {
                font-size: 9px;
                padding: 4px;
            }
        }
        .btn-import {
            float: right;
        }
        form {
            display: inline-block;
            label {
                width: 100% !important;
            }
        }
    }

    #cartogram-create-form {
        .footer-panel {
            padding-left: 0;
            padding-rigth: 0;
        }
    }

</style>
