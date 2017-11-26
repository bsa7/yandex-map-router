import types from '../constants/action_types.es6'
import { utils } from '../lib/utilities.es6'

module.exports = {
  shared_props: (state = {}, action) => {
    let new_state = state
    switch (action.type) {
    case types.UPDATE_SHARED_PROPS: {
      new_state = {
        ...state,
        ...action.current,
        state_handler: utils.randomString(12),
      }
      break
    }
    default: {
      break
    }}
    return new_state
  },
}
