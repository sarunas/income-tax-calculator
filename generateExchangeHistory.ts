import fs from "fs";
import { fetchExchangeRate } from "./lib/currency-exchange";
import { eachDayOfInterval, formatISO } from "date-fns";
import ratesJSON from "./rates.json" with { type: "json" };
import { ExchangeRates } from "./lib/types";


const currency = "USD";

const args = process.argv.slice(2);
const year = parseInt(args[0], 10);

if (!year) {
  throw new Error("no year provided");
}

const days = eachDayOfInterval({
  start: new Date(year, 0, 1),
  end: new Date(year, 11, 31),
}).map((day) => formatISO(day, { representation: "date" }));

const run = async (): Promise<void> => {
  for (const day of days) {
    const rate = await fetchExchangeRate(day, currency);
    (ratesJSON as ExchangeRates)[day] = rate;
    console.log(day, rate);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

run().then(() => {
  fs.writeFileSync("rates.json", JSON.stringify(ratesJSON, null, 2));
  console.log("fetching done");
  process.exit(0);
}).catch(console.error); 