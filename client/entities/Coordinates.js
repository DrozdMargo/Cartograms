import { Coordinate } from '@app/entities/Coordinate'
import turfCenterOfMass from '@turf/center-of-mass'
import * as turf from '@turf/helpers'

/**
 * Class is wrapper over the flat coordinates collection.
 * Class has created to cover the following frequently used features:
 * - provides common interface to work with coordinates in different formats
 * - provides frequently used 'format' functions
 * - provides frequently used functions to create another objects, source of which is 'coordinates' collection
 * - provides frequently used functions to detect topology of stored coordinates (such as 'isTriangle', 'calculateCenter' etc.)
 */
export class Coordinates {
  constructor (collection) {
    if (Array.isArray(collection)) {
      this.collection = collection.map(item => {
        if (item instanceof Coordinate) {
          return item
        }
        return new Coordinate(item)
      })
    } else {
      this.collection = []
    }
  }

  at (index) {
    if (index === 'first') index = 0
    if (index === 'last') index = this.collection.length - 1
    return this.collection[index]
  }

  isClosed () {
    return this.at('first').isEqual(this.at('last'))
  }

  getOrdered (options = {}) {
    const orderedCollection = this.collection.map(item => item.getOrdered())
    if (options.closed) {
      if (this.isClosed()) {
        orderedCollection.pop() // to be sure that the reference of last object is equal to first
      }
      orderedCollection.push(orderedCollection[0])
    }
    return orderedCollection
  }

  getLatLng (options = {}) {
    const latLngCollection = this.collection.map(item => item.getLatLng())
    if (options.closed) {
      if (this.isClosed()) {
        latLngCollection.pop() // to be sure that the reference of last object is equal to first
      }
      latLngCollection.push(latLngCollection[0])
    }
    return latLngCollection
  }

  createGooBounds () {
    const bounds = new google.maps.LatLngBounds()
    this.getLatLng().forEach(latLng => bounds.extend(latLng))
    return bounds
  }

  createGooPolygon (options = {}) {
    return new google.maps.Polygon(Object.assign({}, options, { paths: this.getLatLng({ closed: true }) }))
  }

  isEmpty () {
    return !this.collection.length
  }

  calculateCenterOfMass () {
    const geoPolygon = turf.polygon([ this.getOrdered({ closed: true }) ])
    return new Coordinate(turfCenterOfMass(geoPolygon).geometry.coordinates)
  }

  includes (pos) {
    const coordinate = pos instanceof Coordinate ? pos : new Coordinate(pos)
    return google.maps.geometry.poly.containsLocation(coordinate.createGooLatLng(), this.createGooPolygon())
  }

  calculateBounds () {
    let maxLat = -99999
    let minLat = 99999
    let maxLng = -99999
    let minLng = 99999
    this.collection.forEach(coordinate => {
      if (coordinate.lat > maxLat) {
        maxLat = coordinate.lat
      } else if (coordinate.lat < minLat) {
        minLat = coordinate.lat
      }
      if (coordinate.lng > maxLng) {
        maxLng = coordinate.lng
      } else if (coordinate.lng < minLng) {
        minLng = coordinate.lng
      }
    })
    return { maxLat, maxLng, minLat, minLng }
  }
}
