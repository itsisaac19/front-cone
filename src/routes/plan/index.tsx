import { $, component$, useVisibleTask$ } from '@builder.io/qwik';
import { BreadCrumbs } from '~/components/crumbs';

import { createClient } from '@supabase/supabase-js';

import type { Database } from "~/supabase";
import { routeLoader$, server$ } from '@builder.io/qwik-city';
import { PlanItem } from '~/components/plan-item';
type PlanRow = Database['public']['Tables']['plans']['Row'];

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true
    }
});



const addEmptyPlan = async (userid: string) => {
    const auth = await supabase.auth.getSession()
    console.log(auth);
    const userEmail = auth.data.session?.user.email;
    if (!userEmail || !userid) {
        return null;
    }

    const { data, error } = await supabase
    .from('plans').insert({
        user_id: userid,
        user_email: userEmail
    }).select();

    console.log({data, error});
    return data as PlanRow[];
}

export const useUserPlans = routeLoader$(async (requestEvent) => {
    const userid = requestEvent.cookie.get('userid')?.value;

    if (userid) {
        const { data, error } = await supabase
        .from('plans').select().eq('user_id', userid).order('updated_at', {
            ascending: false
        });
    
        if (error) {
            return null;
        }
        
        
        return {
            data: data as PlanRow[],
            userid: userid
        };
    }
})

const detect = server$(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(event, session?.user)
        if (event == 'SIGNED_IN') {
            
            const session = await supabase.auth.getSession();
            console.log(session)
            //console.log('Authenticated User:', session?.user)
        }
    })
})

export const useBreadCrumbs = routeLoader$((requestEvent) => {
    const path = requestEvent.pathname;
    return <BreadCrumbs path={path} />;
})

export const useTokens = routeLoader$(({ cookie }) => {
    const accessToken = cookie.get('my-access-token')?.value;
    const refreshToken = cookie.get('my-refresh-token')?.value;

    if (accessToken && refreshToken) {
        supabase.auth.setSession({
            access_token: accessToken, 
            refresh_token: refreshToken
        })
    }

    if (!accessToken || !refreshToken) {
        console.log('No cookie found:', cookie)
        //throw redirect(302, '/auth');
        return;
    } 

    return {
        refreshToken,
        accessToken
    }
})

export default component$(() => {
    const userPlans = useUserPlans();
    const crumbs = useBreadCrumbs();

    const tokens = useTokens();
    detect();

    useVisibleTask$(async () => {
        if (tokens.value?.accessToken && tokens.value?.refreshToken) {
            const existing = await supabase.auth.getSession();
            if (!existing.data.session) {
                console.error('Existing session does not exist')
            }  else {
                console.log({existing})
            } 
        }
    })

    const addPlanHandler = $(async () => {
        const userid = userPlans.value?.userid;

        if (userid) {
            const plan = await addEmptyPlan(userid);
            if (plan) {
                location.assign(`/plan/${plan[0].uuid}`)
            } else {
                console.error('missing params or error occured.')
            }
        }
    });

    return (
        <div class="dashboard-outer">
            <div class="dashboard-inner">
                <div class="dashboard-top-bar">
                    <div class="hamburger">
                        <img onClick$={() => location.assign('/')} width={53} height={65} src="/logo-black.png" alt="" />    
                    </div>
                    <div class="navigation-crumbs">
                        {crumbs.value ? crumbs.value : <></>}
                    </div>
                </div>
                <div class="dashboard-content">
                    <div class="dash-header-wrap">
                        <div class="dash-header">
                        My Plans
                        </div>
                        <div onClick$={addPlanHandler} class="dash-button">
                            <span class="dash-button-text">
                            Add Plan
                            </span>
                        </div>
                    </div>
                    <div class="plan-grid">
                        {userPlans.value?.data ? userPlans.value.data.map((planData) => {
                            return <PlanItem {...planData} key={planData.uuid} />;
                        }) : <></>}
                    </div>
                </div>
            </div>
        </div>
    );
});

