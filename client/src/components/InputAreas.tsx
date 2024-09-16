import React from 'react';
import { FormField, InputArea } from '@wix/design-system';

interface InputAreasProps {
    issuedShares: string;
    soldShares: string;
    onIssuedSharesChange: (value: string) => void;
    onSoldSharesChange: (value: string) => void;
}

export const InputAreas: React.FC<InputAreasProps> = ({
    issuedShares,
    soldShares,
    onIssuedSharesChange,
    onSoldSharesChange
}) => (
    <>
        <FormField label="Shares issued">
            <InputArea
                required
                resizable
                autoGrow
                value={issuedShares}
                onChange={(e) => onIssuedSharesChange(e.target.value)}
                placeholder="28/02/2019 ESPP13783 ESPP 28/02/2019 10 109.25 $ 92.86 $"
                rows={10}
            />
        </FormField>
        <FormField label="Shares sold">
            <InputArea
                resizable
                required
                autoGrow
                value={soldShares}
                onChange={(e) => onSoldSharesChange(e.target.value)}
                placeholder="2729432 Sell of Stock ESPP13783 28/02/2019 ESPP 13/03/2019 10 108.44 $ 92.86 $ 8.29 $"
                rows={5}
                statusMessage={<div>

                </div>}
            />
        </FormField>
    </>
);