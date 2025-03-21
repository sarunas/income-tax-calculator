import fetch from "node-fetch";

// const LB_EXCHANGE_PAGE_URL = 'https://www.lb.lt/lt/pagal-buhalterines-apskaitos-istatyma-formuojami-euro-ir-uzsienio-valiutu-santykiai?class=Lt&type=day&selected_curr={currency}&date_day={date}'
const LB_EXCHANGE_PAGE_URL =
  "https://www.lb.lt/lt/kasdien-skelbiami-euro-ir-uzsienio-valiutu-santykiai-skelbia-europos-centrinis-bankas?class=Eu&type=day&selected_curr={currency}&date_day={date}";

export async function fetchExchangeRate(date: string, currency: string): Promise<number> {
  const url = LB_EXCHANGE_PAGE_URL.replace("{currency}", currency.toUpperCase()).replace("{date}", date);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const extractCurrencyPattern = /id="curr_rates"(.[\n\r]*)*<span>([\d,]+)<\/span>/gm;
    const result = extractCurrencyPattern.exec(html);
    
    if (!result) {
      throw new Error("Could not extract exchange rate from response");
    }

    return parseFloat(result[2].replace(",", "."));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch exchange rate: ${error.message}`);
    }
    throw error;
  }
} 