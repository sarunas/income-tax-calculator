import { formatDate } from "date-fns";
import { fetchExchangeRateCached } from "../lib/fetch-exchange-rate-cached";
import { generateReport } from "../lib/generate-report";
import { generateTaxFillInstructionsData } from "../lib/generate-tax-fill-instructions-data";
import { processShareInputs } from "../lib/process-shares";
import type { YearInstructions, TaxField, Report } from "../lib/types";
import { buildLedger } from "../lib/build-ledger";

// DOM Elements
const issuedArea = document.querySelector<HTMLTextAreaElement>("#issued");
const soldArea = document.querySelector<HTMLTextAreaElement>("#sold");
const calculateButton = document.querySelector<HTMLButtonElement>("#calculate");
const debugCheckbox = document.querySelector<HTMLInputElement>("#debug");
const splitCheckbox = document.querySelector<HTMLInputElement>("#split");
const reportElement = document.querySelector<HTMLDivElement>("#report");

if (!issuedArea || !soldArea || !calculateButton || !splitCheckbox || !reportElement || !debugCheckbox) {
  throw new Error("Required DOM elements not found");
}

// Format number with 2 decimal places
const formatNumber = (value: number | undefined) => value ? Number(value).toFixed(2) : '0.00';

// Render error message
function renderError(message: string): string {
  return `
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
      ${message}
    </div>
  `;
}

// Render the tax report
function renderReport(data: YearInstructions[]): string {
  const renderField = (field: TaxField) => {
    if (field.subfields) {
      return `
        <div class="space-y-2">
          <div class="font-medium text-gray-700">${field.name}</div>
          <div class="pl-4 space-y-2">
            ${field.subfields.map(subfield => `
              <div class="flex justify-between items-center bg-gray-50 p-2 rounded-sm">
                <span class="font-medium text-gray-700">${subfield.name}</span>
                <span class="font-medium">${formatNumber(subfield.value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    return `
      <div class="flex justify-between pr-2">
        <span class="font-medium text-gray-700">${field.name}</span>
        <span class="font-medium">${formatNumber(field.value)}</span>
      </div>
    `;
  };

  return data.map(({ heading, fields }) => `
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-primary mb-4">${heading}</h2>
      <div class="space-y-4">
        ${fields.map(field => renderField(field)).join('')}
      </div>
    </div>
  `).join('');
}

// Render the report debug
function renderDebug(report: Report) {
  const ledger = buildLedger(report);
  const grants = Object.keys(ledger);
  
  return grants.map(grantNumber => (`
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-primary mb-4">Grant: ${grantNumber}</h2>
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Event Type</th>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Date</th>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Shares Changed</th>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Remaining After</th>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Sale Order Number</th>
            <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">Consumed Vestings</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${ledger[grantNumber].map(event => (`
            <tr class="hover:bg-gray-100">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">${event.type}</td>  
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${formatDate(event.date, "yyyy-MM-dd")}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${event.sharesChanged}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${event.remainingAfter}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${event.saleOrderNumber ?? ''}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${event.consumedVestings?.length ? (`
                <ul>
                  ${event.consumedVestings.map(c => (`
                    <li>${formatDate(c.vesting.vestingDate, "yyyy-MM-dd")}: -${c.amount} (${c.remainingShares})</li>`
                  )).join('')}
                </ul>
              `) : ''}</td>
            </tr>
          `)).join(``)}
        <tbody>
      </table>
    </div>
  `)).join('');
}

// Event listener for calculate button
calculateButton.addEventListener("click", async () => {
  try {
    const { issuedShares, soldShares } = processShareInputs(issuedArea.value, soldArea.value);
    const report = await generateReport(issuedShares, soldShares, fetchExchangeRateCached);
    if (debugCheckbox.checked) {
      reportElement.innerHTML = renderDebug(report);
    } else {
      const taxInstructions = generateTaxFillInstructionsData(report, splitCheckbox.checked);
      reportElement.innerHTML = renderReport(Object.values(taxInstructions).reverse());
    }
  } catch (error) {
    console.error("Error generating report:", error);
    reportElement.innerHTML = renderError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}); 