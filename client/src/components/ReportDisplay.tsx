import React, {useEffect, useRef} from 'react';
import {Table, Text, Card, Accordion, Layout, Cell, Heading} from '@wix/design-system';
import {TaxInstructions} from '../../../lib/generate-tax-fill-instructions-data';
import {Report, CalculationDetail} from '../../../lib/generate-report';

// Add MathJax types
declare global {
    interface Window {
        MathJax: any;
    }
}

interface ReportDisplayProps {
    report: TaxInstructions;
    calculationDetails: Report['calculationDetails'];
}

const MathJaxExpression: React.FC<{ expression: string }> = ({expression}) => {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (nodeRef.current) {
            window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, nodeRef.current]);
        }
    }, [expression]);

    return <span ref={nodeRef}>{`\\(${expression}\\)`}</span>;
};

const formatCalculation = (calculation: string, result: number): React.ReactNode => {
    return <Text>{calculation} = {result}</Text>
};

const renderCalculationDetails = (details: CalculationDetail[]): React.ReactNode => (
    <Table
        rowVerticalPadding="tiny"
        data={details}
        columns={[
            {title: 'Description', render: (row) => <Text>{row.description}</Text>},
            {
                title: 'Calculation',
                render: (row) => formatCalculation(row.calculation, row.result)
            }
        ]}
    >
        <Table.Content/>
    </Table>
);

const renderFormulas = () => (
    <Card>
        <Card.Content>
    <Layout>
        <Cell span={6}>
            <Heading size='medium'>Income Calculation</Heading>
        </Cell>
        <Cell span={6} />
        <Cell span={6} rows={4}>
            <MathJaxExpression expression="GPM308P = \sum_{i} (V_i \times (S_i - E_i)) / R_i" />
        </Cell>
        <Cell span={6}>
            <Text>V_i = Number of vested shares</Text>
        </Cell>
        <Cell span={6}>
            <Text>S_i = Stock price at vesting</Text>
        </Cell>
        <Cell span={6}>
            <Text>E_i = Exercise price</Text>
        </Cell>
        <Cell span={6}>
            <Text>R_i = Exchange rate at vesting date</Text>
        </Cell>
        <Cell span={6} rows={2}>
            <MathJaxExpression expression="GPM308F (F4) = \max(F1 - F2 - 500, 0)" />
        </Cell>
        <Cell span={6}>
            <Text>F1 = Total sales amount</Text>
        </Cell>
        <Cell span={6}>
            <Text>F2 = Total cost basis and fees</Text>
        </Cell>
    </Layout>
        </Card.Content>
    </Card>
);

export const ReportDisplay: React.FC<ReportDisplayProps> = ({report, calculationDetails}) => {
    useEffect(() => {
        if (window.MathJax) {
            window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
        }
    }, [report, calculationDetails]);

    return (
        <>
            <Accordion items= {[{
                title: "Formulas",
                children: renderFormulas()
            }]} />
            {Object.entries(report).map(([year, {heading, fields}]) => (
                <Card key={year}>
                    <Card.Header title={heading}/>
                    <Card.Content>
                        <Table
                            data={fields}
                            columns={[
                                {title: 'Field', render: (row) => row.name},
                                {
                                    title: 'Value',
                                    render: (row) => {
                                        if (row.value !== undefined) {
                                            return <Text>{row.value.toFixed(2)}</Text>;
                                        } else if (row.subfields) {
                                            return (
                                                <Table
                                                    data={row.subfields}
                                                    columns={[
                                                        {title: 'Subfield', render: (subfield) => subfield.name},
                                                        {
                                                            title: 'Value',
                                                            render: (subfield) => subfield.value.toFixed(2)
                                                        }
                                                    ]}
                                                />
                                            );
                                        }
                                        return null;
                                    }
                                }
                            ]}
                        />
                        <Accordion items={[
                            {
                                title: 'Show Calculation Details',
                                children: (
                                    <>
                                        <Card>
                                            <Card.Header title="Income Calculations Details" />
                                            <Card.Content>
                                                {renderCalculationDetails(calculationDetails[parseInt(year)].filter(detail => detail.type === 'income'))}
                                            </Card.Content>
                                        </Card>
                                        <Card>
                                            <Card.Header title="Gain Calculations" />
                                            <Card.Content>
                                                {renderCalculationDetails(calculationDetails[parseInt(year)].filter(detail => detail.type === 'gain'))}
                                            </Card.Content>
                                        </Card>
                                    </>
                                ),
                            },
                        ]}/>
                    </Card.Content>
                </Card>
            ))}
        </>
    );
};