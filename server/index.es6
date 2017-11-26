// use babel-register to precompile ES6 syntax
require('babel-register')
// babel-core/register для рендеринга css, scss на стороне сервера
require('babel-core/register')({
  presets: ['env', 'stage-0', 'react']
})
require.extensions['.scss'] = () => {
  return
}
require.extensions['.css'] = () => {
  return
}
require('./server')
