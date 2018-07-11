<template>
    <map-with-plots :height="clientHeight"
                    :focused-plot="plot"
                    @polygon-drawn="(polygon) => $emit('polygon-drawn', polygon)"
                    @polygon-clicked="plotClicked">
        <gmap-marker v-for="(point, index) in pointsCoordinates"
                     :key="index"
                     :position="point"
                     :clickable="true"
                     :draggable="false"
                     :icon="icon"
                     @click="selectPoint(index)"/>
        <gmap-polygon v-for="point in cells"
                      @click="cellClicked"
                      :ref="'point-' + point.id"
                      v-bind:key="point.id"
                      :paths="point.coordinates"
                      :options="optionsPoint(point.color)">
        </gmap-polygon>
    </map-with-plots>
</template>

<script>
  import MapWithPlots from '@app/components/maps/MapWithoutPlots'
  import config from '@app/config'

  export default {
    name: 'CartogramMap',
    components: {
      'map-with-plots': MapWithPlots,
    },
    props: {
      points: Array,
      plot: Object,
      cells: Array,
    },
    data () {
      return {
        clientHeight: window.innerHeight - 50,
        icon: config.map.markerIcon,
        mapStyles: {},
      }
    },
    mounted () {
      window.addEventListener('load', this.handlerHeight)
      window.addEventListener('resize', this.handlerHeight)
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handlerHeight)
    },
    computed: {
      pointsCoordinates () {
        return this.points.map(p => {
          return {
            lat: Number(p.position.lat),
            lng: Number(p.position.lng),
          }
        })
      },
    },
    watch: {
      'cells' () {
        this.$nextTick(() => {
          this.cells.forEach((point) => {
            const ref = this.$refs['point-' + point.id][0]
            ref.$deferredReadyPromise.then(() => {
              ref.$polygonObject.setOptions({ zIndex: google.maps.Marker.MAX_ZINDEX + 1 })
            })
          })
        })
      },
    },
    methods: {
      selectPoint (index) {
        this.$emit('select-point', this.points[index])
      },
      cellClicked (e) {
        this.$emit('cell-clicked', { lat: e.latLng.lat(), lng: e.latLng.lng() })
      },
      handlerHeight () {
        this.clientHeight = window.innerHeight - 100
      },
      plotClicked (coordinate) {
        this.$emit('plot-clicked', coordinate)
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