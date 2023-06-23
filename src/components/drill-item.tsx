import { component$, type QRL } from "@builder.io/qwik";

import type { Database } from "~/supabase";
type DrillRow = Database['public']['Tables']['drills']['Row'];

import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)

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
            </div>
        </div>
    )
})