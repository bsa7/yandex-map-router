// Типовой пример синхронного экшена - установить заголовок в теге head
import types from '../constants/action_types.es6'
import { utils } from '../lib/utilities.es6'

module.exports = {
  update_current: (hash = {}) => {
    // Инициирует установку каких-либо общих параметров
    return {
      type: types.UPDATE_SHARED_PROPS,
      current: hash
    }
  },
}

