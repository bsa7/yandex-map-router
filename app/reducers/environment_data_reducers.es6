import types from '../constants/action_types.es6'
import { local_storage_restore_value, local_storage_store_value } from '../lib/utilities'
import { search_to_params } from '../lib/utilities'

module.exports = {
  // Получение сведений о рабочем окружении:
  // Информация о текущем урл
  environment_info: (state = {}, action) => {
    let new_state = state
    switch (action.type) {
    case types.URI_INFO_SUCCESS: {
      let uri_info = action.result.uri_info
      uri_info.current.pathname = decodeURIComponent(uri_info.current.pathname)
      uri_info.current.location = decodeURIComponent(uri_info.current.location)
      if (uri_info.current.search) {
        uri_info.current.search_params = search_to_params(uri_info.current.search)
      }

      if (action.result && action.result.uri_info) new_state = { ...state, uri_info }
      if (new_state.uri_info && new_state.uri_info.target) {
        if (!new_state.uri_info.target.metatags) new_state.uri_info.target.metatags = {}
        if (action.result && action.result.environment && action.result.environment.mode) {
          new_state.environment = action.result.environment
        }
      }
      break
    }

    default: {
      break
    }}
    return new_state
  },
}
