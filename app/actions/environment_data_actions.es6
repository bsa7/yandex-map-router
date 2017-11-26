// Экшены, общие и необходимые для функционирования
import types from '../constants/action_types.es6'

module.exports = {
  /**
  * get_uri_info - изоморфно (т.е. и на сервере и на клиенте - получает инфу о текущем урл)
  */
  get_uri_info: (props = {}) => {
    return {
      type: types.URI_INFO_SUCCESS,
      result: props
    }
  },
}
