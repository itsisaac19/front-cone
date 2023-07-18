/** @jsxImportSource react */
import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { TimePicker } from '@mui/x-date-pickers';



import { qwikify$ } from '@builder.io/qwik-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { createTheme, ThemeProvider } from '@mui/material';
dayjs.extend(customParseFormat)

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

interface TimePickerProps {
    inputHandler: (value: dayjs.Dayjs | null) => void,
    value: string | null | undefined,
    startTime?: any
    endTime?: any
}

export const TimeStartPicker = qwikify$<TimePickerProps>((props) => {
    const value = props.value;
    const inputHandler = props.inputHandler;
    const endTime = props.endTime;

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker  
                onChange={(pickerValue) => {
                    inputHandler(pickerValue);
                }}
                label="Start Time" 
                value={value ? dayjs(value, 'hh:mm A') : dayjs()}
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: '8px',

                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '2px',
                        borderColor:'#414141'
                    }
                }}
                key={'start-picker-key'}
                maxTime={dayjs(endTime, 'hh:mm A')}  
                />
            </LocalizationProvider>
        </ThemeProvider>
    )
})

export const TimeEndPicker = qwikify$<TimePickerProps>((props) => {
    const value = props.value;
    const inputHandler = props.inputHandler;
    const startTime = props.startTime;

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker  
                label="End Time"
                onChange={(pickerValue) => {
                    inputHandler(pickerValue);
                }}
                value={value ? dayjs(value, 'hh:mm A') : dayjs()}
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: '8px',

                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '2px',
                        borderColor:'#414141'
                    },
                    width: 'auto'
                }}  
                key={'end-picker-key'}
                minTime={dayjs(startTime, 'hh:mm A')}  
                />
            </LocalizationProvider>
        </ThemeProvider>
    )
})