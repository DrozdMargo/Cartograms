export const cellsToPolygons = function (colors, cells, elementCells) {
  const cellsPolygons = []
  if (Array.isArray(cells) && cells.length) {
    const findColor = value => {
      for (const color of colors) {
        if (value >= color.from && value <= color.to) {
          return color.color
        }
      }
      return '#000000'
    }
    for (const cell of cells) {
      const value = parseFloat(cell.value)
      const color = isNaN(value) ? '#000000' : findColor(value)
      cellsPolygons.push({
        id: cell.id,
        coordinates: cell.polygonLatLng,
        color,
      })
    }
    elementCells.forEach(cell => {
      const value = parseFloat(cell.value)
      const color = isNaN(value) ? '#000000' : findColor(value)
      cellsPolygons.push({
        id: cell.id,
        coordinates: cell.polygonLatLng,
        color,
      })
    })
  }
  return cellsPolygons
}

export const composeImportedPoints = (values, landPlotId) => {
  if (!values.length) {
    return []
  }
  const newPoints = []
  let indexes = {}
  values.forEach(point => {
    const index = point.latitude + ':' + point.longitude
    if (!indexes[index]) {
      const newPoint = {
        landPlotId,
        position: {
          lat: point.latitude,
          lng: point.longitude,
        },
        elements: {},
      }
      newPoints.push(newPoint)
      indexes[index] = newPoint
    }
    indexes[index].elements[point.elementId] = point.value
  })
  indexes = undefined
  return newPoints
}
