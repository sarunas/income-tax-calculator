# Income Tax Calculator

## Disclaimer

"I will not take any responsibility if it will appear that I was wrong :)"

## How to use?

1. Clone repo `git clone git@github.com:sarunas/income-tax-calculator.git`
2. Run `npm install`
3. Copy issued shares report data to `shares-issued.txt`
4. Copy sold shares report data to `shares-sold.txt`
5. Run `npm run calc`, run `npm run calc:split` if wanna split gain with partner
6. Fill tax declaration
6. Enjoy!

## Example

`shares-issued.txt`:
```
28/02/2019 ESPPXXXXX ESPP 28/02/2019 YY 109.25 $ 92.86 $
17/12/2015 XXXX RSU 17/12/2016 YY 59.95 $ 0.00 $
```

`shares-sold.txt`:
```
2617019 Sell of Restricted Stock XXXX 17/12/2015 RSU 30/11/2018 YY 95.50 $ .00 $ .00 $
2574868 Sell of Restricted Stock ESPPXXXXX 31/08/2018 ESPP 04/09/2018 YY 110.55 $ 63.79 $ .00 $
```
