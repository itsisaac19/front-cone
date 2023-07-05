import { component$, useSignal, useVisibleTask$, type QRL } from "@builder.io/qwik";

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
    } else if (start.hour() <= 12 && end.hour() <= 12) {
        range.end += ' AM';
    } else {
        if (start.hour() < 12) {
            range.start += ' AM';
        } else {
            range.start += ' PM';
        }

        if (end.hour() < 12) {
            range.end += ' AM';
        } else {
            range.end += ' PM';
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

    const rangePercentage = useSignal('')

    useVisibleTask$(() => {
        const getPercentageOfRange = () => {
            const current = dayjs().unix();

            const start = dayjs(data.time_start, 'hh:mm A').unix();
            const end = dayjs(data.time_end, 'hh:mm A').unix();

            const offsetEnd = end - start;
            const offsetCurrent = current - start;

            let fraction = offsetCurrent / offsetEnd;

            if (fraction > 1) {
                fraction = 1;
            }

            return (fraction * 100).toFixed(1);
        }

        setInterval(() => {
            rangePercentage.value = getPercentageOfRange();
        }, 1000)
    })

    return (
        <div class='current-live-drill-box'>
            <div class="current-live-drill-box-meta-inner">
                <div class="title">{data.title}</div>
                <span class="drill-dating-range">{range.start}-{range.end}</span>
                <div class={`drill-content-dating ${range.display ? 'show' : 'hide'}`}>
                        {rangePercentage.value ? `${parseFloat(rangePercentage.value).toFixed(0)}%` : '...'}
                        {/* <span class="drill-dating-duration">{range.duration || ''}</span>
                        <span class="drill-dating-separator"> | </span>
                        <span class="drill-dating-range">{range.start}-{range.end}</span> */}
                </div>
            </div>
            <div class="progress-inner">
                <div class="progress-background" style={{
                    width: `${rangePercentage.value}%`
                }}></div>
            </div>
        </div>
    )
})



interface DrillItemProps {
    editHandler?: QRL<(e: any) => void>,
    viewHandler?: QRL<(e: any) => void>,
    completeHandler?: QRL<(e: any) => void>,
    data: Partial<DrillRow>,
    index?: number
}

export const DrillItem = component$<DrillItemProps>((props) => {
    const { data, editHandler, viewHandler, completeHandler, index } = props;
    //console.log('adding drillitem@', {data})



    const customAttributes = {uuid: data.uuid}

    const range = {
        start: data.time_start,
        end: data.time_end,
        duration: '',
        display: false,
    }

    const statusText = data.status as ('UPCOMING' | 'LIVE' | 'COMPLETED' | 'LATE') || 'UPCOMING';
    
    if (editHandler) {
        /* console.groupCollapsed('rendered editable DrillItem')
        console.log({statusText}, timelineText.value)
        console.groupEnd() */
    }

    if (data.time_start && data.time_end) {
        const start = dayjs(data.time_start, 'hh:mm A');
        const end = dayjs(data.time_end, 'hh:mm A');
        range.start = start.format('h:mm');
        range.end = end.format('h:mm');

        if (start.hour() >= 12 && end.hour() >= 12) {
            range.end += ' PM';
        } else if (start.hour() <= 12 && end.hour() <= 12) {
            range.end += ' AM';
        } else {
            if (start.hour() < 12) {
                range.start += ' AM';
            } else {
                range.start += ' PM';
            }
    
            if (end.hour() < 12) {
                range.end += ' AM';
            } else {
                range.end += ' PM';
            }
        }

        const diff = start.diff(end, 'minutes');
        //console.log({diff});

        range.duration = `${Math.abs(diff)} min`;
        range.display = true;
    } 

    return (
        <div class="drill-item-outer" {...customAttributes}>
            <div class={`drill-item-live-flag ${statusText.toLowerCase()}`}>{statusText}</div>
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
                    {completeHandler ? <button onClick$={completeHandler} class={`drill-mark-complete-button`}>{statusText !== 'COMPLETED' ? 'Mark as Complete' : 'Mark as Incomplete'}</button> : null}
                </div>
            </div>
        </div>
    )
})