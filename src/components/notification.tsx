/** @jsxImportSource react */
import * as React from 'react';
import { qwikify$ } from "@builder.io/qwik-react";

import { Switch } from "@mui/material";

/* const theme = createTheme(
    {
        palette: {
            mode: 'dark'
        },
        typography: {
            fontFamily: 'inherit'
        }
    },
); */

interface NotificationProps {
    pwa: boolean,
}

export const NotificationSwitch = qwikify$<NotificationProps>((props) => {
    const { pwa } = props;
    return (
        <>
            {pwa ? <Switch  /> : <Switch disabled  />}
        </>
    )
})