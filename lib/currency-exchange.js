const fetch = require('node-fetch');

const LB_EXCHANGE_PAGE_URL = 'https://www.lb.lt/lt/pagal-buhalterines-apskaitos-istatyma-formuojami-euro-ir-uzsienio-valiutu-santykiai?class=Lt&type=day&selected_curr={currency}&date_day={date}'

const fetchExchangeRage = (date, currency) => {
  const url = LB_EXCHANGE_PAGE_URL
    .replace('{currency}', currency.toUpperCase())
    .replace('{date}', date);

  return fetch(url)
    .then(response => {
      const status = response.status;
      if (status < 400) {
        return response;
      }

      return Promise.reject(response);
    })
    .then(response => response.text().catch(() => Promise.resolve()))
    .then(html => {
      const extractCurrencyPattern = /id="curr_rates"(.[\n\r]*)*<span>([\d,]+)<\/span>/gm;
      const result = extractCurrencyPattern.exec(html);
      return parseFloat(result[2].replace(',', '.'));
    });
}

module.exports = {
  fetchExchangeRage,
};
