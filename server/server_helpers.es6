import { default_protocol, domains, environment } from '../config/host_settings.es6'
import { packHtml, remove_tags_by_regexp, search_to_params, utils } from '../app/lib/utilities'
import { slugs_regexps } from '../config/seo_settings'
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

// Приватные функции


/**
 * Возвращает параметр, только если сайт работает как production
 *
 * @param      {string}           code    The code
 * @return     {string}           code
 */
const code_only_for_production = (code) => {
  let result
  if (environment.server == 'production') {
    result = code
  } else {
    result = ''
  }
  return result
}

/**
 * Шаблон html страницы
 *
 * @return     {string}  Шаблон html страницы
 */
const pageTemplate = () => {
  return `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        #{head}
        <link rel="shortcut icon" type="image/ico" href="/assets/images/favicon.ico" />
        <link rel="stylesheet" href="/assets/stylesheets/index.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      </head>
      <body>
        <div id='root' class='markup__container'>#{html}</div>
        <script>window.application_state = '#{initialState}'</script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `
}

// Публичные функции

/**
 * Обработчик глобальных ошибок
 *
 * @param      {object}                    err              The error
 * @param      {object}                    incomingRequest  The incoming request
 * @param      {object}                    serverResponse   The server response
 * @param      {Function}                  next             The next
 * @return     {Function}     Обработчик ошибок для express сервера
 */
const errorHandler = (err, incomingRequest, serverResponse, next) => {
  serverResponse.status(500).send("Invent > 500 Server error")
}

/**
 * Извлекает информацию об урл из запроса
 *
 * @param      {object}                    incomingRequest  The incoming request
 * @return     {Object}   Объект со сведениями об урл: {protocol, hostname, location, search}
 */
const extractUriInfo = (incomingRequest) => {
  return {
    hostname: incomingRequest.connection.parser.incoming.headers.host,
    pathname: decodeURIComponent(incomingRequest.connection.parser.incoming._parsedUrl.pathname || '/'),
    location: decodeURIComponent(incomingRequest.connection.parser.incoming._parsedUrl.pathname || '/'),
    protocol: incomingRequest.connection.parser.incoming._parsedUrl.protocol || '',
    search: incomingRequest.connection.parser.incoming._parsedUrl.search || '',
  }
}

/**
 * Логирование ошибок сервера
 *
 * @param      {object}                    err              The error
 * @param      {object}                    incomingRequest  The incoming request
 * @param      {object}                    serverResponse   The server response
 * @param      {Function}                  next             The next
 * @return
 */
const logErrors = (err, incomingRequest, serverResponse, next) => {
  console.error("Error on incomingRequest %s %s", incomingRequest.method, incomingRequest.url)
  console.error(err.stack)
  next(err)
}

/**
 * Рендерит страницу
 *
 * @param      {object}             html          The html
 * @param      {object}             helmet_head   The helmet head
 * @param      {object}             initialState  The initial state
 * @param      {object}             uri           The uri
 * @return     {string}
 */
const renderFullPage = (html, helmet_head, initialState, uri) => {
  // В низ body вставим начальное состояние хранилища
  let replacements = {}
  const LZUTF8 = require('lzutf8')
  replacements.html = html
  replacements.head = helmet_head
  replacements.initialState = LZUTF8.compress(JSON.stringify(initialState), { outputEncoding: 'Base64' })
  let result = packHtml(pageTemplate())
  Object.keys(replacements).forEach((key) => {
    const replace_rule = new RegExp(`#\\\{${key}\\\}`, 'g')
    result = result.replace(replace_rule, replacements[key])
  })
  return result
}


module.exports = {
  errorHandler,
  extractUriInfo,
  logErrors,
  packHtml,
  renderFullPage,
}
