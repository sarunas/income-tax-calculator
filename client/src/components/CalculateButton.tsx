import React from 'react';
import { Button } from '@wix/design-system';

interface CalculateButtonProps {
    onClick: () => void;
}

export const CalculateButton: React.FC<CalculateButtonProps> = ({ onClick }) => (
    <Button onClick={onClick}>Calculate</Button>
);