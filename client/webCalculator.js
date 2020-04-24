const { isArray } = require("lodash");
const { fetchExchangeRate } = require("../lib/fetch-exchange-rate-cached");
const { generateReport } = require("../lib/generate-report");
const { parseIssuedShares } = require("../lib/parse-issued-shares");
const { parseSoldShares } = require("../lib/parse-sold-shares");
const {
  generateTaxFillInstructionsData,
} = require("../lib/generate-tax-fill-instructions-data");

const issuedArea = document.querySelector("#issued");
const soldArea = document.querySelector("#sold");
const calculateButton = document.querySelector("#calculate");
const splitCheckbox = document.querySelector("#split");
const report = document.querySelector("#report");

const h = (tag, contents) => {
  const element = document.createElement(tag);
  if (isArray(contents)) {
    contents.forEach((item) => element.append(item));
  } else {
    element.append(contents);
  }
  return element;
};

const renderReport = (data) => {
  report.innerHTML = "";
  data.forEach(({ heading, fields }) => {
    report.append(h("h2", heading));
    fields.forEach(({ name, value, subfields }) => {
      report.append(h("h3", `${name}: `));
      if (value) {
        report.append(h("div", value));
      } else {
        subfields.forEach(({ name, value }) =>
          report.append(h("div", `${name}: ${value}`))
        );
      }
    });
  });
};

calculateButton.addEventListener("click", () => {
  if (!issuedArea.value && !soldArea.value) {
    alert("Please enter issued and sold shares");
    return;
  }

  const issuedShares = parseIssuedShares(issuedArea.value);
  const soldShares = parseSoldShares(soldArea.value);
  const shouldSplit = splitCheckbox.checked;

  generateReport(issuedShares, soldShares, fetchExchangeRate).then((report) => {
    const data = generateTaxFillInstructionsData(report, shouldSplit);
    renderReport(Object.values(data).reverse());
  });
});
