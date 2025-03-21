import { isArray } from "lodash";
import { fetchExchangeRateCached } from "../lib/fetch-exchange-rate-cached";
import { generateReport } from "../lib/generate-report";
import { parseIssuedShares } from "../lib/parse-issued-shares";
import { parseSameDayShares } from "../lib/parse-same-day-shares";
import { parseSoldShares } from "../lib/parse-sold-shares";
import { generateTaxFillInstructionsData } from "../lib/generate-tax-fill-instructions-data";

// DOM Elements
const issuedArea = document.querySelector<HTMLTextAreaElement>("#issued");
const soldArea = document.querySelector<HTMLTextAreaElement>("#sold");
const calculateButton = document.querySelector<HTMLButtonElement>("#calculate");
const splitCheckbox = document.querySelector<HTMLInputElement>("#split");
const report = document.querySelector<HTMLDivElement>("#report");

if (!issuedArea || !soldArea || !calculateButton || !splitCheckbox || !report) {
  throw new Error("Required DOM elements not found");
}

// Helper function to create HTML elements
const h = (tag: string, contents: string | HTMLElement | (string | HTMLElement)[]): HTMLElement => {
  const element = document.createElement(tag);
  if (isArray(contents)) {
    contents.forEach((item) => element.append(item));
  } else {
    element.append(contents);
  }
  return element;
};

// Render the tax report
const renderReport = (data: Array<{ heading: string; fields: Array<{ name: string; value?: number; subfields?: Array<{ name: string; value: number }> }> }>): void => {
  report.innerHTML = "";
  data.forEach(({ heading, fields }) => {
    report.append(h("h2", heading));
    fields.forEach(({ name, value, subfields }) => {
      report.append(h("h3", `${name}: `));
      if (value !== undefined) {
        report.append(h("div", value.toString()));
      } else if (subfields) {
        subfields.forEach(({ name, value }) => report.append(h("div", `${name}: ${value}`)));
      }
    });
  });
};

// Event listener for calculate button
calculateButton.addEventListener("click", () => {
  if (!issuedArea.value && !soldArea.value) {
    alert("Please enter issued and sold shares");
    return;
  }

  const soldShares = parseSoldShares(soldArea.value);
  const sameDayShares = parseSameDayShares(soldArea.value);
  const issuedShares = parseIssuedShares(issuedArea.value);

  sameDayShares.forEach((entry) =>
    issuedShares.push({
      grantDate: entry.grantDate,
      grantNumber: entry.grantNumber,
      grantType: entry.grantType,
      vestingDate: entry.orderDate,
      vestedShares: entry.sharesSold,
      stockPrice: entry.salePrice,
      exercisePrice: entry.exercisePrice,
    }),
  );

  const shouldSplit = splitCheckbox.checked;

  generateReport(issuedShares, soldShares, fetchExchangeRateCached)
    .then((report) => {
      const data = generateTaxFillInstructionsData(report, shouldSplit);
      renderReport(Object.values(data).reverse());
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report. Please check the console for details.");
    });
}); 