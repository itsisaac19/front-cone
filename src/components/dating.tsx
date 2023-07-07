/** @jsxImportSource react */
import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'


import { TimePicker } from '@mui/x-date-pickers';

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


import { qwikify$ } from "@builder.io/qwik-react";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat)

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
        <>
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
                maxTime={dayjs(endTime, 'hh:mm A')}  
                />
            </LocalizationProvider>
        </>
    )
})

export const TimeEndPicker = qwikify$<TimePickerProps>((props) => {
    const value = props.value;
    const inputHandler = props.inputHandler;
    const startTime = props.startTime;

    return (
        <>
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
                minTime={dayjs(startTime, 'hh:mm A')}  
                />
            </LocalizationProvider>
        </>
    )
})