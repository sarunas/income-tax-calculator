import axios from 'axios';

const LB_EXCHANGE_PAGE_URL = 'https://www.lb.lt/lt/kasdien-skelbiami-euro-ir-uzsienio-valiutu-santykiai-skelbia-europos-centrinis-bankas?class=Eu&type=day&selected_curr={currency}&date_day={date}';

export const fetchExchangeRate = async (date: string, currency: string): Promise<number> => {
  const url = LB_EXCHANGE_PAGE_URL
    .replace('{currency}', currency.toUpperCase())
    .replace('{date}', date);

  try {
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = response.data;
    const extractCurrencyPattern = /id="curr_rates"(.[\n\r]*)*<span>([\d,]+)<\/span>/gm;
    const result = extractCurrencyPattern.exec(html);
    if (!result) {
      throw new Error('Failed to extract exchange rate');
    }
    return parseFloat(result[2].replace(',', '.'));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Axios error: ${error.message}`);
    }
    throw error;
  }
};