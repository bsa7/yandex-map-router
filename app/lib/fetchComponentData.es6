import { EnvironmentDataActions } from '../actions'
import { trace_error, utils } from './utilities'

// На стороне сервера компоненты должны получить данные перед тем как отдать страницу клиенту.
// Каждый из компонентов на отдаваемой странице должен отработать свою fetch логику
// Набор требуемых данных собирается экшенами
// которые отмечены в static массиве needs в компонентах
module.exports = {
  fetchComponentData: (dispatch, components, params) => {
    let result = undefined
    if (components) {
      // Секция static needs = []. Комбинируем все экшены в один набор, не забываем про иерархию.
      let needs = components.reduce((prev, current) => {
        return Object.keys(current).reduce((acc, key) => {
          return current[key].hasOwnProperty('needs') ? current[key].needs.concat(acc) : acc
        }, prev)
      }, [])

      // Секция static page_params = {}, используем заданные в ней параметры, не забываем про иерархию
      let page_params = {}
      components.map((component) => {
        return component.page_params || (() => { return {} })
      }).forEach((component_static_params) => {
        page_params = {...page_params, ...component_static_params()}
      })

      needs.push(EnvironmentDataActions.get_uri_info)
      needs = utils.reject_from_array(needs, (need) => {
        return typeof(need) === 'undefined'
      })
      needs = utils.uniq_array(needs)

      // Запускаем все экшены и дожидаемся их завершения
      const promises = needs.map((need, index) => {
        return dispatch(need({...page_params, ...params}))
      })
      result = Promise.all(promises)
    }
    return result
  },
}
