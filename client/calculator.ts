import { isArray } from "lodash-es";
import { fetchExchangeRateCached } from "../lib/fetch-exchange-rate-cached";
import { generateReport } from "../lib/generate-report";
import { parseIssuedShares } from "../lib/parse-issued-shares";
import { parseSameDayShares } from "../lib/parse-same-day-shares";
import { parseSoldShares } from "../lib/parse-sold-shares";
import { generateTaxFillInstructionsData } from "../lib/generate-tax-fill-instructions-data";
import type { YearInstructions } from "../lib/types";

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
function h(tag: string, contents: string | HTMLElement | (string | HTMLElement)[]): HTMLElement {
  const element = document.createElement(tag);
  if (isArray(contents)) {
    contents.forEach((item) => element.append(item));
  } else {
    element.append(contents);
  }
  return element;
}

// Format number with 2 decimal places
function formatNumber(num: number): string {
  return num.toFixed(2);
}

// Render the tax report
const renderReport = (data: YearInstructions[]): void => {
  report.innerHTML = "";
  
  data.forEach(({ heading, fields }) => {
    const yearSection = h("div", [
      h("h2", [
        h("span", heading),
        h("span", " Tax Information")
      ])
    ]);
    yearSection.className = "mb-8 last:mb-0";

    const fieldsContainer = h("div", []);
    fieldsContainer.className = "space-y-4 mt-4";

    fields.forEach(({ name, value, subfields }) => {
      const fieldElement = h("div", []);
      fieldElement.className = "bg-gray-50 rounded-lg p-4";

      if (value !== undefined) {
        fieldElement.append(
          h("div", [
            h("span", name + ": "),
            h("span", formatNumber(value) + " €")
          ])
        );
      } else if (subfields) {
        const subfieldsContainer = h("div", []);
        subfieldsContainer.className = "space-y-2";
        
        subfields.forEach(({ name, value }) => {
          subfieldsContainer.append(
            h("div", [
              h("span", name + ": "),
              h("span", formatNumber(value) + " €")
            ])
          );
        });
        
        fieldElement.append(subfieldsContainer);
      }

      fieldsContainer.append(fieldElement);
    });

    yearSection.append(fieldsContainer);
    report.append(yearSection);
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

  // Convert same day shares to issued shares format
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
      const taxInstructions = generateTaxFillInstructionsData(report, shouldSplit);
      renderReport(Object.values(taxInstructions).reverse());
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report. Please check the console for details.");
    });
}); 