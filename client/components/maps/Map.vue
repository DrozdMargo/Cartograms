<template>
    <div>
        <gmap-map :center="center" :zoom="zoom" :max-zoom="15" v-bind:style="mapStyles" style="width: 100%" ref="map">
            <gmap-polygon v-for="plot in plots"
                          :ref="'polygon-' + plot.id"
                          :paths="plot.coordinates.getLatLng()"
                          v-bind:key="plot.id"
                          @click="focusCenterPlot(plot)"
                          :options="optionsPolygon">
            </gmap-polygon>

            <gmap-polygon v-for="point in cells"
                          :ref="'point-' + point.id"
                          v-bind:key="point.id"
                          :paths="point.coordinates"
                          :options="optionsPoint(point.color)">
            </gmap-polygon>
            <slot/>
        </gmap-map>
    </div>
</template>

<script>
  import Vue from 'vue'
  import config from '@app/config'

  export default {
    name: 'Maps',
    props: {
      height: Number,
      focusedPlot: Object,
      cells: Array,
    },
    mounted () {
      this.handlerHeight()
      this.$refs.map.$mapCreated.then(() => {
        this.initialFocusPlots()
      })
    },
    computed: {
      plotLatLng () {
        if (this.focusedPlot && !this.focusedPlot.coordinates.isEmpty()) {
          return this.focusedPlot.coordinates.getLatLng()
        }
        return null
      },
    },
    watch: {
      height () {
        this.handlerHeight()
      },
      focusedPlot (plot) {
        this.focusCenterPlot(plot)
      },
      cells () {
        this.$refs.map.$mapCreated.then(() => {
          this.$emit('cells-complete')
        })
      },
    },
    data () {
      return {
        center: config.map.defaultCenter,
        zoom: config.map.defaultZoom,
        plots: this.$store.state.fields.landPlots,
        mapStyles: {},
        currentPlot: null,
        optionsPolygon: {
          strokeColor: '#000',
          fillColor: '#000',
          fillOpacity: 0,
          strokeOpacity: 1,
          strokeWeight: 4,
        },
      }
    },
    methods: {
      handlerHeight () {
        Vue.set(this.mapStyles, 'height', this.height + 'px')
      },
      focusCenterPlot (plot) {
        this.$emit('focus-plot', plot)
        if (!plot || plot.coordinates.isEmpty()) {
          // TODO: check it
          this.center = config.map.defaultCenter
          this.zoom = config.map.defaultZoom
        } else {
          if (this.currentPlot) {
            if (this.currentPlot !== plot) {
              this.$refs['polygon-' + this.currentPlot.id][0].$polygonObject.setOptions({
                strokeColor: '#000',
                strokeWeight: 5,
              })
              this.currentPlot = plot
            }
          } else {
            this.currentPlot = plot
          }
          this.$refs.map.fitBounds(this.currentPlot.coordinates.createGooBounds())
          if (this.$refs['polygon-' + plot.id]) {
            this.$refs['polygon-' + this.currentPlot.id][0].$polygonObject.setOptions({
              strokeColor: '#ad1a1a',
              strokeWeight: 6,
            })
          }
        }
      },
      initialFocusPlots () {
        const bounds = new google.maps.LatLngBounds()
        this.plots.forEach(plot => {
          plot.coordinates.collection.forEach(coords => {
            bounds.extend(new google.maps.LatLng(coords.lat, coords.lng))
          })
        })
        this.$refs.map.fitBounds(bounds)
        this.$refs.map.$mapObject.setMapTypeId('hybrid')
      },
      optionsPoint (color) {
        return {
          fillColor: color,
          strokeColor: color,
          strokeOpacity: 1,
          fillOpacity: 1,
        }
      },
    },
  }
</script>

<style>
</style>
