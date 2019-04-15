function parseDate(date) {
  const [d, m, y] = date.split('/');
  return new Date(y, m - 1, d);
}

module.exports = {
  parseDate,
};
