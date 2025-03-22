import { fetchExchangeRateCached } from "../lib/fetch-exchange-rate-cached";
import { generateReport } from "../lib/generate-report";
import { parseIssuedShares } from "../lib/parse-issued-shares";
import { parseSameDayShares } from "../lib/parse-same-day-shares";
import { parseSoldShares } from "../lib/parse-sold-shares";
import { generateTaxFillInstructionsData } from "../lib/generate-tax-fill-instructions-data";
import type { YearInstructions, TaxField } from "../lib/types";

// DOM Elements
const issuedArea = document.querySelector<HTMLTextAreaElement>("#issued");
const soldArea = document.querySelector<HTMLTextAreaElement>("#sold");
const calculateButton = document.querySelector<HTMLButtonElement>("#calculate");
const splitCheckbox = document.querySelector<HTMLInputElement>("#split");
const reportElement = document.querySelector<HTMLDivElement>("#report");

if (!issuedArea || !soldArea || !calculateButton || !splitCheckbox || !reportElement) {
  throw new Error("Required DOM elements not found");
}

// Helper function for creating HTML elements
const h = (tag: string, attrs: Record<string, string> = {}, children: string | string[] = []): string => {
  const attrsString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  const childrenString = typeof children === 'string' 
    ? children 
    : children.join('');

  return `<${tag}${attrsString ? ' ' + attrsString : ''}>${childrenString}</${tag}>`;
};

// Format number with 2 decimal places
const formatNumber = (value: number | undefined) => value?.toFixed(2) ?? '0.00';

// Render the tax report
function renderReport(data: YearInstructions[]): void {
  if (!reportElement) return;

  const renderField = (field: TaxField) => {
    if (field.subfields) {
      return h('div', { class: 'space-y-2' }, [
        h('div', { class: 'font-medium text-gray-700' }, field.name),
        h('div', { class: 'pl-4 space-y-2' }, 
          field.subfields.map(subfield => 
            h('div', { class: 'flex justify-between items-center bg-gray-50 p-2 rounded' }, [
              h('span', { class: 'text-gray-600' }, subfield.name),
              h('span', { class: 'font-medium' }, formatNumber(subfield.value))
            ])
          )
        )
      ]);
    }
    return h('div', { class: 'flex justify-between pr-2' }, [
      h('span', { class: 'font-medium text-gray-700' }, field.name),
      h('span', { class: 'font-medium' }, formatNumber(field.value))
    ]);
  };

  reportElement.innerHTML = data.map(({ heading, fields }) => 
    h('div', { class: 'mb-8' }, [
      h('h2', { class: 'text-xl font-semibold text-primary mb-4' }, heading),
      h('div', { class: 'space-y-4' }, 
        fields.map(field => renderField(field))
      )
    ])
  ).join('');
}

// Event listener for calculate button
calculateButton.addEventListener("click", async () => {
  try {
    if (!issuedArea.value.trim()) {
      reportElement.innerHTML = h('div', { class: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded' }, 
        'Please enter issued shares data'
      );
      return;
    }

    if (!soldArea.value.trim()) {
      reportElement.innerHTML = h('div', { class: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded' }, 
        'Please enter sold shares data'
      );
      return;
    }

    const issuedShares = parseIssuedShares(issuedArea.value);
    const soldShares = parseSoldShares(soldArea.value);
    const sameDayShares = parseSameDayShares(soldArea.value);

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

    const report = await generateReport(issuedShares, soldShares, fetchExchangeRateCached);
    const taxInstructions = generateTaxFillInstructionsData(report, splitCheckbox.checked);
    renderReport(Object.values(taxInstructions).reverse());
  } catch (error) {
    console.error("Error generating report:", error);
    if (!reportElement) return;
    reportElement.innerHTML = h('div', { class: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded' }, 
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}); 