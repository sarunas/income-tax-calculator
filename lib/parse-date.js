function parseDate(date) {
  const [d, m, y] = date.split('/');
  const dateWithOffset = new Date(y, m - 1, d);
  const offsetInMs = dateWithOffset.getTimezoneOffset() * 60 * 1000;
  return new Date(dateWithOffset.getTime() - offsetInMs);
}

module.exports = {
  parseDate,
};
