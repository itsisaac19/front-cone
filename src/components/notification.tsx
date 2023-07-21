/** @jsxImportSource react */
import * as React from 'react';
import { qwikify$ } from '@builder.io/qwik-react';

import { createTheme, ThemeProvider, Switch } from '@mui/material';

const theme = createTheme(
    {
        palette: {
            mode: 'dark'
        },
        typography: {
            fontFamily: 'inherit'
        }
    },
);

interface NotificationProps {
    pwa: boolean,
    checkedState: boolean,
    changeHandler: any
}

export const NotificationSwitch = qwikify$<NotificationProps>((props) => {
    const { pwa, checkedState, changeHandler } = props;

    console.log({checkedState})

    return (
        <ThemeProvider theme={theme}>
            {pwa ? <Switch name='enabled-switch' onClick={changeHandler} checked={checkedState} key={'pwa-enabled'}  /> : <Switch name='disabled-switch' key={'pwa-disabled'} disabled  />}
        </ThemeProvider>
    )
})