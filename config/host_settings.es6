// Здесь находятся настройки nodejs сервера для фронта
module.exports = {
  // Протокол (http или https) по умолчанию
  default_protocol: 'http://',
  // Домены сайта
  domains: {
    MAIN: 'test20171125.xn--h1amiy.xn--p1ai/',
  },
  // Доступ к api
  host_settings: {
    app_host: '0.0.0.0',
    app_port: process.env.PORT || 3003,
  },
  // Информация о режиме работы (development, staging, production)
  environment: {
    mode: 'development',
    server: 'u116',
  },
}
