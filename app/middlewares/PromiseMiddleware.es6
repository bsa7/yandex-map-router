import { utils } from '../lib/utilities'

// Даёт возможность не городить в экшенах цепочки асинхронных вызовов, а
// использовать нативные (ES6) отложенные обещания (promises)
const serve_action = ({ action, next }) => {
  const { promise, types, ...rest } = action

  // Если экшен не предоставил атрибут 'promise', нужный для асинхронных запросов, делаем просто dispatch
  if (!promise) {
    return next(action)
  }

  // Атрибут 'types', предоставленный экшеном, совместно с атрибутом 'promise', деструктуризуется в три case редусеров:
  // 1. REQUEST - первоначальный редусер, который инициирует асинхронный запрос
  // 2. SUCCESS - case редусера при успешном завершении запроса к api
  // 3. ERROR - case редусера, который обработает исключительную ситуацию
  const [REQUEST, SUCCESS, ERROR] = types

  // Оптимистичный вариант, до того, как будет ответ от асинхронных экшенов
  // будет сделан первый рендеринг страницы, а все значения props будут взяты из текущего состояния хранилища.
  // т.е. при server rendering будет взято начальное состояние.
  next({ ...rest, type: REQUEST })

  // После того, как асинхронный запрос отправлен в api, мы ожидаем второй стадии обработки.
  // Это два последних case, переданные в параметре types экшена.
  return promise.then(
    (result) => next({ ...rest, result, type: SUCCESS }),
    (error) => next({ ...rest, error, type: ERROR })
  )
}

module.exports = {
  promiseMiddleware( objMethods ) {
    return (next) => (action) => {
      let result
      if (utils.value_is_an_array(action)) {
        result = action.map((action_item) => serve_action({ action: action_item, next }))
        result = Promise.all(result)
      } else {
        result = serve_action({ action, next })
      }
      return result
    }
  },
}
