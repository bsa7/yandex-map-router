import { browserHistory } from 'react-router'
import { createStore, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { promiseMiddleware } from '../middlewares/PromiseMiddleware'
import { createLogger } from 'redux-logger'
import combinedReducers from '../reducers'
import thunk from 'redux-thunk'
import DevTools from '../components/presentational/DevTools.es6'
import { routerMiddleware, push } from 'react-router-redux'

const development_env = (process.env.NODE_ENV == 'development')
let enhancer = undefined
const reduxRouterMiddleware = routerMiddleware(browserHistory)
if (development_env) {
  const logger = createLogger({
    level: 'info',
    collapsed: true
  })
  window.$REDUX_DEVTOOL = development_env
  const enhancer_components = [
    applyMiddleware(promiseMiddleware, thunk, logger, reduxRouterMiddleware)
  ]
  enhancer = composeWithDevTools(...enhancer_components)
} else {
  // production
  const enhancer_components = [
    composeWithDevTools(applyMiddleware( promiseMiddleware, thunk, reduxRouterMiddleware))
  ]
  enhancer = compose(...enhancer_components)
}

export default function configureStore( initialState = undefined  ) {
  // Важно, при рендеринге на сервере инициализируем store предварительно сохранённым состоянием
  const store = createStore( combinedReducers, initialState, enhancer)
  module.hot.accept('../reducers', () => {
    const nextRootReducer = require('../reducers')
    store.replaceReducer(nextRootReducer)
  })
  return store
}
