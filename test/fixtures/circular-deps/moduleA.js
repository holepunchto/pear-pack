const moduleB = require('./moduleB')

module.exports = {
  name: 'moduleA',
  getB: () => moduleB
}
