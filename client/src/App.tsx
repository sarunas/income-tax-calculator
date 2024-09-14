import React, {useState, useCallback, useEffect} from 'react';
import {InputAreas} from './components/InputAreas';
import {CalculateButton} from './components/CalculateButton';
import {SplitCheckbox} from './components/SplitCheckbox';
import {ReportDisplay} from './components/ReportDisplay';
import {generateTaxFillInstructionsData, TaxInstructions} from "../../lib/generate-tax-fill-instructions-data";
import {parseSoldShares} from "../../lib/parse-sold-shares";
import {parseIssuedShares} from "../../lib/parse-issued-shares";
import {fetchExchangeRate} from "../../lib/fetch-exchange-rate-cached";
import {generateReport, Report} from "../../lib/generate-report";
import {parseSameDayShares} from "../../lib/parse-same-day-shares";
import {Box, Card, Heading} from "@wix/design-system";
import instructionImg from "../../client/instruction.png";

const App: React.FC = () => {
    const [issuedShares, setIssuedShares] = useState('');
    const [soldShares, setSoldShares] = useState('');
    const [shouldSplit, setShouldSplit] = useState(false);
    const [report, setReport] = useState<TaxInstructions | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [calculationDetails, setCalculationDetails] = useState<Report['calculationDetails'] | null>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.Hub.Config({
                tex2jax: {
                    inlineMath: [['\\(', '\\)']],
                    displayMath: [['$$', '$$']],
                    processEscapes: true,
                },
            });
        }
    }, []);

    const handleCalculate = useCallback(async () => {
        if (!issuedShares && !soldShares) {
            setError('Please enter issued and sold shares');
            return;
        }

        try {
            const parsedSoldShares = parseSoldShares(soldShares);
            const parsedSameDayShares = parseSameDayShares(soldShares);
            const parsedIssuedShares = parseIssuedShares(issuedShares);

            parsedSameDayShares.forEach(entry => parsedIssuedShares.push({
                grantDate: entry.grantDate,
                grantNumber: entry.grantNumber,
                grantType: entry.grantType,
                vestingDate: entry.orderDate,
                vestedShares: entry.sharesSold,
                stockPrice: entry.salePrice,
                exercisePrice: entry.exercisePrice,
            }));

            const generatedReport = await generateReport(parsedIssuedShares, parsedSoldShares, fetchExchangeRate);
            const taxInstructions = generateTaxFillInstructionsData(generatedReport, shouldSplit);
            setReport(taxInstructions);
            setCalculationDetails(generatedReport.calculationDetails);
            setError(null);
        } catch (err) {
            setError('An error occurred while generating the report. Please check your inputs and try again.');
            console.error('Calculation error:', err);
        }
    }, [issuedShares, soldShares, shouldSplit]);

    return (
        <Card>
            <Card.Header title="Wix Lithuania Tax Calculator"/>
            <Card.Content>
                <InputAreas
                    issuedShares={issuedShares}
                    soldShares={soldShares}
                    onIssuedSharesChange={setIssuedShares}
                    onSoldSharesChange={setSoldShares}
                />
                <Box marginTop={2} marginBottom={2}><SplitCheckbox checked={shouldSplit} onChange={setShouldSplit}/></Box>
                <Box><CalculateButton onClick={handleCalculate}/></Box>
                {error && <Box marginTop={2} className="error">{error}</Box>}
                {report && calculationDetails && <ReportDisplay marginTop={2} report={report} calculationDetails={calculationDetails}/>}
                    <Box marginTop={2} marginBottom={2}>
                        <Heading size="medium">How to fill declaration?</Heading>
                    </Box>
                    <Box>
                        <img src={instructionImg} width="100%"/>
                    </Box>
            </Card.Content>
            <Card.Divider />
        </Card>
    )
};

export default App;