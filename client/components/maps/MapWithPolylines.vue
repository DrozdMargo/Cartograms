<template>
    <div>
        <gmap-map :center="center" :zoom="zoom" :max-zoom="15" v-bind:style="mapStyles" style="width: 100%" ref="map">
            <gmap-polygon v-if="landPlots" ref="polygon"  :paths="landPlots.coordinates.getLatLng()" />
            <slot />
        </gmap-map>
    </div>
</template>

<script>
  import Vue from 'vue'
  import config from '@app/config'

  export default {
    name: 'MapsWithPolylines',
    props: {
      height: Number,
    },
    mounted () {
      this.handlerHeight()

    },
    computed: {
      landPlots () {
        console.log(this.$store.state.fields.landPlots)
       // console.log(this.$store.state.fields.list)
          //return this.$store.state.fields.landPlots
      },
    },
    watch: {
      height () {
        this.handlerHeight()
      },
      focusedPlot (plot) {
        this.$nextTick(() => {
          this.sendPolygonDrawn()
        })
        this.$refs.map.$mapCreated.then(() => {
          this.focusCenterPlot(plot)
        })
      },
    },
    data () {
      return {
        center: config.map.defaultCenter,
        zoom: config.map.defaultZoom,
        mapStyles: {},
      }
    },
    methods: {
      sendPolygonDrawn () {
        if (this.$refs.polygon) {
          this.$refs.polygon.$deferredReadyPromise.then(() => {
            this.$emit('polygon-drawn', this.$refs.polygon.$polygonObject)
          })
        }
      },
      handlerHeight () {
        Vue.set(this.mapStyles, 'height', this.height + 'px')
      },
      // focusCenterPlot (plot) {
      //   if (!plot || plot.coordinates.isEmpty()) {
      //     // TODO: check it
      //     this.center = config.map.defaultCenter
      //     this.zoom = 10
      //   } else {
      //     this.$refs.map.fitBounds(plot.coordinates.createGooBounds())
      //     this.$refs.map.$mapObject.setZoom(14)
      //   }
      //   this.$refs.map.$mapObject.setMapTypeId('hybrid')
      // },
      // polygonClicked (e) {
      //   // FOR DEVELOPMENT
      //   this.$emit('polygon-clicked', { lat: e.latLng.lat(), lng: e.latLng.lng() })
      // },
    },
  }
</script>

<style>
</style>
