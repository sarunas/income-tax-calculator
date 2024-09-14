import { isArray } from "lodash";
import { fetchExchangeRate } from "../lib/fetch-exchange-rate-cached";
import { generateReport, Report } from "../lib/generate-report";
import { parseIssuedShares, IssuedShare } from "../lib/parse-issued-shares";
import { parseSameDayShares, SameDayShare } from "../lib/parse-same-day-shares";
import { parseSoldShares, SoldShare } from "../lib/parse-sold-shares";
import { generateTaxFillInstructionsData, TaxInstructions } from "../lib/generate-tax-fill-instructions-data";

const issuedArea = document.querySelector<HTMLTextAreaElement>("#issued");
const soldArea = document.querySelector<HTMLTextAreaElement>("#sold");
const calculateButton = document.querySelector<HTMLButtonElement>("#calculate");
const splitCheckbox = document.querySelector<HTMLInputElement>("#split");
const report = document.querySelector<HTMLDivElement>("#report");

const h = (tag: string, contents: string | Node | (string | Node)[]): HTMLElement => {
  const element = document.createElement(tag);
  if (isArray(contents)) {
    contents.forEach((item) => element.append(item));
  } else {
    element.append(contents);
  }
  return element;
};

const renderReport = (data: TaxInstructions): void => {
  if (!report) return;

  report.innerHTML = "";
  Object.values(data).reverse().forEach(({ heading, fields }) => {
    report.append(h("h2", heading));
    fields.forEach(({ name, value, subfields }) => {
      report.append(h("h3", `${name}: `));
      if (value !== undefined) {
        report.append(h("div", value.toString()));
      } else if (subfields) {
        subfields.forEach(({ name, value }) =>
          report.append(h("div", `${name}: ${value}`))
        );
      }
    });
  });
};

if (calculateButton && issuedArea && soldArea && splitCheckbox) {
  calculateButton.addEventListener("click", async () => {
    if (!issuedArea.value && !soldArea.value) {
      alert("Please enter issued and sold shares");
      return;
    }

    const soldShares: SoldShare[] = parseSoldShares(soldArea.value);
    const sameDayShares: SameDayShare[] = parseSameDayShares(soldArea.value);
    const issuedShares: IssuedShare[] = parseIssuedShares(issuedArea.value);

    sameDayShares.forEach(entry => issuedShares.push({
      grantDate: entry.grantDate,
      grantNumber: entry.grantNumber,
      grantType: entry.grantType,
      vestingDate: entry.orderDate,
      vestedShares: entry.sharesSold,
      stockPrice: entry.salePrice,
      exercisePrice: entry.exercisePrice,
    }));

    const shouldSplit = splitCheckbox.checked;

    try {
      const generatedReport: Report = await generateReport(issuedShares, soldShares, fetchExchangeRate);
      const data: TaxInstructions = generateTaxFillInstructionsData(generatedReport, shouldSplit);
      renderReport(data);
    } catch (error) {
      console.error('An error occurred:', error);
      alert('An error occurred while generating the report. Please check the console for more details.');
    }
  });
}