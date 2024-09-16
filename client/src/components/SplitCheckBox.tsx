import React from 'react';
import { Box, Checkbox } from '@wix/design-system';

interface SplitCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const SplitCheckbox: React.FC<SplitCheckboxProps> = ({ checked, onChange }) => (
        <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        >
            Split with partner
        </Checkbox>
);