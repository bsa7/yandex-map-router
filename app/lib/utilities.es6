// Основной принцип определения методов такой, чтобы не пришлось импортировать другие модули из lib.
// Это сделано для исключения перекрёстного импорта
require('babel-polyfill')
require('es6-promise').polyfill()
require('isomorphic-fetch')
const store = require('web-storage')().localStorage

// Приватные методы модуля утилит:
// Проверяет статус ответа от api, если не 200, то вызывает ошибку

// Сравнение на пустое значение. Как и в Ruby, считаем 0 непустым значением.
const value_is_empty = (value = null) => {
  let result = [[], '', null, undefined, 'null', 'undefined', {}].includes(value)
  if (value) {
    if (typeof(value) === 'object' && value.length == 0) result = true
    if (typeof(value) === 'object' && Object.keys(value).length == 0) result = true
  }
  return result
}

const check_status = (response) => {
  if (response.ok) {
    return response
  } else {
    const error = new Error(response.statusText)
    error.response = response
    console.log({ error })
    throw error
  }
}

// Получает json из ответа api
const parse_json = (response) => {
  return response.json()
}

// Убирает ведущие пробелы из html и т.п., сжимая его
const packHtml = (html) => {
  return html.replace(/ *[\n\r] */g, '')
}


/**
 * Преобразует параметры в строку
 * @param  {Object} search_params - Параметры поиска объектов в виде хэша
 * @return {string} - search часть урл (без знака вопроса)
 */
const params_to_search = (search_params = {}) => {
  let params = reject_keys({
    hash: search_params,
    blacklist: [
      'category',
      'category_group',
      'domain',
      'filters_enabled',
      'location',
      'object_header_template',
      'type',
    ]
  })
  let result = Object.keys(params).map((key) => {
    if (typeof params[key] !== 'string') {
      return `${key}=${JSON.stringify(params[key])}`
    } else {
      return `${key}=${params[key]}`
    }
  })
  return result.join('&')
}

// декодирует урл - возвращает параметры, например:
// Источник:
// /reseller?category_group=commercial&category=commercial_offices
// Результат:
// {
//   category_group: 'commercial',
//   category: 'commercial_offices'
// }
const search_to_params = (url = '') => {
  const search_string = url.replace(/^[^\?]*\?/, '')
  let result = {}
  if (search_string != '') {
    const params_array = search_string.split(/&/)
    let key, value
    params_array.forEach((param) => {
      [key, value] = param.split(/=/)
      if (!utils.value_is_empty(key)) {
        result[key] = value
        if (/^\{.+\}$/.test(result[key])) {
          result[key] = JSON.parse(decodeURI(result[key]))
        }
        else if (/^\[.+\]$/.test(result[key])) {
          result[key] = JSON.parse(decodeURI(result[key]))
        }
      }
    })
  }
  return result
}

// Удаляет из хэша ключи все или из блэклиста, кроме разрешённых
const reject_keys = ({ hash = {}, whitelist = undefined, blacklist = undefined }) => {
  let result_keys = Object.keys(hash).filter((key) => {
    const in_white_list = !whitelist || whitelist.includes(key) || whitelist.some((rule) => {
      return typeof(rule) == 'object' && rule instanceof RegExp && rule.test(key)
    })
    const in_black_list = blacklist && (blacklist.includes(key) || blacklist.some((rule) => {
      return typeof(rule) == 'object' && rule instanceof RegExp && rule.test(key)
    }))
    return in_white_list && !in_black_list
  })
  let result = {}
  result_keys.forEach((key) => {
    result[key] = hash[key]
  })
  return result
}

// Выводит трейс, даже если ошибки нет
const trace_error = (message) => {
  console.log(message)
  const err = new Error()
  console.log('-'.repeat(88))
  console.log(err)
}

// Проверяет, является ли массивом переданное значение
const value_is_an_array = (value) => {
  return value && (value.constructor === Array)
}


/**
 * Находит в строке html теги по регулярке и удаляет его и всех его потомков, возвращая строку
 *
 * @param html       Строка - исходный html
 * @param tag_begin  Регулярное выражение - начало тега
 * @param tag_end    Строка - конец тега
 */
const remove_tags_by_regexp = ({ html, tag_begin, tag_end }) => {
  let result_html = html
  let match
  while (match = tag_begin.exec(result_html)) {
    if (match) {
      const start_position = match.index
      let buffer = ''
      let open_tag_count = 0
      let closing_tag_count = 0
      for (let position = start_position; position < result_html.length; position++) {
        const symbol_at_position = result_html.slice(position, position + 1)
        if (symbol_at_position == '<') {
          const test_str = result_html.slice(position)
          if (/^<[^<]+?\/>/.test(test_str)) {
            // Самозакрывающиеся теги игнорируем
          } else if (result_html.slice(position, position + 2) == '</') {
            // Закрывающий тег встречен
            closing_tag_count += 1
            if (closing_tag_count == open_tag_count) {
              const end_position = position + tag_end.length
              result_html = result_html.slice(0, start_position - 1) + result_html.slice(end_position)
              break
            }
          } else {
            // Открывающий тег встречен
            open_tag_count += 1
          }
        }
      }
    }
  }
  return result_html
}

/**
 * Проверяет значение на соответствие паттерну и обязательность
 *
 * @param      value     The value
 * @param      pattern   The pattern
 * @param      required  The required
 * @return     bool
 */
const validate_value = ({ value, pattern, required }) => {
  const value_is_empty = utils.value_is_empty(value)
  const regex = pattern
  let value_pattern_valid = !regex || (regex && (new RegExp(regex)).test(value))
  let value_is_valid = (
    (!required && value_is_empty)
    ||
    (!required && !value_is_empty && value_pattern_valid)
    ||
    (required && !value_is_empty && value_pattern_valid)
  )
  return value_is_valid
}

class Utilities {
  constructor() {
    this.title = 'Утилиты'
  }

  // Публичные методы модуля утилит:

  // Возвращает первый не пустой элемент из списка
  any(ary) {
    return ary.filter((elem) => {
      return elem
    })[0]
  }

  // Преобразования строк
  // camelize
  // new_residential_complexes => newResidentialComplexes
  camelize(source) {
    return source.replace(/_+([a-zа-яё])/g, (match, str) => { return str.toUpperCase() })
  }

  // classify - переписывает слово в camelCase, но с большой буквы в начале строки.
  // new_residential_complexes => NewResidentialComplexes
  classify(source) {
    return this.camelize(source).replace(/^([a-zа-яё])/, (match, str) => { return str.toUpperCase() })
  }

  // Сравнение на пустое значение. Как и в Ruby, считаем 0 непустым значением.
  value_is_empty(value = null) {
    return value_is_empty(value)
  }

  // Общий метод для получения данных от api. Все запросы к api только через него.
  // Принцип действия:
  // 1. Ваш экшен инициирует запрос;
  // 2. fetch_json делает асинхронный запрос к api;
  // 3. Форма вызвавшего экшен контейнера обновляется, используя данные из хранилища Redux;
  // 4. ... Ожидание ответа от api;
  // 5. REDUCER_SUCCESS - Полученные данные от api сохранятся в хранилище;
  // 6. Форма вызвавшего экшен контейнера обновляется, используя данные из хранилища Redux;
  fetch_json(props) {
    let promise, result
    const search_string = Object.keys(props.params || {}).map((param_name) => {
      let param_value = props.params[param_name]
      if (param_value !== null && typeof param_value === 'object') {
        param_value = JSON.stringify(param_value)
      }
      return encodeURIComponent(param_name) + "=" + encodeURIComponent(param_value)
    }).join('&')
    const options = {
      headers: {
        'Accept': 'application/json',
      },
    }

    // Придётся параметры запроса энкодить в url, так как в хроме например, fetch с параметрами в body падает
    let api_url = `${props.api_host}${props.api_path}`

    if (props.method === 'post') {
      options.body = search_string
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
      options.method = props.method
      promise = fetch(api_url, options)
    } else {
      if (search_string && search_string != '') api_url += `?${search_string}`
      result = fetch(api_url, options).then(
        check_status
      ).then(
        parse_json
      )
    }
    return result || promise
  }

  // Генерирует рандомную строку заданной длины
  randomString(length, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    var result = ''
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
    return result
  }

  // Выкидывает из массива элементы, если блок задан, то если блок вернул true, если блок не задан - выкидывает пустые
  // (undefined, null, '')
  reject_from_array(self, block = null) {
    for (let index = self.length - 1; index >= 0; index--) {
      if ((block && block(self[index])) || (!block && !self[index])) {
        self.splice(index, 1)
      }
    }
    return self
  }

  /**
   * Тасует массив значений случайным образом
   *
   * @param      Array  source  - Массив значений
   */
  shuffle_array(source) {
    let result = [], source_clone = [...source]
    let source_index
    for (let index = 0; index < source.length; index++) {
      source_index = Math.floor(Math.random() * source_clone.length)
      result.push(source_clone[source_index])
      source_clone.splice(source_index, 1)
    }
    return result
  }

  // Добавляет значение, если его нет и удаляет значение, если оно есть в массиве
  toggle_value_in_array(strings_array, value) {
    strings_array = this.reject_from_array(strings_array, (element) => {
      element == ''
    })
    const index = strings_array.indexOf(value)

    if (index === -1) {
      strings_array.push(value)
    } else {
      strings_array.splice(index, 1)
    }
    return strings_array
  }

  // Проверяет, является ли массивом переданное значение
  value_is_an_array(value) {
    return value_is_an_array(value) // см. определение выше
  }

  // Возвращает массив, оставляя уникальные
  uniq_array(arrArg) {
    return arrArg.filter((elem, pos, arr) => {
      return arr.indexOf(elem) == pos
    })
  }

  // Возвращает последний элемент массива
  last_element(array) {
    let result = undefined
    if (this.value_is_an_array(array)) {
      if (array.length > 0) result = array[array.length - 1]
    }
    return result
  }

  // Проверяет, является ли хэшем ({a: 1, ...}) переданное значение
  value_is_an_object(value) {
    return value && (typeof value  === 'object')
  }
}

const utils = new Utilities()

module.exports = {
  capitalize_words: (text) => {
    return text.split(/\s+/).map((word) => {
      return `${(word[0] || '').toUpperCase()}${(word.slice(1) || '').toLowerCase()}`
    }).join(' ')
  },

  // Очищает хэш от пустых или неопределённых параметров
  compact_hash: (hash) => {
    let result = {}
    Object.keys(hash).forEach((key) => {
      if (!utils.value_is_empty(hash[key])) {
        result[key] = hash[key]
      }
    })
    return result
  },

  /**
   * Находит в хэше значение (сначала ищет по ключу, потом - по значению) и возвращает ключ (или undefined)
   *
   * @param {object}              hash  - Хэш типа ключ - значекние
   * @param {(string|number|...)} value - Искомое значение
   *
   * @return {string}
   */
  find_by_key_or_value: ({ hash, value }) => {
    if (value_is_an_array(value)) value = JSON.stringify(value)
    let result = hash[value]
    if (!result) {
      Object.keys(hash).forEach((key) => {
        if (!result && hash[key] == value) result = key
      })
    }
    return result
  },

  /**
   * Находит в хэше значение и возвращает ключ (или undefined)
   *
   * @param {object}              hash  - Хэш типа ключ - значекние
   * @param {(string|number|...)} value - Искомое значение
   *
   * @return {string}
   */
  find_key_by_value: ({ hash = {}, value }) => {
    if (value_is_an_array(value)) value = JSON.stringify(value)
    let result
    Object.keys(hash).forEach((key) => {
      if (!result && hash[key] == value) result = key
    })
    return result
  },

  // Делает преобразование хэша из
  //   { key1: value1, key2: value2 }
  // в
  //   { value1: key1, value2: key2 }
  // Если нарушается уникальность, приоритет отдаётся первым значениям
  flip_hash: (source) => {
    let result = {}
    Object.keys(source).forEach((key) => {
      const value = source[key]
      if ((typeof value === 'string') && !result[value]) {
        result[value] = key
      }
    })
    return result
  },

  params_to_search,
  search_to_params,

  // Сохранить значения полей в window.localStorage на случай, если пользователь закрое форму,
  // все введённые, но не отправленные значения будут сохранены для удобства
  restore_form_fields: ({ form_name }) => {
    return store.get(form_name)
  },

  // Сохранить значения полей в window.localStorage на случай, если пользователь закрое форму,
  // все введённые, но не отправленные значения будут сохранены для удобства
  store_form_fields: ({ form_fields, form_name }) => {
    store.set(form_name, form_fields)
  },

  // Сохранить значения полей в window.localStorage на случай, если пользователь закрое форму,
  // все введённые, но не отправленные значения будут сохранены для удобства
  local_storage_restore_value: ({ value_name }) => {
    return store.get(value_name)
  },

  // Сохранить значения полей в window.localStorage на случай, если пользователь закрое форму,
  // все введённые, но не отправленные значения будут сохранены для удобства
  local_storage_store_value: ({ value, value_name }) => {
    store.set(value_name, value)
  },

  packHtml,

  // Например, если массив переда как строка ("["1","3"]") преобразует в массив (["1","3"])
  parse_array_if_needed: (array_or_string) => {
    let result = array_or_string
    if (typeof array_or_string === 'string') {
      const items = array_or_string.replace(/[\[\]]/g, '').split(/\,/)
      result = items.map((item) => {
        return item.replace(/^[\"\']/, '').replace(/[\"\']$/, '')
      })
    }
    return result
  },

  reject_keys,
  remove_tags_by_regexp,
  trace_error,
  utils,
}
