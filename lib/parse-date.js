function parseDate(date) {
  const [d, m, y] = date.split('/');
  const date = Date(y, m - 1, d);
  var offsetInMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() + offsetInMs);
}

module.exports = {
  parseDate,
};
