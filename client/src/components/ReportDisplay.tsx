import React from 'react';
import { Table, Text, Card } from '@wix/design-system';
import { TaxInstructions } from '../../../lib/generate-tax-fill-instructions-data';

interface ReportDisplayProps {
    report: TaxInstructions;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => (
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
                </Card.Content>
            </Card>
        ))}
    </>
);
