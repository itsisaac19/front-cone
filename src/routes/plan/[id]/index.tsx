import { $, component$, useComputed$, useSignal, useStore, useTask$, useVisibleTask$ } from "@builder.io/qwik";

import { createClient } from '@supabase/supabase-js';
import type { Database } from "~/supabase";
import { type DocumentHead, routeLoader$, server$, useLocation, Link } from "@builder.io/qwik-city";
/* import { TimeEndPicker, TimeStartPicker } from "~/components/dating";
 */import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime)

import { CurrentLiveDrillBox, DrillItem } from "~/components/drill-item";
type PlanRow = Database['public']['Tables']['plans']['Row'];
type DrillRow = Database['public']['Tables']['drills']['Row'];

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true,
    }
});



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

export const useUserDrills = routeLoader$(async (requestEvent) => {
    const userid = requestEvent.cookie.get('userid')?.value;

    if (userid) {
        const { data, error } = await supabase
        .from('drills').select().eq('user_id', userid);
    
        if (error) {
            return null;
        }

        const drills = data as any as Partial<DrillRow>[];
    
        return drills;
    } else {
        return [];
    }
})


const savePlanToDatabase = async (planData: any) => {
    const { data, error } = await supabase
    .from('plans').update(planData).eq('uuid', planData.uuid).select();

    if (error) {
        return null;
    }

    return data as unknown as Partial<PlanRow>[];
}

const addDrillToDatabase = async (drillData: any) => {
    const { data, error } = await supabase
    .from('drills').insert(drillData).select();

    if (error) {
        return null;
    }

    return data as unknown as Partial<DrillRow>[];
} 
const saveDrillToDatabase = async (drillData: any) => {
    const { data, error } = await supabase
    .from('drills').update(drillData).eq('uuid', drillData.uuid).select();

    if (error) {
        return null;
    }

    return data as unknown as Partial<DrillRow>[];
} 
const deleteDrillFromDatabase = async (uuid: string) => {
    const { data, error } = await supabase
    .from('drills').delete().eq('uuid', uuid).select();

    if (error) {
        return null;
    }

    return data;
}
const addDrillToRecovery = async (drillData: Partial<DrillRow>) => {
    const { data, error } = await supabase
    .from('deleted-drills').insert(drillData).select();

    if (error) {
        return null;
    }

    return data as unknown as Partial<DrillRow>[];
}
const deletePlanFromDatabase = async (uuid: string) => {
    const { data, error } = await supabase
    .from('plans').delete().eq('uuid', uuid).select();

    if (error) {
        return null;
    }

    return data;
}
const addPlanToRecovery = async (planData: Partial<PlanRow>) => {
    const { data, error } = await supabase
    .from('deleted-plans').insert(planData).select();

    if (error) {
        return null;
    }

    return data as unknown as Partial<DrillRow>[];
}

import anime from 'animejs';
import { Navbar } from "~/components/navbar";
import { AuthBanner } from "~/components/auth-banner";
/* import { NotificationSwitch } from "~/components/notification";
 */

const detect = server$(() => {
    supabase.auth.onAuthStateChange(async (event) => {
        if (event == 'SIGNED_IN') {
            
            //const session = await supabase.auth.getSession();
            //console.log({session})
            //console.log('Authenticated User:', session?.user)
        }
    })
})

export const useTokens = routeLoader$(({ cookie }) => {
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
        //throw redirect(302, '/auth');
        return;
    } 

    return {
        refreshToken,
        accessToken
    }
})

const getDrillIndex = (drillUUID?: string) => {
    const wrapper = (document.querySelector('.creation-grid') as HTMLElement);
    const numberOfDrills = wrapper.children.length;

    if (drillUUID) {
        const drillIndex = [...wrapper.children].findIndex(drillElement => {
            return drillElement.getAttribute('uuid') == drillUUID;
        })
        console.log({ drillIndex });
        return drillIndex;
    } else {
        return numberOfDrills; // Could be 0
    }
}

/* const pushChannel = supabase.channel('push-notifications', {
    config: {
        broadcast: {
            self: true
        }
    }
}); */
/* pushChannel.on('broadcast', { event: 'drill-starting' }, (payload) => {
    console.groupCollapsed('DRILL-STARTING');
    console.log({payload});
    

    console.groupEnd()
}) */
export type NotificationPayloadType = {
    title: string,
    description: string
}

export default component$(() => {
    const globalPrefersReducedMotion = useSignal(false);

    const showSettingsHandler = $(async () => {

        const overlay = document.querySelector('.plan-meta-overlay-outer') as HTMLElement;
    
        overlay?.classList.add('show-grid');
        anime({
            targets: '.plan-meta-overlay-outer',
            opacity: {
                value: [0, 1],
                duration: globalPrefersReducedMotion.value ? 0 : 100,
                easing: 'easeOutSine'
            },
            scale: {
                value: [0.9, 1],
                duration: globalPrefersReducedMotion.value ? 0 : 200,
                delay: globalPrefersReducedMotion.value ? 0 : 350,
                easing: 'easeOutSine'
            },
        })
    })
    
    const hideSettingsHandler = $(async () => {
        const overlay = document.querySelector('.plan-meta-overlay-outer');
        await anime({
            targets: '.plan-meta-overlay-outer',
            opacity: {
                value: [1, 0],
                duration: globalPrefersReducedMotion.value ? 0 : 100,
                delay: globalPrefersReducedMotion.value ? 0 : 200
            },
            scale: [1, globalPrefersReducedMotion.value ? 1 : 0.9],
            duration: globalPrefersReducedMotion.value ? 0 : 200,
            easing: 'easeOutSine',
        }).finished;
    
        setTimeout(() => {
            overlay?.classList.remove('show-grid');
        }, 300)
    })
    
    const tokens = useTokens();
    detect();

    const plan = usePlan();

    const currentPlanData = useStore({
        value: plan.value?.data as Partial<PlanRow>,
    })
    const currentDrillData = useStore({
        value: {} as Partial<DrillRow>,
    })


    const savePlanHandler = $(async (e?: any) => {
        if (e) {
            (e.target as HTMLElement).classList.add('saving');
        }
        const planData = currentPlanData.value;
        planData.updated_at = dayjs().format();
        if(planData) {
            const databaseResponse = await savePlanToDatabase(planData)
            console.log({ databaseResponse });
            if (e) {
                (e.target as HTMLElement).classList.remove('saving');
                hideSettingsHandler();
            }            
            return databaseResponse;
        }
    })

    const { url }  = useLocation();
    const liveParam = url.searchParams.get('live');

    useVisibleTask$(() => {
        globalPrefersReducedMotion.value = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
        console.log({globalPrefersReducedMotion}, globalPrefersReducedMotion.value)

        if (liveParam && liveParam === '1') {
            if (currentPlanData.value.status != 'live') {
                url.searchParams.delete('live');
                window.history.replaceState({}, '', url)

                console.log('auto-running live via "live=1" in url.');
                currentPlanData.value.status = 'live';
                savePlanHandler();

            }
        }
    })

    const realTimeEvent = useStore({} as any);

    useTask$(({ track }) => {
        track(() => realTimeEvent.value);
        const value = realTimeEvent.value;
        if (value) {
            console.log('realtime event', value)
            savePlanHandler();
        }
    })

    const userDrills = useComputed$(async () => {
        const eventData= realTimeEvent.value;
        if (eventData) {
            console.log(`Change is MINE: `, {eventData});
        }
        
        const userid = plan.value?.data?.user_id;

        if (userid) {
            const { data, error } = await supabase
            .from('drills').select().eq('user_id', userid).order('hour_start', {
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

    const planDrills = useComputed$(() => {
        const initial = userDrills.value?.filter(drill => {
            return drill.plan_uuid == plan.value?.data.uuid;
        }) || [];
        return initial; 
    })
    const runPlanButtonText = useSignal('Run Live');

    const adjustLiveBar = $((action: 'show' | 'hide') => {
        if (runPlanButtonText.value === 'Run Live') return;

        const findBestMatch = (drills: Partial<DrillRow>[], currentHour: number) => {
            let bestMatch: Partial<DrillRow> = {};
            let smallestDifference = Infinity;
        
            drills.forEach(obj => {
                if (obj.hour_start !== null && obj.hour_end !== null) {
                    if (!obj.hour_start || !obj.hour_end) return;
                    const startDifference = Math.abs(obj.hour_start - currentHour);
                    const endDifference = Math.abs(obj.hour_end - currentHour);
                    const smallestObjDifference = Math.min(startDifference, endDifference);
                
                    if (smallestObjDifference < smallestDifference) {
                        smallestDifference = smallestObjDifference;
                        bestMatch = obj;
                    }
                }
            });
            
            return bestMatch;
        }
        const drills = planDrills.value;

        if (!drills) return;

        const liveBarWrap = document.querySelector('.creation-live-bar-wrap');

        if (action === 'hide') {
            anime({
                targets: liveBarWrap,
                translateY: {
                    value: '0px',
                    delay: 500,
                },
                opacity: 0,
                easing: 'easeOutSine',
                duration: 500
            }) 
            console.log('hiding')
            return
        }

        const parentBounding = document.querySelector(`.creation-grid-wrap`)?.getBoundingClientRect();
        const padding = 27 + 37;
        
        const match = findBestMatch(drills, dayjs().hour());

        if (match.uuid) {
            const drillBounding = document.querySelector(`.drill-item-outer[uuid="${match.uuid}"`)?.getBoundingClientRect();
            if (drillBounding && parentBounding) {
                const offset = drillBounding.top - parentBounding.top;

                anime({
                    targets: liveBarWrap,
                    translateY: `${offset - padding}px`,
                    opacity: 1,
                    easing: 'easeOutQuint',
                    duration: 1000
                }) 
            }
            
        }
    })

    const currentUserEmail = useSignal('')

    const runPlanHandler = $((e?: any) => {

        const duration = globalPrefersReducedMotion.value ? 0 : 800;

        if (runPlanButtonText.value === 'Run Live') {
            anime({
                targets: '.creation-grid',
                rowGap: ['20px', '70px'],
                translateY: ['0px', '40px'],
                easing: 'easeOutSine',
                duration: duration,
            })

            if (duration != 800) {
                setTimeout(() => {
                    adjustLiveBar('show');
                }, 800)
            }
            

            if (e) {
                currentPlanData.value.status = 'live';
                console.warn('saving plan from run')
                savePlanHandler();
            }

            return runPlanButtonText.value = 'Stop Live';
        }

        anime({
            targets: '.creation-grid',
            rowGap: ['70px', '20px'],
            translateY: ['40px', '0px'],
            easing: 'easeOutSine',
            duration: duration
        });
        adjustLiveBar('hide');


        if (e) {
            currentPlanData.value.status = null;
            console.warn('saving plan from run')
            savePlanHandler();
        }

        runPlanButtonText.value = 'Run Live';
    });

    useVisibleTask$(async () => {
        if (tokens.value?.accessToken && tokens.value?.refreshToken) {
            const existing = await supabase.auth.getSession();

            if (!existing.data.session) {
                console.error('Existing session does not exist')
                location.assign('/')
            } else {
                console.log({existing});
                if (existing.data.session.user.email) {
                    currentUserEmail.value = existing.data.session.user.email;
                }

                if (plan.value && existing.data.session.user.id != plan.value.data.user_id) {
                    console.log('NOT MY PLAN!')
                    location.assign(`/share/${plan.value.data.uuid}`)
                }
            } 

            const channel = supabase.channel('drills-channel')
            .on('postgres_changes', { 
                event: '*',
                schema: 'public', 
                table: 'drills' 
            }, (payload) => {
                console.log('DRILL change received:', payload);
                if (payload.eventType === 'DELETE') {
                    const drill = userDrills?.value?.find(drillData => {
                        return drillData.uuid == payload.old.uuid;
                    })
                    if (drill) {
                        realTimeEvent.value = payload;
                    } else {
                        console.log(`Change is NOT mine: `, payload.eventType);
                    }
                }

                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const userid = (payload.new as DrillRow).user_id;
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
                    console.log('update plan', {userid})
                    if (plan.value?.data.user_id && plan.value.data.user_id == userid) {
                        if (payload.new.status != currentPlanData.value.status) {
                            runPlanHandler();
                        }

                        currentPlanData.value = payload.new;
                    } else {
                        console.log(`Change is NOT mine: `, payload.eventType);
                    } 
                }
            }).subscribe();

            window.onbeforeunload = () => {
                console.log('REMOVING')
                supabase.removeChannel(channel)
                //supabase.removeChannel(pushChannel)
            }
        } else {
            location.assign('/')
        }
    })

    const showOverlay = useStore({
        actionString: 'create'
    });

    const showOverlayHandler = $((actionString: 'Edit' | 'Create' | 'Copy', drillData?: Partial<DrillRow>) => {

        const overlay = document.querySelector('.drill-edit-overlay-outer') as HTMLElement;
        showOverlay.actionString = actionString;

        if (actionString === 'Edit' || actionString === 'Copy') {
            if (drillData) {
                console.log(`${actionString}ing: `, {drillData});
                currentDrillData.value = drillData;
            }
        } else {
            currentDrillData.value = {};
        }

        overlay?.classList.add('show-grid');
        anime({
            targets: '.drill-edit-overlay-outer',
            opacity: {
                value: [0, 1],
                duration: globalPrefersReducedMotion.value ? 0 : 100,
                easing: 'easeOutSine'
            },
            scale: {
                value: [globalPrefersReducedMotion.value ? 1 : 0.9, 1],
                duration: globalPrefersReducedMotion.value ? 0 : 200,
                delay: globalPrefersReducedMotion.value ? 0 : 350,
                easing: 'easeOutSine'
            },

        })
    })
    const hideOverlayHandler = $(async () => {

        const overlay = document.querySelector('.drill-edit-overlay-outer');
        await anime({
            targets: '.drill-edit-overlay-outer',
            opacity: {
                value: [1, 0],
                duration: globalPrefersReducedMotion.value ? 0 : 100,
                delay: globalPrefersReducedMotion.value ? 0 : 200,
            },
            scale: [1, globalPrefersReducedMotion.value ? 1 : 0.9],
            duration: globalPrefersReducedMotion.value ? 0 : 200,
            easing: 'easeOutSine',
        }).finished;

        setTimeout(() => {
            overlay?.classList.remove('show-grid');

            const creationSaveButton = document.querySelector('.creation-save-button');
            creationSaveButton?.classList.remove('saving');
        }, 300)
    })

    const editDrillHandler = $((e: any) => {
        const drillDataElement = e.target.nextElementSibling;
        const drillData = JSON.parse(drillDataElement.innerHTML);

        showOverlayHandler('Edit', drillData);
    })

    const liveMetaStore = useStore({
        status: 'On Schedule',
        currentTime: dayjs().format('h:mm:ss A'),
        currentDrills: [] as Partial<DrillRow>[],
    });

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

    const currentLiveDrills = planDrills.value?.filter(drillData => {
        if (drillData.status === 'LIVE') {
            return true;
        }
    }) || []; 

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

    const saveDrillHandler = $(async () => {
        const creationSaveButton = document.querySelector('.creation-save-button');
        creationSaveButton?.classList.add('saving');

        const drillData = currentDrillData.value;

        console.log('Saving:', {drillData});

        drillData.user_id = plan.value?.data.user_id;
        drillData.user_email = plan.value?.data.user_email;
        drillData.plan_uuid = plan.value?.data.uuid;
        drillData.updated_at = dayjs().format();

        if (!drillData.time_start) {
            drillData.time_start = (document.querySelector('.drill-time-start input') as HTMLInputElement).value;
        }
        if (!drillData.time_end) {
            drillData.time_end = (document.querySelector('.drill-time-end input') as HTMLInputElement).value;
        }

        let statusText: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'LATE';

        const start = dayjs(drillData.time_start, 'hh:mm A');
        const end = dayjs(drillData.time_end, 'hh:mm A');

        drillData.hour_start = start.hour();
        drillData.hour_end = end.hour();

        if (dayjs().isAfter(start)) {
            if (dayjs().isBefore(end)) {
                statusText = 'LIVE';
            } else {
                statusText = 'LATE';
            }
        } else {
            statusText = 'UPCOMING';
        }

        if (drillData.status != 'COMPLETED') {
            drillData.status = statusText;
        }

        drillData.index = getDrillIndex(drillData.uuid)

        if (currentDrillData.value.uuid) {
            const data = await saveDrillToDatabase(drillData);
            console.log({data})
        } else {
            await addDrillToDatabase(drillData);
        }

        hideOverlayHandler();
    });

    const checkDrillTimes = $(() => {
        const drills = planDrills.value;
        let limitCounter = 0;
        const limit = 20;

        if (drills) {
            if (limitCounter > limit) return;

            drills.forEach((drillData) => {
                const current = dayjs();
                const start = dayjs(drillData.time_start, 'hh:mm A');
                const end = dayjs(drillData.time_end, 'hh:mm A');

                if (drillData.status === 'LIVE' && current.isAfter(end)) {
                    drillData.status = 'LATE';
                    currentDrillData.value = drillData;
                    limitCounter++;
                    return saveDrillHandler();
                }

                if (drillData.status === 'UPCOMING') {
                    if (current.isAfter(start) && current.isBefore(end)) {
                        drillData.status = 'LIVE';
                        currentDrillData.value = drillData;
                        limitCounter++;


                        /* pushChannel.subscribe((status) => {
                            if (status === 'SUBSCRIBED') {
                                pushChannel.send({
                                    type: 'broadcast',
                                    event: 'drill-starting',
                                    payload: {
                                        drillData,
                                    },
                                })
                            }
                        }) */

                        return saveDrillHandler();
                    }
                }

            })
        }
    })

    const markCompleteHandler = $((e: any) => {
        const drillDataElement = e.target.parentElement.previousElementSibling.querySelector('.drill-edit-data');
        const drillData = structuredClone(JSON.parse(drillDataElement.innerHTML)) as Partial<DrillRow>;

        const start = dayjs(drillData.time_start, 'hh:mm A');
        const end = dayjs(drillData.time_end, 'hh:mm A');

        if (drillData.status == 'COMPLETED') {
            if (dayjs().isAfter(start)) {
                if (dayjs().isBefore(end)) {
                    drillData.status = 'LIVE';
                } else {
                    drillData.status = 'LATE';
                }
            } else {
                drillData.status = 'UPCOMING';
            }
        } else {
            drillData.status = 'COMPLETED';
        }

        currentDrillData.value = drillData;
        saveDrillHandler();
    }) 

    const deleteDrillHandler = $(async (e: any) => {
        const button = e.target as HTMLElement;
        button.classList.add('deleting');

        const currentUUID = currentDrillData.value.uuid;

        if (currentUUID) {
            const databaseResponse = await deleteDrillFromDatabase(currentUUID);
            if (databaseResponse) {
                addDrillToRecovery(databaseResponse[0]);
            }
            button.classList.remove('deleting');
        }

        hideOverlayHandler();
    })
    const deletePlanHandler = $(async (e: any) => {
        const button = e.target as HTMLElement;
        button.classList.add('deleting');
        const planUUID = plan.value?.data.uuid;
        console.log({ planUUID });

        if (planUUID) {
            const databaseResponse = await deletePlanFromDatabase(planUUID);
            console.log({databaseResponse});
            if (databaseResponse) {
                await addPlanToRecovery(databaseResponse[0]);
                location.assign('/plan');
            }
        }
    })

    /* const pickerStartHandler = $((value: dayjs.Dayjs | null) => {
        if (value) {
            const formatted = value.format('hh:mm A')
            console.log('timepicker start value', formatted);

            currentDrillData.value.time_start = formatted;
        }
    })
    const pickerEndHandler = $((value: dayjs.Dayjs | null) => {
        if (value) {
            const formatted = value.format('hh:mm A')
            console.log('timepicker end value', formatted)

            currentDrillData.value.time_end = formatted;
        }
    }) */

    

    const shareURL = useSignal('');

    const copyText = useSignal('Copy');

    useVisibleTask$(() => {
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

    const expandList = useSignal(false);

    const expandDrillLibraryList = $(() => {
        expandList.value = !expandList.value;
    })

    const addDrillFromLibrary = $((drillData: Partial<DrillRow>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, index, ...duplicate } = drillData;
        const drill: Partial<DrillRow> = duplicate; 
        drill.index = getDrillIndex(); // Without specifying uuid, returns last
        drill.title = 'Copy of ' + drill.title;
        
        showOverlayHandler('Copy', drill)
    })
    
    const createDrillLibrary = $((drills: Partial<DrillRow>[]) => {
    
        return drills.map(drill => {
            if (drill.other_meta && typeof drill.other_meta === 'object') {
                if ('isFromLibrary' in drill.other_meta) {
                    //const isFromLibrary = drill.other_meta.isFromLibrary;
                }
            }
    
            return (
                <div class="drill-library-item-outer" key={drill.uuid}>
                    <div class="drill-library-item-inner">
                        <div class="drill-library-item-title">{drill.title}</div>
                        <div class="drill-library-item-description">{drill.description ? (drill.description.length > 150 ? drill.description.slice(0, 150) + '...' : drill.description) : 'No description'}</div>
                        <div class="drill-library-item-button" onClick$={() => {
                            addDrillFromLibrary(drill)
                        }}>Add a copy</div>
                    </div>
                </div>
            )
        });
    })



    const isPWA = useSignal(false);

    useVisibleTask$(() => {
        let displayMode = 'browser tab';
        if (window.matchMedia('(display-mode: standalone)').matches) {
            displayMode = 'standalone';
            isPWA.value = true;
        }
        // Log launch display mode to analytics
        console.log('DISPLAY_MODE_LAUNCH:', displayMode);


        if (plan.value?.data.status == 'live') {
            runPlanHandler();
        }

        setInterval(() => {
            checkDrillTimes();
            adjustLiveBar('show');
            liveMetaStore.currentTime = dayjs().format('h:mm:ss A');
        }, 1000)
    });

    const sendNotification = $(async () => {
        const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
    
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
        
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        const payload = 'Break Mark is starting in 5 minutes'
        const delay = 5; // seconds
        const ttl = 5; // seconds

        //const serverOrigin = import.meta.env.DEV ? `http://localhost:3000` : `http://localhost:3000`;
        const serverOrigin = `https://front-cone-server.onrender.com`;

        try {
            const registration = await navigator.serviceWorker.getRegistration('/')
            if (registration) {
                const existingSub = await registration.pushManager.getSubscription();
                let newSub;

                if (!existingSub) {
                    const response = await fetch(serverOrigin + '/vapidPublicKey');
                    const vapidPublicKey = await response.text();
    
                    console.log({vapidPublicKey});
    
                    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                    newSub = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                } else {
                    newSub = existingSub;
                }

                console.log({newSub, existingSub})

                const subscriptionRequest = await fetch(serverOrigin + '/register', {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription: newSub
                    }),
                });

                const notificationSendRequest = await fetch(serverOrigin + '/sendNotification', {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription: newSub,
                        payload: payload,
                        delay: delay,
                        ttl: ttl,
                    }),
                });

                console.log({ subscriptionRequest, notificationSendRequest })
            } else {
                console.log('No service worker registered. Move to a supported environment.')
            }
        } catch (error) {
            alert(error)
        }
    })

    const notificationTestHandler = $(async () => {
        Notification.requestPermission((p) => {
            console.log({ p })
        }).then((result) => {
            if (result === 'granted') {
                alert('Permission granted.');
                sendNotification();
                return 
            }

            if (result === 'denied') {
                sendNotification();
                return alert('You must allow notifications first. Depending on your browser, you might have to enable them in settings.')
            } 
        })
    })

    return (
    <div>
        {plan.value ? <AuthBanner accessString={'Editing'} planData={currentPlanData.value} currentEmail={currentUserEmail.value} /> : <></>}
        {plan.value ? <Navbar path={plan.value.path} planData={currentPlanData.value} currentEmail={currentUserEmail.value} /> : <></>}

        <div class="create-plan-wrap">
            <div class="meta-actions-outer">
                <div class="meta-actions-inner">
                    <div class="updated-at-text">
                        {currentPlanData.value.updated_at ? 
                        <>
                            <span>Updated {dayjs(currentPlanData.value.updated_at).fromNow()}</span>
                            <span> | </span>
                            <span> {dayjs(currentPlanData.value.updated_at).format('M.D.YYYY h:mm A')} </span>
                        </>
                        : <></>
                        }
                    </div>
                    <div class="plan-title">{currentPlanData.value.title || 'Untitled'}</div>
                    <div class="plan-description">{currentPlanData.value.description || 'No description'}</div>
                    <div class="action-button-grid">
                        <button class="plan-settings-button" onClick$={showSettingsHandler}>Edit Plan</button>
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
                </div>
            </div>

            <div class="creation-outer">
                <div class="creation-inner">
                    <div class="creation-live-tools">
                        <div class={`live-tools-grid ${runPlanButtonText.value === 'Stop Live' ? 'live' : ''}`}>
                            <button 
                            class={`run-plan-button`}
                            onClick$={runPlanHandler}
                            >{runPlanButtonText.value}</button>

                            <div class="live-timeline-meta">
                                <span class="live-timeline-drill-label">Timeline</span>
                                <span class="timeline-current-state">{runPlanButtonText.value === 'Stop Live' ? 'LIVE' : 'STANDBY'}</span>
                                <span class="timeline-meta-spacer"> | </span>
                                <span class="timeline-current-time">{liveMetaStore.currentTime}</span>
                                <span class={`timeline-status ${timelineStatusText.value.toLowerCase().split(' ').join('-')}`}>{timelineStatusText.value}</span>
                                <span class={`timeline-live-quantity timeline-quantity ${currentLiveDrills.length > 0 ? 'show' : ''}`}>{currentLiveDrills.length} / {planDrills.value?.length} Live</span>
                                <span class={`timeline-late-quantity timeline-quantity ${lateDrills.length > 0 ? 'show' : ''}`}>{lateDrills.length} / {planDrills.value?.length} Late</span>
                                <span class={`timeline-complete-quantity timeline-quantity ${completedDrills.length > 0 ? 'show' : ''}`}>{completedDrills.length} / {planDrills.value?.length} Complete</span>
                            </div>

                            {currentLiveDrills.length > 0 ? 
                            <div class="live-current-drill-wrap">
                                <span class="live-current-drill-label">Current Live Drill{currentLiveDrills.length > 1 ? 's' : ''}</span>
                                <span class="live-current-drill-grid">{currentLiveDrills.map((drillData: Partial<DrillRow>) => {
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

                    <div class="creation-grid-wrap">
                        <div class={`creation-grid ${runPlanButtonText.value === 'Stop Live' ? 'live' : ''}`}>

                        {planDrills.value ? planDrills.value.map((drillData: Partial<DrillRow>, index) => {
                            return <DrillItem data={drillData} editHandler={editDrillHandler} completeHandler={markCompleteHandler} key={drillData.uuid} index={index} />
                        })  : null}
                        
                        </div>
                        <div class="creation-live-bar-wrap">
                            <div class="creation-live-bar">
                                <div class="creation-live-bar-left"></div>
                                <div class="creation-live-bar-text">{liveMetaStore.currentTime}</div>
                                <div class="creation-live-bar-right"></div>
                            </div>
                        </div>
                    </div>


                    
                    <div class="creation-add-button" onClick$={() => {
                        showOverlayHandler('Create')
                    }}>Add Drill</div>
                </div>
            </div>

            <div class="drill-library-outer">
                <div class="drill-library-inner">
                    <div class="drill-library-title">Drill Library</div>
                    <div class="drill-library-description">Add a drill you've used or created before.</div>

                    <div class={`drill-library-list ${expandList.value ? 'expand' : ''}`}>
                    {userDrills.value ? createDrillLibrary(userDrills.value) : null }
                    </div>
                    <div class="drill-list-expand" onClick$={expandDrillLibraryList}>{expandList.value ? 'Collapse' : 'See all'}</div>
                </div>
            </div>
        </div>

        <div class="plan-meta-overlay-outer">
                <div class="plan-meta-overlay-inner">
                    <div class="plan-meta-form-outer">
                        <div class="top-actions-meta-form">
                            <div class="exit-edit-meta-form" onClick$={() => {
                                hideSettingsHandler();
                            }}>← Go back</div>
                            <button class={`plan-delete-button`} onClick$={deletePlanHandler}>Delete Plan</button>
                        </div>
                        <div class="plan-meta-form-inner">
                            <div class="meta-form-title">Plan Details</div>
                            <div class="meta-form-description">Fill out important information about your plan.</div>

                            <div class="title-label">Title</div>
                            <input
                                onInput$={(e) => {
                                    const titleString = (e.target as HTMLInputElement).value;
                                    currentPlanData.value.title = titleString;
                                }}
                                class="plan-title-input" 
                                type="text" 
                                value={currentPlanData.value.title || ''}
                            />
                            <div class="description-label">Description</div>
                            <input 
                                onInput$={(e) => {
                                    const string = (e.target as HTMLInputElement).value;
                                    currentPlanData.value.description = string;
                                }}
                                class="plan-description-input" 
                                type="text" 
                                value={currentPlanData.value.description || ''}
                            />

                            <div class="meta-plan-switches">
                                <div class={`meta-plan-notifications ${isPWA.value ? 'enable' : 'disable'}`}>
                                    <div class="plan-notification-info">
                                        <div class="plan-notification-label">Notifications</div>
                                        <div class="plan-notification-description">Enables push notifications for time sensitive events. </div>
                                    </div>
                                    {/* <input class="notif-switch" onClick$={notificationTestHandler} checked={plan.value?.data ? true : false} type="checkbox" /> */}
                                    <button onClick$={notificationTestHandler}>TEST</button>
                                    {/* <NotificationSwitch pwa={isPWA.value} client:load /> */}
                                    <div class="plan-notification-example">
                                        <div class="example"></div>
                                    </div>
                                </div>
                                {isPWA.value ? <></> : <span class="pwa-enabled">Notifications are only available if you have added Front Cone to your device. Learn more about <Link href="/learn">Notifications</Link>.</span>}
                            </div>


                            <button class="plan-save-button" onClick$={savePlanHandler}>Save Info</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class={`drill-edit-overlay-outer`}>
                <div class="drill-edit-overlay-inner">
                    <div class="drill-edit-meta-form">
                        <div class="top-actions-meta-form">
                            <div class="exit-edit-meta-form" onClick$={() => {
                                hideOverlayHandler();
                            }}>← Go back</div>
                            <button class={`creation-delete-button ${currentDrillData.value.created_at ? 'show' : ''}`} onClick$={deleteDrillHandler}>Delete Drill</button>
                        </div>
                        <div class="drill-edit-meta-form-data">
                            <div class="drill-edit-title">
                                {`${showOverlay.actionString}`} {showOverlay.actionString != 'Create' ? `"${currentDrillData.value.title}"` : 'a new drill'}
                            </div>
                            <div class="drill-edit-description">{
                                showOverlay.actionString == 'Create' ? 'Create a new drill to use in your plan.' : (showOverlay.actionString == 'Edit' ? 'Edit this drill.' : 'Copy this drill.')
                            }</div>
                            
                            <div class="title-label">Title</div>
                            <input class="drill-title-input" type="text" value={currentDrillData.value.title || ''}
                            onInput$={(e) => {
                                const titleString = (e.target as HTMLInputElement).value;
                                currentDrillData.value.title = titleString;
                            }}
                            />
                            <div class="description-label">Description</div>
                            <textarea
                            onInput$={(e) => {
                                const value = (e.target as HTMLInputElement).value;
                                currentDrillData.value.description = value;
                            }}
                            class="drill-description-input"  value={currentDrillData.value.description || ''} />

                            <div class="drill-dating">
                                {/* <div class="drill-time-start">
                                    <TimeStartPicker endTime={currentDrillData.value.time_end} inputHandler={pickerStartHandler}
                                    value={currentDrillData.value.time_start} client:load />
                                </div>
                                <div class="drill-time-end">
                                    <TimeEndPicker startTime={currentDrillData.value.time_start} inputHandler={pickerEndHandler} value={currentDrillData.value.time_end} client:load />
                                </div> */}
                            </div>

                            <button class="creation-save-button" onClick$={saveDrillHandler}>{
                                showOverlay.actionString == 'Create' ? 'Add Drill' : (showOverlay.actionString == 'Edit' ? 'Save Drill' : 'Copy Drill')
                            }</button>
                        </div>

                        <div class="drill-edit-meta-form-preview">
                            <div class="drill-preview-title">Preview</div>
                            <div class="drill-preview-description">What this drill looks like in the interface.</div>

                            <div class="preview-inner">
                                <DrillItem data={currentDrillData.value} />
                            </div>
                        </div>

            
                    </div>
                </div>
            </div>

        <div>Save Plan</div>
        <div>Share Plan</div>
    </div>
    )
}) 


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