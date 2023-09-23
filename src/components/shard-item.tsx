import { $, component$, useSignal } from '@builder.io/qwik';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime)

import type { Database } from '~/supabase';
type ShardRow = Database['public']['Tables']['shards']['Row'];

export const ShardItem = component$((data: ShardRow) => {
    const copyText = useSignal('Copy Link');
    
    const copyLinkHandler = $(async (e: any) => {
        const target = e.target as HTMLElement;
        console.log(e);
        if (target.dataset.uuid) {
            const url = `${window.location.origin}/share/${target.dataset.uuid}`;

            try {
                await navigator.clipboard.writeText(url);
                copyText.value = 'Copied';
                setTimeout(() => {
                    copyText.value = 'Copy Link'
                }, 2000)
            } catch (err) {
                console.error(err)
            }
        }
    })

    return (
        <div class="plan-item-outer">
            <div class="plan-item">
                <div class="plan-primary-content">
                    <div class="plan-updated-text">
                        {data.updated_at ? 
                        <>
                            <span>Updated {dayjs(data.updated_at).fromNow()}</span>
                            <span> | </span>
                            <span> {dayjs(data.updated_at).format('M.D.YYYY h:mm A')} </span>
                        </>
                        : <></>
                        }
                    </div>
                    <div class="plan-item-title">{data.title || 'Untitled'}</div>
                    <div class="plan-item-description">{data.description || 'No description'}</div>
                </div>
                <div class="plan-secondary-content">
                    <div class="plan-edit">
                        <a href={`/shards/${data.uuid}`}>Edit Shard</a>
                    </div>
                    <div class="plan-run">
                        <a href={`/shards/${data.uuid}/?live=1`}>Run Shard</a>
                    </div>
                    <u class="plan-copy-link" data-uuid={data.uuid}
                    onClick$={copyLinkHandler}
                    >{copyText.value}</u>
                </div>
            </div>
        </div>
    )
})