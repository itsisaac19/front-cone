import { component$, useComputed$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { BreadCrumbs } from '~/components/crumbs';
import { createClient } from '@supabase/supabase-js';

import type { Database } from "~/supabase";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { DrillItem } from "~/components/drill-item";
import dayjs from "dayjs";
type PlanRow = Database['public']['Tables']['plans']['Row'];
type DrillRow = Database['public']['Tables']['drills']['Row'];

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true
    }
});

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

export const usePlan = routeLoader$(async (requestEvent) => {
    const planUUID = requestEvent.params.id;

    if (planUUID) {
        const { data, error } = await supabase
        .from('plans').select().eq('uuid', planUUID);
    
        if (error) {
            return null;
        }

        const response = data as any as PlanRow[];
        const plan = response[0]

        return {
            data: plan, 
            path: requestEvent.pathname
        };
    }

})

export default component$(() => {
    const tokens = useTokens();
    detect();

    const plan = usePlan();

    const currentPlanData = useStore({
        value: plan.value?.data as Partial<PlanRow>,
    })
    /* const currentDrillData = useStore({
        value: {} as Partial<DrillRow>,
    }) */

    const realTimeEvent = useStore({} as any);

    const planDrills = useComputed$(async () => {
        const eventData= realTimeEvent.value;
        console.log(`Change is MINE: `, {eventData});
        const planUUID = plan.value?.data?.uuid;

        if (planUUID) {
            const { data, error } = await supabase
            .from('drills').select().eq('plan_uuid', planUUID).order('time_start', {
                ascending: true
            });
        
            if (error) {
                return null;
            }

            const drills = data as any as Partial<DrillRow>[];
        
            return drills;
        } else {
            return []
        }
    });

    const crumbs = useBreadCrumbs();

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
                <div class="view-plan-wrap">
                    <div class="meta-actions-outer">
                        <div class="meta-actions-inner">
                            <div class="updated-at-text view">
                                {currentPlanData.value.updated_at ? 
                                <>
                                    <span>Updated {dayjs(currentPlanData.value.updated_at).fromNow()}</span>
                                    <span> | </span>
                                    <span> {dayjs(currentPlanData.value.updated_at).format('M.D.YYYY h:mm A')} </span>
                                </>
                                : <></>
                                }
                            </div>
                            <div class="plan-title view">{currentPlanData.value.title || 'Untitled'}</div>
                            <div class="plan-description view">{currentPlanData.value.description || 'No description'}</div>
                            <div class="action-button-grid">

                            </div>
                        </div>
                    </div>

                    <div class="creation-outer view">
                        <div class="creation-inner">
                            <div class="creation-grid">
                                {planDrills.value ? planDrills.value.map((drillData: Partial<DrillRow>, index) => {
                                    return <DrillItem data={drillData} key={drillData.uuid} index={index} />
                                })  : null}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
});