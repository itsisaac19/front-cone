import { $, component$, useComputed$, useSignal, useStore, useTask$, useVisibleTask$ } from "@builder.io/qwik";

import { createClient } from '@supabase/supabase-js';
import type { Database } from "~/supabase";
import { type DocumentHead, routeLoader$, server$, useLocation, Link } from "@builder.io/qwik-city";
import { TimeEndPicker, TimeStartPicker } from "~/components/dating";
import dayjs from "dayjs";
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
import { NotificationSwitch } from "~/components/notification";


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
    /**
     * Upcoming drill notification.
     */
    title: 'Drill Upcoming',
    /**
     * The drill title.
     */
    drillTitle: string
    /**
     * The body of an upcoming drill notification. 
     * Automatic output: [Drill] starts in 5 minutes. Tap to view details.
     */
    body: string
} | {
    title: 'Drill Starting Now',
    /**
     * The drill title.
     */
    drillTitle: string
    /**
     * The body of an drill starting notification. 
     * Automatic output: [Drill] is starting now. Tap to view details.
     */
    body: string
} | {
    title: 'Notification Test',
    /*
     * Automatic output: [Drill] is starting now. Tap to view details.
     */
    body: 'Notifications have been turned on.'
}

export const generateNotificationPayload = (initialPayload: NotificationPayloadType) => {
    const finalPayload = { ...initialPayload };

    if (initialPayload.title === 'Drill Starting Now') {
        finalPayload.body = initialPayload.drillTitle + ' is starting now. Tap to view details.';
    } else if (initialPayload.title === 'Drill Upcoming') {
        finalPayload.body = initialPayload.drillTitle + ' starts in 5 minutes. Tap to view details.';
    } 

    return finalPayload;
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
        const getReducedMotion = () => {
            const media = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
            const mobile = () => {
                let check = false;
                (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
                return check;
            }

            return (media || mobile())
        }

        globalPrefersReducedMotion.value = getReducedMotion();
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

        const findBestMatch = (drills: Partial<DrillRow>[]) => {
            let bestMatch: Partial<DrillRow> = {};
            let smallestDifference = Infinity;

            let smallest: 'start' | 'end' | undefined;
        
            drills.forEach(obj => {
                if (obj.hour_start !== null && obj.hour_end !== null) {
                    if (!obj.hour_start || !obj.hour_end) return;
                    const startDifference = Math.abs(dayjs(obj.time_start, 'h:mm A').diff(dayjs()));
                    const endDifference = Math.abs(dayjs(obj.time_end, 'h:mm A').diff(dayjs()));
                    const smallestObjDifference = Math.min(startDifference, endDifference);

                    if (endDifference < startDifference) {
                        smallest = 'end'
                    } else {
                        smallest = 'start'
                    }

                    if (smallestObjDifference < smallestDifference) {
                        smallestDifference = smallestObjDifference;
                        bestMatch = obj;
                    }
                }
            });
            

            return {
                bestMatch,
                smallest 
            };
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
        
        const { bestMatch: match, smallest } = findBestMatch(drills);

        if (match.uuid) {
            const drillBounding = document.querySelector(`.drill-item-outer[uuid="${match.uuid}"`)?.getBoundingClientRect();
            if (drillBounding && parentBounding) {
                let offset = drillBounding.top - parentBounding.top;
                let padding = 27 + 37;

                if (smallest === 'end') {
                    offset = drillBounding.bottom - parentBounding.top;
                    padding = -10;
                }

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

        const input = (document.querySelector('.drill-description-input') as HTMLTextAreaElement);

        setTimeout(() => {
            input.style.height = '0px';
            console.log('setting', input.scrollHeight)
            input.style.height = input.scrollHeight + 'px';
        }, 100)

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
            }
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

        return drillData;
    });

    const sendNotification = $(async (payload: NotificationPayloadType) => {
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

        const delay = 0; // seconds
        const ttl = 3; // seconds

        //const serverOrigin = import.meta.env.DEV ? `http://localhost:3000` : `http://localhost:3000`;
        const serverOrigin = `https://front-cone-server-production.up.railway.app`;

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
                        payload: JSON.stringify(payload),
                        delay: delay,
                        ttl: ttl,
                    }),
                });

                console.log({ subscriptionRequest, notificationSendRequest })
            } else {
                return 'No service worker registered. Move to a supported environment.';
            }
        } catch (error) {
            return error;
        }

        return;
    })

    const notificationCheckedState = useSignal(false);

    const notificationChangeHandler = $(async (e: any) => {
        const input = e.target as HTMLInputElement;
        input.classList.remove('requesting');

        notificationCheckedState.value = input.checked;

        if (input.checked === false) {
            return;
        }

        document.body.classList.add('requesting');

        const payload = generateNotificationPayload({
            title: 'Notification Test',
            body: 'Notifications have been turned on.'
        })

        const returnToNormalState = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    document.body.classList.remove('requesting');
                    notificationCheckedState.value = false;
                    resolve(true);
                }, 800)
            })
        }

        let timeoutNormalState = null;

        const testRequest = new Promise((resolve, reject) => {
            Notification.requestPermission((p) => {
                console.log({ p })
            }).then((result) => {
                if (result === 'granted') {
                    sendNotification(payload).then((error) => {
                        if (error) {
                            reject(error)
                            timeoutNormalState = returnToNormalState();
                        }
                        resolve(result);
                    });
                    return 
                } else if (result === 'denied') {
                    resolve(result);
                    timeoutNormalState = returnToNormalState();
                    return alert('You must allow notifications first. Depending on your browser, you might have to enable them in settings.')
                } else {
                    timeoutNormalState = returnToNormalState();
                    resolve(result);
                }
            })
        })

        const [testResponse, timeout] = await Promise.allSettled([testRequest, timeoutNormalState]);
        document.body.classList.remove('requesting');
        if (testResponse.status === 'rejected') {
            alert(testResponse.reason);
        }
        console.log({testResponse, timeout});
    })

    const checkDrillTimes = $(() => {
        const drills = planDrills.value;

        if (!drills) return;

        const current = dayjs();

        drills.forEach((drillData) => {
            const start = dayjs(drillData.time_start, 'hh:mm A');
            const end = dayjs(drillData.time_end, 'hh:mm A');

            if (current.isAfter(end)) {
                if (drillData.status != 'COMPLETED' && drillData.status != 'LATE') {
                    drillData.status = 'LATE';
                    currentDrillData.value = drillData;
    
                    return saveDrillHandler();
                }
            }

            if (drillData.status === 'UPCOMING') {
                if (current.isAfter(start) && current.isBefore(end)) {
                    drillData.status = 'LIVE';
                    currentDrillData.value = drillData;

                    if (notificationCheckedState.value === true) {
                        const payload = generateNotificationPayload({
                            title: 'Drill Starting Now',
                            drillTitle: drillData.title || 'Untitled',
                            body: ''
                        })
                        sendNotification(payload)
                    }

                    return saveDrillHandler();
                }
            }

        })

        return 'checked.'
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

    const pickerStartHandler = $((value: dayjs.Dayjs | null) => {
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
    })

    

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

    const initializeServiceWorkerChecking = $(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
            if (!planDrills.value) {
                console.error('cannot initialize. @planDrills.value')
                return;
            }
            registration.active?.postMessage({
                type: 'init-check',
                drills: planDrills.value
            })
            
/*             navigator.serviceWorker.addEventListener('message', (message) => {
                const messageType: SWMessageType = message.data.type;
                if (messageType === 'check-drills') {
                    const check = checkDrillTimes();
                    console.log('checking drills', {check, message});
                } 
            }) */
        } else {
            console.log('No service worker in this environment')
        }
    })


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

        initializeServiceWorkerChecking();

        setInterval(() => {
            adjustLiveBar('show');
            checkDrillTimes();
            liveMetaStore.currentTime = dayjs().format('h:mm:ss A');
        }, 1000)
    });

    const expandCurrentLiveDrillBox = $((e: any) => {
        console.log(e)
        const button = e.target as HTMLElement;
        button.parentElement?.classList.toggle('expand');
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
                                    <NotificationSwitch checkedState={notificationCheckedState.value} changeHandler={notificationChangeHandler} pwa={isPWA.value} client:load />
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
                                const input = (e.target as HTMLInputElement);
                                const value = input.value;
                                currentDrillData.value.description = value;

                                input.style.height = '0px';
                                input.style.height = input.scrollHeight + 'px';
                            }}
                            class="drill-description-input"  value={currentDrillData.value.description || ''} />

                            <div class="drill-dating">
                                {import.meta.env.DEV ? <>
                                    <div class="drill-time-start">
                                        <TimeStartPicker endTime={currentDrillData.value.time_end} inputHandler={pickerStartHandler}
                                        value={currentDrillData.value.time_start} client:load />
                                    </div>
                                    <div class="drill-time-end">
                                        <TimeEndPicker startTime={currentDrillData.value.time_start} inputHandler={pickerEndHandler} value={currentDrillData.value.time_end} client:load />
                                    </div> 
                                </> : null}
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