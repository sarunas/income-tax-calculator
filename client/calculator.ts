import { fetchExchangeRateCached } from "../lib/fetch-exchange-rate-cached";
import { generateReport } from "../lib/generate-report";
import { parseIssuedShares } from "../lib/parse-issued-shares";
import { parseSameDayShares } from "../lib/parse-same-day-shares";
import { parseSoldShares } from "../lib/parse-sold-shares";
import { generateTaxFillInstructionsData } from "../lib/generate-tax-fill-instructions-data";
import type { YearInstructions, TaxField } from "../lib/types";

// CSS Classes configuration
const classes = {
  container: {
    main: 'mb-8',
    field: 'flex justify-between pr-2',
    fieldWithSubfields: 'space-y-2',
    fieldLabel: 'font-medium text-gray-700',
    fieldValue: 'font-medium',
    subfields: 'pl-4 space-y-2',
    subfield: 'flex justify-between items-center bg-gray-50 p-2 rounded-sm',
    heading: 'text-xl font-semibold text-primary mb-4',
    fieldsContainer: 'space-y-4',
  },
  error: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm',
} as const;

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
      return h('div', { class: classes.container.fieldWithSubfields }, [
        h('div', { class: classes.container.fieldLabel }, field.name),
        h('div', { class: classes.container.subfields }, 
          field.subfields.map(subfield => 
            h('div', { class: classes.container.subfield }, [
              h('span', { class: classes.container.fieldLabel }, subfield.name),
              h('span', { class: classes.container.fieldValue }, formatNumber(subfield.value))
            ])
          )
        )
      ]);
    }
    return h('div', { class: classes.container.field }, [
      h('span', { class: classes.container.fieldLabel }, field.name),
      h('span', { class: classes.container.fieldValue }, formatNumber(field.value))
    ]);
  };

  reportElement.innerHTML = data.map(({ heading, fields }) => 
    h('div', { class: classes.container.main }, [
      h('h2', { class: classes.container.heading }, heading),
      h('div', { class: classes.container.fieldsContainer }, 
        fields.map(field => renderField(field))
      )
    ])
  ).join('');
}

// Event listener for calculate button
calculateButton.addEventListener("click", async () => {
  try {
    if (!issuedArea.value.trim()) {
      reportElement.innerHTML = h('div', { class: classes.error }, 
        'Please enter issued shares data'
      );
      return;
    }

    if (!soldArea.value.trim()) {
      reportElement.innerHTML = h('div', { class: classes.error }, 
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
    reportElement.innerHTML = h('div', { class: classes.error }, 
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}); 