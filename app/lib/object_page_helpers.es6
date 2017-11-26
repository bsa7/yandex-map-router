/**
*/
const toMapFixed = (value) => {
  return parseFloat(value.toFixed(6))
}

/**
 * Получает на входе массив координат и подбирает по ним центр и границы карты так, чтобы все объекты уместились
 * на этой карте. Поля по краям карты - 5%.
 * @param {Array} markers - массив объектов с координатами { latitude: '54.2323232', longitude: '19.2134223' }
 * @return {Object} { center: [lat, lon], map_bounds: [[lat_min, lon_min], [lat_max, lon_max]] }
 */
const map_bounds_by_object_markers = ({ markers }) => {
  let map_bounds = {
    latitude: {
      max: 0,
      min: Infinity,
    },
    longitude: {
      max: 0,
      min: Infinity,
    },
  }
  markers.forEach((marker) => {
    const latitude = parseFloat(marker.latitude)
    const longitude = parseFloat(marker.longitude)
    if (latitude && latitude != 0.0 && longitude && longitude != 0.0) {
      if (map_bounds.latitude.max < latitude) map_bounds.latitude.max = latitude
      if (map_bounds.longitude.max < longitude) map_bounds.longitude.max = longitude
      if (map_bounds.latitude.min > latitude) map_bounds.latitude.min = latitude
      if (map_bounds.longitude.min > longitude) map_bounds.longitude.min = longitude
    }
  })
  const map_center_latitude = (map_bounds.latitude.min + map_bounds.latitude.max) / 2
  const map_center_longitude = (map_bounds.longitude.min + map_bounds.longitude.max) / 2
  const map_latitude_length = (map_bounds.latitude.max - map_bounds.latitude.min) * 1.1
  const map_longitude_length = (map_bounds.longitude.max - map_bounds.longitude.min) * 1.1
  const map_half_length = Math.max(map_latitude_length, map_longitude_length) / 2
  return {
    map_center: [toMapFixed(map_center_latitude), toMapFixed(map_center_longitude)],
    map_bounds: [
      [toMapFixed(map_center_latitude - map_half_length), toMapFixed(map_center_longitude - map_half_length)],
      [toMapFixed(map_center_latitude + map_half_length), toMapFixed(map_center_longitude + map_half_length)],
    ],
  }
}

/**
 * Безопасно получает элемент матрицы, возвращая undefined, если такой позиции не существует
 *
 * @param {Array} arr - Матрица значений
 * @param {Integer} row - номер строки
 * @param {Integer} column - номер колонки
 * @returns
 */
const safe_pick = (arr, row, column) => {
  return ((arr || [])[row] || [])[column]
}

/**
 * Вычисляет zoom яндекс карты на основе инфы о границах карты
 *
 * @param {Array} map_bounds - [[lat.min, lon.min], [lat.max, lon.max]]
 * @returns {Integer} - Значение zoom
 */
const map_zoom_by_bounds = (map_bounds) => {
  const map_width = safe_pick(map_bounds, 1, 0) - safe_pick(map_bounds, 0, 0)
  const map_height = safe_pick(map_bounds, 1, 1) - safe_pick(map_bounds, 0, 1)
  const map_diagonale = Math.pow(Math.pow(map_width, 2) + Math.pow(map_height, 2), 0.5)
  const guess_zoom = parseInt(11 - Math.log2(map_diagonale))
  return guess_zoom
}

/**
 * Возвращает центр карты по координатам границ
 *
 * @param {Array} map_bounds = [[lat.min, lon.min], [lat.max, lon.max]]
 * @returns {Array} [lat, lon]
 */
const center_of_map_bounds = ({ map_bounds = [] }) => {
  let result = undefined
  if ((map_bounds[0] || [])[0] && (map_bounds[1] || [])[1]) {
    result = [
      toMapFixed((map_bounds[1][0] + map_bounds[0][0]) / 2),
      toMapFixed((map_bounds[1][1] + map_bounds[0][1]) / 2)
    ]
  }
  return result
}

/**
 * Делает формирование ссылки по предоставленному типу страницы, как оно указано в seo_settings#type
 *
 * @param {Object} realty_object - Данные объекта недвижимости
 * @param {String} to - Тип страницы, ссылка на которую сформируется
 * @param {Object} uri_info - Сведения о текущем location
 * @param {Object} additional_search_params - Дополнительные параметры для ссылки
 * @returns
 */
const link_to_by_page_type = ({ realty_object = {}, to, uri_info, additional_search_params = {}, url_matchers = {} }) => {
  const { category, category_group } = realty_object
  const seo_setting_for_to = seo_setting_by_type_and_category({ type: to })

  let slugs = {
    ...redirect_on_map_serializer(realty_object),
    ...parse_slugs({
      current_path: uri_info.current.location,
      target_path: uri_info.target.location,
    })
  }
  slugs.categories = [category]
  slugs.category_groups = [category_group]

  let link_to = apply_slugs_to_template({
    template: seo_setting_for_to.location,
    slugs: slugs,
    slugs_are_mutable: true,
    apply_slugs_to_search: true,
    url_matchers,
  })
  let result = link_to.location
  if (link_to.search) result = `${result}?${link_to.search}`
  return result
}

/**
 * подготавливает массив маркеров объектов
 * 1. Координаты преобразует в Float значения
 * 2. Выкидывает объекты с нулевыми координатами
 * 3. Выкидывает объекты с ошибочными координатами (используя нормальное распределение)
 *
 * @param {Array of Objects} markers - Массив маркеров объектов: [{ application_number, latitude, longitude }, ...]
 * @returns {Array of Objects} markers - массив маркеров объектов
 */
const prepare_markers = (markers) => {
  let latitudes = []
  let longitudes = []
  let result = markers.map((marker) => {
    const latitude = parseFloat(marker.latitude)
    const longitude = parseFloat(marker.longitude)
    if (latitude && latitude != 0 && longitude && longitude != 0) {
      latitudes.push(latitude)
      longitudes.push(longitude)
    }
    return {
      ...marker,
      latitude,
      longitude,
    }
  })
  result = utils.reject_from_array(result, (marker) => {
    return (!marker.latitude || marker.latitude == 0 || !marker.longitude || marker.longitude == 0)
  })

  const latitudes_ariphmetical_middle = ariphmetical_middle(latitudes)
  const latitudes_ariphmetical_deviation = standard_deviation(latitudes)
  const latitude_min = Math.min.apply(null, latitudes)
  const latitude_max = Math.max.apply(null, latitudes)
  const longitudes_ariphmetical_middle = ariphmetical_middle(longitudes)
  const longitudes_ariphmetical_deviation = standard_deviation(longitudes)
  const longitude_min = Math.min.apply(null, longitudes)
  const longitude_max = Math.max.apply(null, longitudes)
  const latitudes_fused_min = latitudes_ariphmetical_middle - latitudes_ariphmetical_deviation >= latitude_min
  const latitudes_fused_max = latitudes_ariphmetical_middle + latitudes_ariphmetical_deviation <= latitude_max
  const latitudes_fused = latitudes_fused_min && latitudes_fused_max
  const longitudes_fused_min = longitudes_ariphmetical_middle - longitudes_ariphmetical_deviation >= longitude_min
  const longitudes_fused_max = longitudes_ariphmetical_middle + longitudes_ariphmetical_deviation <= longitude_max
  const longitudes_fused = longitudes_fused_min && longitudes_fused_max
  result = utils.reject_from_array(result, (marker) => {
    let marker_latitude_fused, marker_longitude_fused
    if (latitudes_fused) {
      marker_latitude_fused = true
    } else {
      marker_latitude_fused = Math.abs(marker.latitude - latitudes_ariphmetical_middle) <= latitudes_ariphmetical_deviation
    }
    if (longitudes_fused) {
      marker_longitude_fused = true
    } else {
      marker_longitude_fused = Math.abs(marker.longitude - longitudes_ariphmetical_middle) <= longitudes_ariphmetical_deviation
    }
    return !marker_latitude_fused || !marker_longitude_fused
  })
  return result
}

module.exports = {
  center_of_map_bounds,
  link_to_by_page_type,
  map_bounds_by_object_markers,
  map_zoom_by_bounds,
  prepare_markers,
  toMapFixed,
}
