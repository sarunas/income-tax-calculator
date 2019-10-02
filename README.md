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
28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $
31/08/2018 ESPP12256 ESPP 31/08/2018 10 111.10 $ 63.79 $
31/08/2017 ESPP9013 ESPP 31/08/2017 10 65.10 $ 53.34 $
28/02/2018 ESPP10925 ESPP 28/02/2018 10 75.05 $ 54.78 $
14/06/2016 5535 RSU 14/09/2017 15 69.05 $ 0.00 $
14/06/2016 5535 RSU 14/12/2017 15 58.55 $ 0.00 $
14/06/2016 5535 RSU 14/03/2018 15 83.20 $ 0.00 $
14/06/2016 5535 RSU 14/06/2018 15 103.00 $ 0.00 $
14/06/2016 5535 RSU 14/09/2018 15 115.95 $ 0.00 $
14/06/2016 5535 RSU 14/12/2018 15 87.20 $ 0.00 $
14/06/2016 5535 RSU 14/03/2019 15 109.27 $ 0.00 $
14/06/2016 5535 RSU 14/06/2017 50 70.50 $ 0.00 $
```

`shares-sold.txt`:
```
2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $
2575819 Sell of Stock ESPP12256 31/08/2018 ESPP 11/09/2018 8 111.60 $ 63.79 $ 10.11 $
2215151 Sell of Stock ESPP9013 31/08/2017 ESPP 06/09/2017 7 66.00 $ 53.34 $ 5.77 $
2365868 Sell of Stock ESPP10925 28/02/2018 ESPP 06/03/2018 10 79.60 $ 54.78 $ 6.71 $
2365869 Sell of Restricted Stock 5535 14/06/2016 RSU 06/03/2018 45 79.60 $ .00 $ 32.99 $
```
