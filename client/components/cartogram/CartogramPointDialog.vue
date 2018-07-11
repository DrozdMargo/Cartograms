<template>
    <simple-dialog :width="400">
        <div>
            <div class="alert alert-danger" role="alert" v-if="!isValid">
                <ul>
                    <li v-if="errors.elements">{{ $t('cartogram.At least one element have to be specified') }}</li>
                    <li v-if="errors.outside">{{ $t('cartogram.Point being added is outside of selected land plot') }}</li>
                </ul>
            </div>
            <vue-form :state="formState" @submit.prevent="onSubmit" v-clickoutside="closeModal">
                <validate tag="span">
                    <div :class="['form-group', { 'has-error' : isShowErrorOfField('latitude') }]">
                        <div class="row">
                            <div class="col-xs-5 text-left">
                                <label v-uni-for="'latitude'" class="control-label">
                                    {{ $t('document.Latitude') }} <span class="text-danger">*</span>
                                </label>
                            </div>
                            <div class="col-xs-6">
                                <input v-uni-id="'latitude'"
                                       class="form-control"
                                       type="number"
                                       name="latitude"
                                       v-model="formPoint.position.lat"
                                       required
                                >
                            </div>
                        </div>
                    </div>
                </validate>
                <validate tag="span">
                    <div :class="['form-group', { 'has-error' : isShowErrorOfField('longitude') }]">
                        <div class="row">
                            <div class="col-xs-5 text-left">
                                <label v-uni-for="'longitude'" class="control-label">
                                    {{ $t('document.Longitude') }} <span class="text-danger">*</span>
                                </label>
                            </div>
                            <div class="col-xs-6">
                                <input v-uni-id="'longitude'"
                                       class="form-control"
                                       type="number"
                                       name="longitude"
                                       v-model="formPoint.position.lng"
                                       required
                                >
                            </div>
                        </div>
                    </div>
                </validate>
                <div v-for="element in elements" class="form-group" :key="element.id">
                    <validate tag="span">
                        <div class="row element-row">
                            <div class="col-xs-5 text-left">
                                <label v-uni-for="'element-' + element.id" class="control-label">{{ element.name }},
                                    <span>{{unitName(element.unitId)}}</span>
                                </label>
                            </div>
                            <div class="col-xs-6">
                                <input v-uni-id="'element-' + element.id"
                                       type="number"
                                       class="form-control"
                                       :name="`elements[${element.id}]`"
                                       v-model="formPoint.elements[element.id]">
                            </div>
                        </div>
                    </validate>
                </div>
                <div class="pull-left" role="group">
                    <button class="btn btn-primary" type="submit">
                        <span class="icon icon-ok"></span>
                        {{ $t('common.Submit') }}
                    </button>
                    <button class="btn btn-default" type="button" @click="$emit('close')">{{ $t('common.Close') }}
                    </button>
                </div>
                <div class="clearfix"></div>
            </vue-form>
        </div>
    </simple-dialog>
</template>

<script>
  import SimpleDialog from '@app/components/BaseComponents/SimpleDialog'
  import Vue from 'vue'
  import VueClickoutside from '@app/utils/clickoutside'

  Vue.use(VueClickoutside)

  export default {
    props: {
      point: {
        type: Object,
        required: true,
      },
      landPlot: {
        type: Object,
        required: true,
      },
      elements: {
        type: Array,
        required: true,
      },
    },
    data () {
      return {
        errors: {
          outside: false,
          elements: false,
        },
        formState: {},
        prevSubmitPoint: {},
        formPoint: {
          position: {
            lat: this.point.position.lat,
            lng: this.point.position.lng,
          },
          elements: Object.assign({}, this.point.elements),
        },
        units: this.$store.state.cartogram.elementUnits,
      }
    },
    components: { 'simple-dialog': SimpleDialog },
    computed: {
      isValid () {
        return !this.formState.$submitted || (this.formState.$valid && !this.errors.elements && !this.errors.outside)
      },
    },
    methods: {
      isShowErrorOfField (name) {
        return this.prevSubmitPoint[name] === this.point[name]
          && this.formState[name]
          && this.formState[name].$invalid
          && this.formState.$submitted
      },
      validateAnyElementFilled () {
        this.errors.elements = !Object.values(this.formPoint.elements)
          .find(el => !isNaN(parseFloat(el)))
      },
      validatePointInsidePlot () {
        this.errors.outside = !this.landPlot.coordinates.includes(this.formPoint.position)
      },
      validate () {
        this.validatePointInsidePlot()
        this.validateAnyElementFilled()
      },
      unitName (id) {
        for (const unit of this.units) {
          if (unit.id === id) {
            return unit.name
          }
        }
      },
      onSubmit () {
        this.prevSubmitPoint = Object.assign({}, this.formPoint)
        this.validate()
        if (this.isValid) {
          const { lat, lng } = this.formPoint.position
          this.$emit('submit', {
            position: { lat, lng },
            elements: Object.assign({}, this.formPoint.elements),
          })
        }
      },
      closeModal () {
        if (this.show) {
          this.$emit('close')
        }

      },
    },
  }
</script>

<style lang="scss" scoped>
    .element-row {
        line-height: 32px; /* value is equal to height of bootstrap input */
    }

    .pull-left {
        margin-top: 10px;
        .btn {
            margin-right: 10px;
        }
    }
</style>
