const moduleA = require('./moduleA')

module.exports = {
  name: 'moduleB',
  getA: () => moduleA
}
