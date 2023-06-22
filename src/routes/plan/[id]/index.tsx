import { $, component$, useComputed$, useSignal, useStore, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import { BreadCrumbs } from '~/components/crumbs';

import { createClient } from '@supabase/supabase-js';
import type { Database } from "~/supabase";
import { type DocumentHead, routeLoader$, server$ } from "@builder.io/qwik-city";
import { TimeEndPicker, TimeStartPicker } from "~/components/dating";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime)

import { DrillItem } from "~/components/drill-item";
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

const createBreadCrumbs = ((planData: PlanRow, path: string) => {
    return <BreadCrumbs path={path} customEnd={planData.title || 'Untitled'} />;
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


const detect = server$(() => {
    supabase.auth.onAuthStateChange(async (event) => {
        console.log(event)
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

const showSettingsHandler = $(async () => {
    const overlay = document.querySelector('.plan-meta-overlay-outer') as HTMLElement;

    overlay?.classList.add('show-grid');
    anime({
        targets: '.plan-meta-overlay-outer',
        opacity: {
            value: [0, 1],
            duration: 100,
            easing: 'easeOutSine'
        },
        scale: {
            value: [0.9, 1],
            duration: 200,
            delay: 350,
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
            duration: 100,
            delay: 200
        },
        scale: [1, 0.9],
        duration: 200,
        easing: 'easeOutSine',
    }).finished;

    setTimeout(() => {
        overlay?.classList.remove('show-grid');
    }, 300)
})

export default component$(() => {
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

    const realTimeEvent = useStore({} as any);

    useTask$(({ track }) => {
        track(() => realTimeEvent.value);
        const value = realTimeEvent.value;
        console.log('realtime event', value)
        if (value) {
            savePlanHandler();
        }
    })

    const userDrills = useComputed$(async () => {
        const eventData= realTimeEvent.value;
        console.log(`Change is MINE: `, {eventData});
        const userid = plan.value?.data?.user_id;

        if (userid) {
            const { data, error } = await supabase
            .from('drills').select().eq('user_id', userid).order('time_start', {
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

    useVisibleTask$(async () => {
        if (tokens.value?.accessToken && tokens.value?.refreshToken) {
            const existing = await supabase.auth.getSession();

            if (!existing.data.session) {
                console.error('Existing session does not exist')
            } else {
                console.log({existing})
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
                        currentPlanData.value = payload.new;
                    } else {
                        console.log(`Change is NOT mine: `, payload.eventType);
                    } 
                }
            }).subscribe()

            window.onbeforeunload = () => {
                console.log('REMOVING')
                supabase.removeChannel(channel)
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
                duration: 100,
                easing: 'easeOutSine'
            },
            scale: {
                value: [0.9, 1],
                duration: 200,
                delay: 350,
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
                duration: 100,
                delay: 200
            },
            scale: [1, 0.9],
            duration: 200,
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

        drillData.index = getDrillIndex(drillData.uuid)

        if (currentDrillData.value.uuid) {
            const data = await saveDrillToDatabase(drillData);
            console.log({data})
        } else {
            await addDrillToDatabase(drillData);
        }

        hideOverlayHandler();
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

    return (
    <div>
        <div class="dashboard-top-bar">
            <div class="hamburger">
                <img onClick$={() => location.assign('/')} width={53} height={65} src="/logo-black.png" alt="" />    
            </div>
            <div class="navigation-crumbs">
                {plan.value ? createBreadCrumbs(plan.value.data, plan.value.path) : null}
            </div>
        </div>

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
                        <button class="plan-settings-button" onClick$={showSettingsHandler}>Settings</button>
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
                    <div class="creation-grid">
                    {planDrills.value ? planDrills.value.map((drillData: Partial<DrillRow>, index) => {
                        return <DrillItem data={drillData} editHandler={editDrillHandler} key={drillData.uuid} index={index} />
                    })  : null}
                    
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
                                <div class="drill-time-start">
                                    <TimeStartPicker endTime={currentDrillData.value.time_end} inputHandler={pickerStartHandler}
                                    value={currentDrillData.value.time_start} client:load />
                                </div>
                                <div class="drill-time-end">
                                    <TimeEndPicker startTime={currentDrillData.value.time_start} inputHandler={pickerEndHandler} value={currentDrillData.value.time_end} client:load />
                                </div>
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
                content: planTitle?.data.description || '',
            },
        ],
    };
}