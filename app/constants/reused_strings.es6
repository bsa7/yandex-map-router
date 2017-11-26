import constants from 'flux-constants'
import { domains } from '../../config/host_settings'
import { flip_hash } from '../lib/utilities'

// Преобразует массив строк к хэшу констант
// ['one', 'two'] => {ONE: 'one', TWO: 'two'}
const constants_hash = (names = []) => {
  let result = {}
  names.forEach((name) => {
    result[name.toUpperCase().replace(/\-/g, '_')] = name
  })
  return result
}

const PARAM_VALUES = constants_hash([
  'exchange_rate_values'
])

const PARAM_NAMES = constants_hash([
  'exchange_rates',
])

// Здесь собираем повторяющиеся строки, хэши, массивы и т.п.
module.exports = {
  PARAM_NAMES,
  PARAM_VALUES,
  // Типы страниц сайта
  PAGE_TYPES: constants([
    'CATALOG',             // страницы каталогов
    'ROOT',                // главная страница
  ]),
}
