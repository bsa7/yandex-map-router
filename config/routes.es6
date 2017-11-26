// import { browserHistory, Route } from 'react-router'
// import { PAGE_TYPES, PARAM_VALUES } from '../app/constants/reused_strings'
// import React from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux'
import { path_settings } from './seo_settings'
import { utils } from '../app/lib/utilities'
import Containers from '../app/components/containers'

// Настройки роутинга:
const routes = Object.keys(path_settings).map((key, index) => {
  const path_setting = path_settings[key]
  let route_location = {
    location: path_setting.location,
    hostname: path_setting.domain,
  }
  const component = Containers[path_settings[key].component_name]
  return (
    <Route
      component={component}
      exact
      key={index}
      location={route_location}
      />
  )
})
routes.push(
  <Route component={Containers.NotFound} key='NotFound' />
)

// Матчер для роутов
// Любые осложнения при поиске, например, учёт имени хоста при ресолвинге, slugs матчинг и т.п. описываем здесь:
const find_route = ({ routes, current_uri }) => {
  return routes.find((route) => (route.props.location || {}).location == current_uri.location)
}

class Routes extends React.Component {
  constructor(props) {
    super(props)
    this.current_route = this.props.route
    this.replace_current_route = this.replace_current_route.bind(this)
    if (!this.current_route) {
      this.replace_current_route(props)
    }
  }

  replace_current_route(props) {
    const uri = props.uri_info.current
    if (uri) {
      let matched_route = find_route({ routes, current_uri: uri })
      if (!matched_route) {
        matched_route = (
          <Route component={Containers.NotFound} />
        )
      }
      this.current_route = matched_route
    }
  }

  componentWillMount() {
    this.replace_current_route(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.replace_current_route(nextProps)
  }

  render() {
    return (
      <Switch>
        { this.current_route }
      </Switch>
    )
  }
}

Routes.propTypes = {
  route: PropTypes.object,
  uri_info: PropTypes.object,
}

function mapStateToProps(state, ownProps) {
  const environment_info = (state.application || {}).environment_info || {}
  return {
    uri_info: environment_info.uri_info || {},
  }
}

module.exports = { find_route, Routes: connect(mapStateToProps)(Routes), routes }
