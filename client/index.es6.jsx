import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'
import configureStore from '../app/lib/configureStore'
import { fetchComponentData } from '../app/lib/fetchComponentData'
import { Layout } from '../app/components/containers'
import { find_route, routes, Routes } from '../config/routes'
import { utils } from '../app/lib/utilities'

const history = createHistory()
let preloaded_state = null
if (window.application_state) {
  const LZUTF8 = require('lzutf8')
  preloaded_state = JSON.parse(LZUTF8.decompress(window.application_state, { inputEncoding: 'Base64' }))
}

let uri = {}
if ((typeof window) !== 'undefined') {
  uri = window.location
}

const store = configureStore(preloaded_state)

if (history) {
  history.listen((location, action) => {
    let uri = { ...window.location }
    uri.pathname = decodeURIComponent(uri.pathname)
    uri.search = decodeURIComponent(uri.search)
    uri.location = uri.pathname
    location.hostname = uri.hostname
    const matched_route = find_route({ routes, current_uri: uri })
    const params = {
      uri_info: {
        target: matched_route.props.location,
        current: uri,
      }
    }
    if (matched_route) {
      fetchComponentData(store.dispatch, [Layout, matched_route.props.component], params)
    } else {
      fetchComponentData(store.dispatch, [Layout, NotFound], params)
    }
  })
}

let current_uri = { ...window.location }
current_uri.pathname = decodeURIComponent(current_uri.pathname)
current_uri.search = decodeURIComponent(current_uri.search)
current_uri.location = current_uri.pathname
let matched_route = find_route({ routes, current_uri })
const renderProps = {
  routes: routes,
  params: {},
  components: [Layout, matched_route.props.component],
  matchContext: {},
}
if (matched_route) {
  renderProps.uri = current_uri
  const context = {
    history,
  }
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter store={store} context={context} history={history} location={current_uri} {...renderProps}>
        <Layout>
          <Routes route={matched_route} />
        </Layout>
      </ConnectedRouter>
    </Provider>,
    document.querySelector('#root')
  )
}
