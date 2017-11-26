import constants from 'flux-constants'
import { domains } from './host_settings'
import { PAGE_TYPES } from '../app/constants/reused_strings'

const slugs_regexps = {
  // id объекта
  id: '[a-z0-9]+',
}

let path_settings = {
  MAP_ROUTER: {
    component_name: 'MapRouterPage',
    type: [PAGE_TYPES.CATALOG],
    location: '/',
    domain: domains.MAIN,
  }
}

/**
* Ссылки в коде всегда формируем через это. Тогда всегда сможем усложнить роутинг, добавляя параметры и т.п.
*/
const seo_link = (path_setting) => {
  return path_setting.location
}

module.exports = {
  path_settings,
  seo_link,
  slugs_regexps,
}
