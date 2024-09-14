import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

ReactDOM.render(
    <React.StrictMode>
        <WixDesignSystemProvider>
            <App />
        </WixDesignSystemProvider>
    </React.StrictMode>,
    document.getElementById('root')
);