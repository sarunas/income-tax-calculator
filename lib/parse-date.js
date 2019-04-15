function parseDate(date) {
  const [d, m, y] = date.split('/');
  return new Date(y, m, d);
}

module.exports = {
  parseDate,
};
