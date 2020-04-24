const rates = require('../rates.json')

module.exports = {
  fetchExchangeRate: date => Promise.resolve(rates[date])
}
