// Страница настроек приложения
import React from 'react'
import PropTypes from 'prop-types'
import { ExchangeRatesActions, SharedActions } from '../../actions'
import { connect } from 'react-redux'
import { utils, restore_form_fields, store_form_fields } from '../../lib/utilities'
import { YandexMap } from '../presentational/shared'
import { points_is_the_same, find_point_index, move_array_element } from '../../lib/yandex_map_helpers'

class MapRouterPage extends React.Component {
  static propTypes = {
    route_points: PropTypes.arrayOf(PropTypes.shape({}))
  }

  constructor(props) {
    super(props)
  }

  handle_bounds_change = (params) => {
    console.log({
      handle_bounds_change_props: params
    })
  }

  /**
   * Пользователь прекращает тащить описание точки маршрута (из панели со списоком точек)
   * @param  {[type]}
   * @return {[type]}
   */
  handle_drag_end_route_point = (event) => {
    if (this.props.dragged_over_route_point && this.props.dragged_route_point) {
      const dragged_point_index = find_point_index({
        points: this.props.route_points,
        point: this.props.dragged_route_point,
      })
      const target_point_index = find_point_index({
        points: this.props.route_points,
        point: this.props.dragged_over_route_point,
      })
      let route_points = this.props.route_points
      const route_point = route_points[dragged_point_index]
      move_array_element({
        items: route_points,
        old_index: dragged_point_index,
        new_index: target_point_index,
      })
      this.props.update_current({ route_points })
    }
    this.props.update_current({ dragged_route_point: undefined, dragged_over_route_point: undefined })
  }

  /**
   * Пользователь протаскивает точку маршрута над другой точкой (из панели со списоком точек)
   * @param  {[type]}
   * @return {[type]}
   */
  handle_drag_over_route_point = ({ route_point }) => {
    if (!points_is_the_same(this.props.dragged_over_route_point, route_point)) {
      this.props.update_current({ dragged_over_route_point: route_point })
    }
  }

  /**
   * Пользователь начинает тащить точку маршрута (из панели со списоком точек)
   * @param  {[type]}
   * @return {[type]}
   */
  handle_drag_start_route_point = ({ route_point }) => {
    this.props.update_current({ dragged_route_point: route_point })
  }

  handle_map_click = ({ coordinates }) => {
    const route_points = this.props.route_points
    route_points.push({
      latitude: coordinates[0],
      longitude: coordinates[1],
    })
    this.props.update_current({ route_points })
  }

  handle_placemark_click = ({ marker }) => {
    const route_points = this.props.route_points
    let selected_route_point = route_points.find((route_point) => {
      return points_is_the_same(route_point, marker)
    })
    selected_route_point.highlighted = !selected_route_point.highlighted
    this.props.update_current({ route_points })
  }

  handle_remove_point = ({ route_point }) => {
    let route_points = this.props.route_points
    let removed_point_index = find_point_index({
      points: route_points,
      point: route_point,
    })
    route_points.splice(removed_point_index, 1)
    this.props.update_current({ route_points })
  }

  route_point_description = ({ route_point, index }) => {
    const pointer_class = [
      route_point.highlighted ? 'map-router--body--row--route-point__highlighted' : ''
    ].join(' ')
    return (
      <div
        className='map-router--body--row'
        draggable
        key={`route-point-${index}`}
        onDragEnd={this.handle_drag_end_route_point}
        onDragOver={(event) => this.handle_drag_over_route_point({ route_point })}
        onDragStart={(event) => this.handle_drag_start_route_point({ route_point })}
      >
        <div
          className='map-router--body--row--drag-handler'
        />
        <div
          className={`map-router--body--row--route-point ${pointer_class}`}
          onClick={(event) => this.handle_placemark_click({ marker: route_point })}
        >
          latitude: {route_point.latitude}, longitude: {route_point.longitude}
        </div>
        <div
          className='map-router--body--row--remove'
          onClick={(e) => this.handle_remove_point({ route_point })}
        >
          X
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className='map-router'>
        <div id='map-router-header' className='map-router--header'>
          <h2>Редактор маршрута.</h2>
        </div>
        <div className='map-router--body'>
          <div id='map-router-navigation-panel' className='map-router--body--navigation-panel'>
            {
              this.props.route_points.map((route_point, index) => {
                return this.route_point_description({ route_point, index })
              })
            }
          </div>
          <div id='map-router-yandex-map' className='map-router--body--map-area'>
            <YandexMap
              center={this.props.map_center}
              id="map-router"
              route_points={this.props.route_points}
              on_bounds_change={this.handle_bounds_change}
              on_map_click={this.handle_map_click}
              on_placemark_click={this.handle_placemark_click}
              width="450px"
              height="300px"
            />
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const shared_props = (state.application || {}).shared_props || {}
  const result = {
    dragged_route_point: shared_props.dragged_route_point,
    dragged_over_route_point: shared_props.dragged_over_route_point,
    map_center: shared_props.map_center || [55.759474, 37.610471],
    route_points: shared_props.route_points || restore_form_fields({ form_name: 'route_points' }) || [],
  }
  return result
}

const mapDispatchToProps = (dispatch) => ({
  update_current: (hash) => {
    Object.keys(hash).forEach((key) => {
      store_form_fields({
        form_name: key,
        form_fields: hash[key],
      })
    })
    dispatch(SharedActions.update_current(hash))
  },
})

export default connect(mapStateToProps, mapDispatchToProps)(MapRouterPage)
