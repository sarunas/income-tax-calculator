import React from 'react';
import { Table, Text, Card , Accordion } from '@wix/design-system';
import { TaxInstructions } from '../../../lib/generate-tax-fill-instructions-data';
import { Report } from '../../../lib/generate-report';

interface ReportDisplayProps {
    report: TaxInstructions;
    calculationDetails: Report['calculationDetails'];
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, calculationDetails }) => (
    <>
        {Object.entries(report).map(([year, { heading, fields }]) => (
            <Card key={year}>
                <Card.Header title={heading} />
                <Card.Content>
                <Table
                    data={fields}
                    columns={[
                        { title: 'Field', render: (row) => row.name },
                        {
                            title: 'Value',
                            render: (row) => {
                                if (row.value !== undefined) {
                                    return <Text>{row.value}</Text>;
                                } else if (row.subfields) {
                                    return (
                                        <Table
                                            data={row.subfields}
                                            columns={[
                                                { title: 'Subfield', render: (subfield) => subfield.name },
                                                { title: 'Value', render: (subfield) => subfield.value }
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
                        title: 'Show Your Work',
                        children: (
                            <Table
                                rowVerticalPadding="tiny"
                                data={calculationDetails[parseInt(year)]}
                                columns={[
                                    { title: 'Description', render: (row) => row.description },
                                    { title: 'Calculation', render: (row) => row.calculation },
                                    { title: 'Result', render: (row) => row.result }
                                ]}
                            >
                                <Table.Content />
                            </Table>
                        ),
                    },
                ]} />
                </Card.Content>
            </Card>
        ))}
    </>
);