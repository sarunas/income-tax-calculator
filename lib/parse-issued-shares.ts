// lib/parse-issued-shares.ts
import { trim, uniqBy } from 'lodash';
import { parseDate } from './parse-date';

export interface IssuedShare {
    grantDate: Date;
    grantNumber: string;
    grantType: string;
    vestingDate: Date;
    vestedShares: number;
    stockPrice: number;
    exercisePrice: number;
}

export function parseIssuedShares(content: string): IssuedShare[] {
    const result: IssuedShare[] = [];
    const lines = trim(content).split(/[\n\r]+/).filter(line => line);

    lines.forEach(line => {
        try {
            const [grantDate, grantNumber, grantType, vestingDate, vestedShares, stockPrice, _1, exercisePrice, _2] = line.split(' ');
            result.push({
                grantDate: parseDate(grantDate),
                grantNumber,
                grantType,
                vestingDate: parseDate(vestingDate),
                vestedShares: parseInt(vestedShares, 10),
                stockPrice: parseFloat(stockPrice),
                exercisePrice: parseFloat(exercisePrice),
            });
        } catch (error) {
            console.error(`Error parsing line: ${line}`, error);
            // Skip invalid entries
        }
    });

    return uniqBy(result, ({ grantNumber, vestingDate }) =>
        `${grantNumber}-${vestingDate.toISOString()}`
    );
}