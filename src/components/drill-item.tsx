import { $, component$, noSerialize, useSignal, useTask$, useVisibleTask$, type QRL } from "@builder.io/qwik";

import type { Database } from "~/supabase";
type DrillRow = Database['public']['Tables']['drills']['Row'];

import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)


export const parseRange = (startString?: string | null | undefined, endString?: string | null | undefined) => {
    const range = {
        start: startString,
        end: endString,
        duration: '',
        display: false,
    }

    if (!startString || !endString) {
        return range;
    }


    const start = dayjs(startString, 'hh:mm A');
    const end = dayjs(endString, 'hh:mm A');
    range.start = start.format('h:mm');
    range.end = end.format('h:mm');

    if (start.hour() >= 12 && end.hour() >= 12) {
        //console.log('both after 12')
        range.end += ' PM';
    } else {
        if (start.hour() < 12) {
            //console.log('start is before');
            range.start += ' AM';
            range.end += ' PM';
        } else {
            //console.log('end is before')
            range.start += ' PM';
            range.end += ' AM';
        }
    }

    const diff = start.diff(end, 'minutes');
    //console.log({diff});

    range.duration = `${Math.abs(diff)} min`;
    range.display = true;
    
    return range;
}
interface CurrentLiveDrillBoxProps {
    data: Partial<DrillRow>,
}

export const CurrentLiveDrillBox = component$((props: CurrentLiveDrillBoxProps) => {
    const { data } = props;

    const range = parseRange(data.time_start, data.time_end);
    const percentageOfRange = useSignal('0');
    const start = noSerialize(dayjs(data.time_start, 'hh:mm A'));
    const end = noSerialize(dayjs(data.time_end, 'hh:mm A'))

    const reCheck = $((startUnix: number, endUnix: number) => {
        const current = dayjs().unix();
        console.log({current})
        const offsetEnd = endUnix - startUnix;
        const offsetCurrent = current - startUnix;
    
        const fraction = offsetCurrent / offsetEnd;

        //percentageOfRange.value = (fraction * 100).toFixed(2)
    })

    useTask$(({track}) => {
        track(() => data.time_end);

        if (start && end) {
            reCheck(start.unix(), end.unix());
        }
    })


    useVisibleTask$(() => {
        //setInterval(reCheck, 1000)
    })

    return (
        <div class='current-live-drill-box'>
            <div class="progress-background" style={{
                width: `${percentageOfRange.value}%`
            }}></div>
            <div class="title">{data.title}</div>
            <div class={`drill-content-dating ${range.display ? 'show' : 'hide'}`}>
                <span class="drill-dating-duration">{range.duration || ''}</span>
                <span class="drill-dating-separator"> | </span>
                <span class="drill-dating-range">{range.start}-{range.end}</span>
            </div>
        </div>
    )
})



interface DrillItemProps {
    editHandler?: QRL<(e: any) => void>,
    viewHandler?: QRL<(e: any) => void>,
    data: Partial<DrillRow>,
    index?: number
}

export const DrillItem = component$<DrillItemProps>((props) => {
    const { data, editHandler, viewHandler, index } = props;
    //console.log('adding drillitem@', {data})

    if (editHandler) {
        console.log('yes handler')
    }

    const customAttributes = {uuid: data.uuid}

    const range = {
        start: data.time_start,
        end: data.time_end,
        duration: '',
        display: false,
    }

    const timelineText = useSignal<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');

    const checkTimeline = $(() => {
        const start = dayjs(data.time_start, 'hh:mm A');
        const end = dayjs(data.time_end, 'hh:mm A');
 
        if (dayjs().isAfter(start)) {
            if (dayjs().isBefore(end)) {
                return timelineText.value = 'LIVE';
            } 

            return timelineText.value = 'COMPLETED';
        }

        return timelineText.value = 'UPCOMING';
    });

    useTask$(() => {
        checkTimeline();
    })

    useVisibleTask$(() => {
        setInterval(checkTimeline, 1000)
    })

    if (data.time_start && data.time_end) {
        const start = dayjs(data.time_start, 'hh:mm A');
        const end = dayjs(data.time_end, 'hh:mm A');
        range.start = start.format('h:mm');
        range.end = end.format('h:mm');

        if (start.hour() >= 12 && end.hour() >= 12) {
            //console.log('both after 12')
            range.end += ' PM';
        } else {
            if (start.hour() < 12) {
                //console.log('start is before');
                range.start += ' AM';
                range.end += ' PM';
            } else {
                //console.log('end is before')
                range.start += ' PM';
                range.end += ' AM';
            }
        }

        const diff = start.diff(end, 'minutes');
        //console.log({diff});

        range.duration = `${Math.abs(diff)} min`;
        range.display = true;
    } 


    return (
        <div class="drill-item-outer" {...customAttributes}>
            <div class={`drill-item-live-flag ${timelineText.value.toLowerCase()}`}>{timelineText.value}</div>
            <div class="drill-item-inner">
                <div class="drill-primary-content">
                    <div class="drill-content-meta">
                        <div class="drill-item-title">{data.title || 'Untitled'}</div>
                        <div class="drill-item-description">{data.description ? data.description : 'No description'}</div>
                    </div>

                    <div class="drill-index-box">
                    DRILL {index != undefined ? index + 1 : '#'}
                    </div>
                </div>
                <div class="drill-secondary-content">
                    <div class={`drill-content-dating ${range.display ? 'show' : 'hide'}`}>
                        <span class="drill-dating-duration">{range.duration || ''}</span>
                        <span class="drill-dating-separator"> | </span>
                        <span class="drill-dating-range">{range.start}-{range.end}</span>
                    </div>
                    <div class={`drill-edit ${editHandler ? '' : 'hide'}`} onClick$={(e) => {
                        if (editHandler) editHandler(e as any);
                        if (viewHandler) viewHandler(e as any);
                    }}>
                    {editHandler ? 'Edit' : 'View'}
                    </div>
                    <div class="drill-edit-data">
                    {JSON.stringify(data)}
                    </div>
                </div>
                <div class="drill-live-content">
                    <button class={`drill-mark-complete-button`}>{timelineText.value !== 'COMPLETED' ? 'Mark as Complete' : 'Completed'}</button>
                </div>
            </div>
        </div>
    )
})