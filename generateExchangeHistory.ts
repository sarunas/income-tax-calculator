import fs from 'fs';
import { fetchExchangeRate } from "./lib/currency-exchange";
import { eachDayOfInterval, formatISO } from "date-fns";

interface RatesJSON {
  [date: string]: number;
}

const ratesJSON: RatesJSON = require("./rates.json");

const currency = "USD";

const args: string[] = process.argv.slice(2);
const year: number = parseInt(args[0], 10);

if (!year) {
  throw new Error("no year provided");
}

const days: string[] = eachDayOfInterval({
  start: new Date(year, 0, 1),
  end: new Date(year, 11, 31),
}).map((day: Date) => formatISO(day, { representation: "date" }));

const run = async (): Promise<void> => {
  for (const day of days) {
    try {
      const rate: number = await fetchExchangeRate(day, currency);
      ratesJSON[day] = rate;
      console.log(day, rate);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching rate for ${day}:`, error);
    }
  }
};

run().then(() => {
  fs.writeFileSync("rates.json", JSON.stringify(ratesJSON, null, 2));
  console.log("fetching done");
  process.exit(0);
}).catch((error: Error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});