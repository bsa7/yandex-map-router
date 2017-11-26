import { applyMiddleware, createStore } from 'redux'
import combinedReducers from '../app/reducers'
import express from 'express'
import { fetchComponentData } from '../app/lib/fetchComponentData'
import { host_settings } from '../config/host_settings'
import { Layout, NotFound } from '../app/components/containers'
import path from 'path'
import { promiseMiddleware } from '../app/middlewares/PromiseMiddleware'
import { Provider, connect } from 'react-redux'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { find_route, Routes, routes } from '../config/routes'
import thunk from 'redux-thunk'
import { trace_error, utils } from '../app/lib/utilities'
import {
  errorHandler,
  extractUriInfo,
  logErrors,
  prepareParams,
  renderFullPage,
} from './server_helpers'
import { default_protocol, domains } from '../config/host_settings'
import createHistory from 'history/createMemoryHistory'

const history = createHistory()
const app = express()
app.use('/assets', express.static(path.join(__dirname, '../client/assets')))

// Инициализация webpack hot module replacing (HMR)
const webpack = require('webpack')
const environment_name = process.env.NODE_ENV
const env_development = environment_name === 'development'

// Одному env должен соответствовать один файл config/webpack.<env>.js файл настроек, а так же
// Запускать надо с указанием env, например NODE_ENV='development' (см. package.json)
const config = require(`../config/webpack.${process.env.NODE_ENV}.es6`)
const compiler = webpack(config)

if (env_development) {
  const webpackDevMiddleware = require('webpack-dev-middleware')
  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }))
}
const webpackHotMiddleware = require('webpack-hot-middleware')
app.use(webpackHotMiddleware(compiler))

const finalCreateStore = applyMiddleware(promiseMiddleware, thunk)(createStore)

// app.use(express.static(__dirname + '/static'))
// app.get('/public/bundle.js', () => {
//   const bundle_js_file_name = path.resolve(__dirname, '../public/bundle.js')
//   console.log({ bundle_js_file_name })
//   serverResponse.sendFile(bundle_js_file_name)
// })
app.use(express.static('public'))

// рендеринг на сервере
// incomingRequest - IncomingMessage. Запрос полученный от клиента;
// serverResponse - ServerResponse. Ответ сервера, сессия. Содержит соединение и т.п.
// next - коллбек
app.get("*", (incomingRequest, serverResponse, next) => {
  const context = {}
  const current_uri = extractUriInfo(incomingRequest)
  current_uri.search = decodeURIComponent(current_uri.search)
  const full_url = `${current_uri.hostname}${current_uri.location}`
  const store = { ...finalCreateStore(combinedReducers), current_url: current_uri}
  let initView
  const route = find_route({ routes, current_uri })
  const renderProps = {
    routes: routes,
    params: {},
    components: {},
    matchContext: {},
  }
  if (route) {
    const params = {
      uri_info: {
        current: extractUriInfo(incomingRequest),
        target: route.props.location,
      }
    }
    const components = [Layout, route.props.component]
    const head = ''
    fetchComponentData(store.dispatch, components, params).then((result) => {
      let initialState = {
        ...store.getState(),
      }
      const context = {}
      initView = ReactDOMServer.renderToStaticMarkup(
        <Provider store={store}>
          <StaticRouter location={current_uri} context={context}>
            <Layout>
              <Routes route={route}/>
            </Layout>
          </StaticRouter>
        </Provider>
      )
      return renderFullPage(initView, head, initialState, current_uri)
    }).then((page) => {
      // Отправка страницы клиенту, если всё ок
      const url = `${default_protocol}${incomingRequest.headers.host}${incomingRequest.url}`
      serverResponse.status(200).send(page)
    }).catch((err) => {
      // Вывод сообщения об ошибке и завершение сессии
      trace_error({ 'Произошла ошибка': err })
      serverResponse.end(err)
    })
  } else {
    return render_not_found_page({ renderProps, serverResponse, store, uri: current_uri })
  }
})

app.listen(host_settings.app_port, () => {
  console.log(`Приложение слушает на ${host_settings.app_host}:${host_settings.app_port}`)
  console.log('Компиляция webpack...')
})

/**
 * Рендерит страницу 404
 *
 * @return     {<type>}  { description_of_the_return_value }
 */
const render_not_found_page = ({ renderProps = {}, serverResponse, store, uri }) => {
  const context = {}
  const not_found_route = routes.slice(-1)[0]
  const initView = ReactDOMServer.renderToString(
    <Provider store={store}>
      <StaticRouter location={uri} context={context}>
        <Layout>
          <Routes route={not_found_route}/>
        </Layout>
      </StaticRouter>
    </Provider>
  )
  let head = ''
  const initialState = store.getState()
  const page_content = renderFullPage(initView, head, initialState, uri)
  return serverResponse.status(404).send(page_content)
}
