import { $, component$, useComputed$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '~/supabase';
import { type DocumentHead, routeLoader$, server$ } from '@builder.io/qwik-city';
import { CurrentLiveDrillBox, DrillItem } from '~/components/drill-item';
import dayjs from 'dayjs';
import { Navbar } from '~/components/navbar';
import anime from 'animejs';
import { AuthBanner, IdenticonSvg } from '~/components/auth-banner';
type PlanRow = Database['public']['Tables']['plans']['Row'];
type DrillRow = Database['public']['Tables']['drills']['Row'];

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true
    }
});

const detect = server$(() => {
    supabase.auth.onAuthStateChange(async (event) => {
        if (event == 'SIGNED_IN') {
            
            const session = await supabase.auth.getSession();
            console.log(session)
            //console.log('Authenticated User:', session?.user)
        }
    })
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
        if (eventData) {
            console.log(`Change is MINE: `, {eventData});
        }
        
        const planUUID = plan.value?.data?.uuid;

        if (planUUID) {
            const { data, error } = await supabase
            .from('drills').select().eq('plan_uuid', planUUID).order('hour_start', {
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

    const timelineStatusText = { value: '' };

    if (planDrills.value) {
        const drills = planDrills.value;
        let ahead = false;

        const atLeastOneLate = drills.some(drillData => {
            if (drillData.status === 'LATE') return true;

            if (drillData.status === 'COMPLETED') {
                const current = dayjs();
                const end = dayjs(drillData.time_end, 'hh:mm A');

                if (current.isBefore(end)) {
                    ahead = true;
                } else {
                    ahead = false;
                }
            }
        });

        if (atLeastOneLate) {
            timelineStatusText.value = 'Running Behind';
        } else {
            if (ahead) {
                timelineStatusText.value = 'Ahead of Schedule'
            } else {
                timelineStatusText.value = 'On Schedule'
            }
        }
    }

    const liveMetaStore = useStore({
        status: 'On Schedule',
        currentTime: dayjs().format('h:mm:ss A'),
        currentDrills: [] as Partial<DrillRow>[],
    });

    useVisibleTask$(() => {
        setInterval(() => {
            liveMetaStore.currentTime = dayjs().format('h:mm:ss A');
        }, 1000)
    })


    const currentLiveDrills = planDrills.value?.filter(drillData => {
        const start = dayjs(drillData.time_start, 'hh:mm A');
        const end = dayjs(drillData.time_end, 'hh:mm A');

        if (dayjs().isAfter(start) && dayjs().isBefore(end)) {
            return true;
        }
    }) || []; 

    const completedDrills = planDrills.value?.filter(drillData => {
        if (drillData.status === 'COMPLETED') {
            return true;
        }
    }) || []; 

    const lateDrills = planDrills.value?.filter(drillData => {
        if (drillData.status === 'LATE') {
            return true;
        }
    }) || []; 

    const isLive = currentPlanData.value?.status == 'live' ? true : false;

    const author = useSignal('')
    const currentUserEmail = useSignal('')

    const runPlanHandler = $(() => {
        if (currentPlanData.value?.status === 'live') {
            const already = document.querySelector('.creation-grid')?.classList.contains('live');

            if (already) return;

            anime({
                targets: '.creation-grid',
                rowGap: ['20px', '50px'],
                translateY: ['0px', '40px'],
                easing: 'easeOutSine',
                duration: 800
            })

            return 
        }

        anime({
            targets: '.creation-grid',
            rowGap: ['50px', '20px'],
            translateY: ['40px', '0px'],
            easing: 'easeOutSine',
            duration: 800
        });
    })

    useVisibleTask$(async () => {
        if (tokens.value?.accessToken && tokens.value?.refreshToken) {
            const existing = await supabase.auth.getSession();
            if (!existing.data.session) {
                console.error('Existing session does not exist')
            }  else {
                console.log({existing});
                if (existing.data.session.user.email) {
                    currentUserEmail.value = existing.data.session.user.email;
                }
                const identities = existing.data.session.user.identities;

                if (identities) {
                    let lastFound = '';
                    identities.find(id => {
                        const fullName = id.identity_data?.full_name;
                        if (fullName) {
                            if (!lastFound) lastFound = fullName;
                            if (fullName.includes(' ')) {
                                lastFound = fullName;
                                return true;
                            }
                        }
                    })

                    author.value = lastFound;
                }
                
                const channel = supabase.channel('drills-channel')
                .on('postgres_changes', { 
                    event: '*',
                    schema: 'public', 
                    table: 'drills' 
                }, (payload) => {
                    console.log('DRILL change received:', payload);
                    if (payload.eventType === 'DELETE') {
                        /* const drill = userDrills?.value?.find(drillData => {
                            return drillData.uuid == payload.old.uuid;
                        })
                        if (drill) {
                            realTimeEvent.value = payload;
                        } else {
                            console.log(`Change is NOT mine: `, payload.eventType);
                        } */
                    }
    
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const userid = (payload.new as DrillRow).user_id;
                        console.log('insert row', {userid});

                        if (plan.value?.data.user_id && plan.value.data.user_id == userid) {
                            realTimeEvent.value = payload;
                        } else {
                            console.log(`Change is NOT mine: `, payload.eventType);
                        }
                    }
                }).on('postgres_changes', { 
                    event: '*',
                    schema: 'public', 
                    table: 'plans' 
                }, (payload) => {
                    console.log('PLAN change received:', payload);
                    if (payload.eventType === 'DELETE') {
                        console.log('DELETE')
                    }
                
                    if (payload.eventType === 'UPDATE') {
                        const userid = (payload.new as DrillRow).user_id;
                        if (plan.value?.data.user_id && plan.value.data.user_id == userid) {
                            currentPlanData.value = payload.new;
                        } else {
                            console.log(`Change is NOT mine: `, payload.eventType);
                            currentPlanData.value = payload.new;
                        } 
                        console.log('update plan', {userid})
                        runPlanHandler();
                    }
                }).subscribe()

                window.onbeforeunload = () => {
                    console.log('REMOVING')
                    supabase.removeChannel(channel)
                }
            } 
        }
    })

    const shareURL = useSignal('');

    const copyText = useSignal('Copy');

    useVisibleTask$(() => {
        runPlanHandler();
        shareURL.value = `${window.location.host}/share/${plan.value?.data.uuid}`;
    })

    const sharePlanHandler = $(async () => {
        if (plan.value?.data.uuid) {
            const shareData = {
                title: 'Front Cone',
                text: plan.value?.data.title || 'Untitled',
                url: `${window.location.origin}/share/${plan.value?.data.uuid}`,
            };

            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error(err)
                alert(err)
            }
        }
    })
    const copyLinkHandler = $(async () => {
        if (plan.value?.data.uuid) {
            const url = `${window.location.origin}/share/${plan.value?.data.uuid}`;

            try {
                await navigator.clipboard.writeText(url);
                copyText.value = 'Copied';
                setTimeout(() => {
                    copyText.value = 'Copy'
                }, 2000)
            } catch (err) {
                console.error(err)
            }
        }
    })

    const expandCurrentLiveDrillBox = $((e: any) => {
        console.log(e)
        const button = e.target as HTMLElement;
        button.parentElement?.classList.toggle('expand');
    })

    return (
        <div class="dashboard-outer">
            <div class="dashboard-inner">
                {plan.value ? <Navbar path={plan.value.path} planData={currentPlanData.value} currentEmail={currentUserEmail.value} /> : <></>}
                {plan.value ? <AuthBanner accessString={'Viewing'} planData={currentPlanData.value} currentEmail={currentUserEmail.value} /> : <></>}
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
                                <div class="action-button-grid">
                                    <div class="plan-share-wrap">
                                        <button class="plan-share-button" onClick$={sharePlanHandler}>
                                        <span class="plan-share-text">Share Plan</span>
                                        <svg class="plan-share-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                        </button>
                                        <div class="plan-copy-wrap" onClick$={copyLinkHandler}>
                                            <span class="plan-copy-button-url">
                                                {shareURL.value}
                                            </span>
                                            <div class="plan-url-gradient"></div>

                                            <div class="plan-copy-button">
                                                <svg class="plan-copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" ><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                <span>{copyText.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="credit-grid">
                                    <div class="author-box">
                                        <div class="author-meta">
                                            <span class="author-label">Created by </span>
                                            <span class="author-value">{plan.value?.data.user_email}</span>
                                        </div>
                                        <div class="author-logo">
                                            <IdenticonSvg currentEmail={plan.value?.data.user_email || 'username'} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="creation-outer view">
                        <div class="creation-inner">
                            <div class="creation-live-tools">
                                <div class={`live-tools-grid ${isLive ? 'live' : ''}`}>
                                <div class="live-timeline-meta">
                                        <span class="timeline-current-time">{liveMetaStore.currentTime}</span>
                                        <span class={`timeline-status ${timelineStatusText.value.toLowerCase().split(' ').join('-')}`}>{timelineStatusText.value}</span>
                                        <span class={`timeline-live-quantity timeline-quantity ${currentLiveDrills.length > 0 ? 'show' : ''}`}>{currentLiveDrills.length} / {planDrills.value?.length} Live</span>
                                        <span class={`timeline-late-quantity timeline-quantity ${lateDrills.length > 0 ? 'show' : ''}`}>{lateDrills.length} / {planDrills.value?.length} Late</span>
                                        <span class={`timeline-complete-quantity timeline-quantity ${completedDrills.length > 0 ? 'show' : ''}`}>{completedDrills.length} / {planDrills.value?.length} Complete</span>
                                    </div>
                                {currentLiveDrills.length > 0 ?
                                    <div class="live-current-drill-wrap">
                                        <div class="live-current-drill-label">
                                            <span>Current Live Drills</span>
                                            <div class="current-live-drill-count">{currentLiveDrills.length}</div>
                                            {currentLiveDrills.length > 0 ? 
                                                <svg onClick$={expandCurrentLiveDrillBox} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            : null}
                                        </div>
                                        <span  class="live-current-drill-grid">{currentLiveDrills.map((drillData: Partial<DrillRow>) => {
                                            return <CurrentLiveDrillBox data={drillData} key={drillData.uuid} />
                                        })}</span>
                                    </div>
                                : null}
                                    
                                </div>
                            </div>
                            <div class="creation-label">
                                <div class="creation-label-line-left"></div>
                                <div class="creation-label-text">
                                Practice Plan
                                </div>
                                <div class="creation-label-line-right"></div>
                            </div>
                            <div 
                            class={`creation-grid ${isLive ? 'live' : ''}`}
                            style={{
                                rowGap: '50px',
                                transform: 'translateY(40px)'
                            }}
                            >                
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

export const head: DocumentHead = ({resolveValue}) => {
    const planTitle = resolveValue(usePlan);
    return {
        title: `${planTitle?.data.title || 'Untitled'} | Front Cone`,
        meta: [
            {
                name: 'description',
                content: planTitle?.data.description || 'No description',
            },
        ],
    };
}