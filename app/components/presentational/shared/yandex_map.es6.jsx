import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Script from 'react-load-script'
import { map_zoom_by_bounds } from '../../../lib/object_page_helpers'
import { utils } from '../../../lib/utilities'
import { SharedActions } from '../../../actions'
import { pointer_shape } from '../../../serializers/common_prop_types'

class YandexMap extends React.Component {
  static propTypes = {
    center: PropTypes.arrayOf(PropTypes.number),
    id: PropTypes.string,
    markers: pointer_shape,
    on_bounds_change: PropTypes.func,
    on_map_click: PropTypes.func,
    on_placemark_click: PropTypes.func,
    route_points: pointer_shape,
    zoom: PropTypes.number,
  }

  constructor(props) {
    super(props)
  }

  /**
   * Обработчик смены границ для карты. Если для карты передан параметр this.props.on_bounds_change,
   * то вызывается такой обработчик
   * @param  {Object} event - событие, полученное от Yandex API
   */
  handle_bounds_change = (event) => {
    const Map = event.get('map')
    const center = Map.getCenter()
    const map_bounds = Map.getBounds()
    const zoom = parseInt(Map.getZoom())

    this.props.on_bounds_change(event)
  }

  /**
   * Рендерит балун
   * @return React.component
   */
  balloon_content = () => {
    return (
      <div className="balloonContent--card">
        Карточка
      </div>
    )
  }

  /**
   * Обработчик по клику на карте (одиночный клик левой кнопкой мыши)
   * @param  {Object} event - событие Yandex Map API
   */
  handle_map_click = (event) => {
    const coordinates = event.get('coords')
    if (this.props.on_map_click) {
      this.props.on_map_click({ coordinates })
    }
  }

  /**
   * Обработчик по клику на точке
   * @param  {[type]}
   * @return {[type]}
   */
  handle_placemark_click = (event) => {
    const this_placemark = event.get('target')
    if (this.props.on_placemark_click) {
      const marker = this_placemark.properties.get('selfMarker')
      this.props.on_placemark_click({ marker })
    }
    this_placemark.properties.set('balloonContent', this.balloon_content())
    this_placemark.properties.set('balloonContentLayoutWidth', 460)
    this_placemark.properties.set('balloonContentLayoutHeight', 120)
    event.stopPropagation()
  }

  /**
   * Компонент не будет рендерится повторно, если его свойства не изменились
   */
  shouldComponentUpdate = (nextProps, nextState) => {
    let result = false
    if (JSON.stringify(this.props.center) != JSON.stringify(nextProps.center)) result = true
    if ((this.props.markers || []).length != (nextProps.markers || []).length) result = true
    if (this.props.zoom != nextProps.zoom) result = true
    if ((this.props.markers || [])[0] != (nextProps.markers || [])[0]) result = true
    if (this.props.state_handler != nextProps.state_handler) result = true
    return result
  }

  /**
   * делает выбор пресета для точки на карте
   * если точка активная (highlighted == true) - рендерится красным цветом
   * @param  {Object} marker - точка { latitude, longitude, highlighted }
   * @return {String} - наименование пресета
   */
  placemark_icon_preset = ({ marker }) => {
    return marker.highlighted ? 'islands#redCircleIcon' : 'islands#blueCircleIcon'
  }

  componentDidUpdate = (prevProps, prevState) => {
    return this.render_map()
  }

  /**
   * Добавляет на карту массив маркеров
   * @param  {[type]}
   * @param  {Array}
   * @return {[type]}
   */
  add_placemarks = ({ map, markers = [] }) => {
    const placemarks = markers.map((marker) => {
      const placemark = new ymaps.GeoObject({
        geometry: {
          type: 'Point',
          coordinates: [marker.latitude, marker.longitude],
        },
      }, {
        balloonAutoPan: false,
        balloonOutline: true,
        balloonPane: 'outerBalloon',
      })
      placemark.events.add('click', this.handle_placemark_click)
      placemark.options.set('preset', this.placemark_icon_preset({ marker }))
      placemark.properties.set('selfMarker', marker)
      return placemark
    })
    map.geoObjects.removeAll()
    placemarks.forEach((placemark) => {
      map.geoObjects.add(placemark)
    })
  }

  /**
   * Добавляет на карту маршрут по массиву точек
   * @param  {[type]}
   * @param  {Array}
   * @return {[type]}
   */
  add_route_points = ({ map, route_points = [] }) => {
    const multi_route = new ymaps.multiRouter.MultiRoute({
      referencePoints: route_points.map((route_point) => {
        return [
          route_point.latitude,
          route_point.longitude,
        ]
      }),
      params: {
        results: 1
      }
    }, {
      boundsAutoApply: true,
    })

    map.geoObjects.add(multi_route)
    multi_route.model.events.once('requestsuccess', () => {
      const way_points = multi_route.getWayPoints()
      let index = 0
      while(true) {
        const way_point = way_points.get(index)
        const route_point = this.props.route_points[index]
        if (way_point) {
          way_point.options.set('preset', this.placemark_icon_preset({ marker: route_point }))
          index++
        } else {
          break
        }
      }
    })
  }

  render_map = () => {
    const zoom = this.props.zoom || map_zoom_by_bounds(this.props.bounds) || 14
    if (!this.map) {
      this.map = new ymaps.Map(this.props.id, {
        center: this.props.center,
        controls: this.props.controls || ['zoomControl'],
        zoom,
      })
      this.map.events.add('boundschange', this.handle_bounds_change)
      this.map.events.add('wheel', (e) => e.preventDefault())
      this.map.events.add('click', this.handle_map_click)
      this.map.behaviors.disable(['rightMouseButtonMagnifier'])
    }
    if (this.props.bounds) this.map.setBounds(this.props.bounds)
    this.add_placemarks({ map: this.map, markers: this.props.markers })
    this.add_route_points({ map: this.map, route_points: this.props.route_points })
  }

  on_yandex_script_load = () => {
    ymaps.ready(this.render_map)
  }

  render = () => {
    const map_style = {
      height: this.props.height || '500px',
      width: this.props.width || '100%',
    }
    return (
      <div>
        <Script
          onLoad={this.on_yandex_script_load}
          url="https://api-maps.yandex.ru/2.1/?lang=ru_RU"
        />
        <div
          id={this.props.id}
          style={map_style}
        />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const shared_props = (state.application || {}).shared_props || {}
  return {
    state_handler: shared_props.state_handler || ''
  }
}

const mapDispatchToProps = (dispatch) => ({
  update_current: (hash) => dispatch(SharedActions.update_current(hash)),
})

export default connect(mapStateToProps, mapDispatchToProps)(YandexMap)
