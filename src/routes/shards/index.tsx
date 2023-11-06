import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Navbar } from '~/components/navbar';

import type { Database } from '~/supabase';
type ShardRow = Database['public']['Tables']['shards']['Row'];
import { createClient } from '@supabase/supabase-js';
import { ShardItem } from '~/components/shard-item';

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true,
    }
});

export const useInitialLoader = routeLoader$(async ({ cookie, redirect, params, pathname }) => {
    const accessToken = cookie.get('my-access-token')?.value;
    const refreshToken = cookie.get('my-refresh-token')?.value;

    if (accessToken && refreshToken) {
        console.log('setting session')
        supabase.auth.setSession({
            access_token: accessToken, 
            refresh_token: refreshToken
        })
    }
    
    if (!accessToken || !refreshToken) {
        console.log('No cookie found:', cookie)
        throw redirect(302, `/share/${params.id}`);
    } 

    const userid = cookie.get('userid')?.value;
    let shards;

    if (userid) {
        const { data, error } = await supabase
        .from('shards').select().eq('user_id', userid).order('updated_at', {
            ascending: false
        });
    
        if (error) {
            return null;
        }
        
        
        shards = data as ShardRow[];
    }

    return {
        refreshToken,
        accessToken,
        pathname,
        userid,
        shards
    }
}) 

const addEmptyShard = async (userid: string) => {
    const auth = await supabase.auth.getSession()
    console.log(auth);
    const userEmail = auth.data.session?.user.email;
    if (!userEmail || !userid) {
        return null;
    }

    const { data, error } = await supabase
    .from('shards').insert({
        user_id: userid,
        user_email: userEmail
    }).select();

    console.log({data, error});
    return data as ShardRow[];
}

export default component$(() => {
    const loader = useInitialLoader();
    if (!loader.value) throw new Error('loader is empty');
    const { pathname, accessToken, refreshToken, userid, shards } = loader.value;

    const currentUserEmail = useSignal('')

    const addShardHandler = $(async () => {
        if (userid) {
            const shard = await addEmptyShard(userid);
            if (shard) {
                location.assign(`/shards/${shard[0].uuid}`)
            } else {
                console.error('missing params or error occured.')
            }
        }
    });

    useVisibleTask$(async () => {
        if (accessToken && refreshToken) {
            const existing = await supabase.auth.getSession();
    
            if (!existing.data.session) {
                console.error('Existing session does not exist')
            } else {
                console.log({existing});
                if (existing.data.session.user.email) {
                    currentUserEmail.value = existing.data.session.user.email;
                }
            } 
        }
    })

    return (
        <div>
            <Navbar path={pathname} />
            <div class="dashboard-content">
                    <div class="dash-header-wrap">
                        <div class="dash-header">
                        My Shards
                        </div>
                        <div onClick$={addShardHandler} class="dash-button">
                            <span class="dash-button-text">
                            Add Shard
                            </span>
                        </div>
                    </div>
                    <div class="shard-grid">
                        {shards ? shards.map((shardData) => {
                            return <ShardItem {...shardData} key={shardData.uuid} />;
                        }) : <></>}
                    </div>
                </div>
        </div>
    )    
})