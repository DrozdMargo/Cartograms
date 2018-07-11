export class Coordinate {
  constructor (pos) {
    if (Array.isArray(pos)) {
      this.lat = pos[0]
      this.lng = pos[1]
    } else {
      this.lat = pos.lat
      this.lng = pos.lng
    }
  }

  createGooLatLng () {
    return new google.maps.LatLng(this.lat, this.lng)
  }

  getOrdered () {
    return [ this.lat, this.lng ]
  }

  getLatLng () {
    return { lat: this.lat, lng: this.lng }
  }

  isEqual (coordinate) {
    return this.lat === coordinate.lat && this.lng === coordinate.lng
  }
}