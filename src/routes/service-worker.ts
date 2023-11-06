/*
 * WHAT IS THIS FILE?
 *
 * The service-worker.ts file is used to have state of the art prefetching.
 * https://qwik.builder.io/qwikcity/prefetching/overview/
 *
 * Qwik uses a service worker to speed up your site and reduce latency, ie, not used in the traditional way of offline.
 * You can also use this file to add more functionality that runs in the service worker.
 */
import { setupServiceWorker } from '@builder.io/qwik-city/service-worker';
importScripts('https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js')
importScripts('https://cdn.jsdelivr.net/npm/dayjs/plugin/customParseFormat.js')
//@ts-ignore
dayjs.extend(dayjs_plugin_customParseFormat)

//@ts-ignore
console.log(dayjs('03:30', 'hh:mm'))

type NotificationPayloadType = {
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

const generateNotificationPayload = (initialPayload: NotificationPayloadType) => {
    const finalPayload = { ...initialPayload };

    if (initialPayload.title === 'Drill Starting Now') {
        finalPayload.body = initialPayload.drillTitle + ' is starting now. Tap to view details.';
    } else if (initialPayload.title === 'Drill Upcoming') {
        finalPayload.body = initialPayload.drillTitle + ' starts in 5 minutes. Tap to view details.';
    }

    return finalPayload;
}

setupServiceWorker();

addEventListener('install', () => self.skipWaiting());

addEventListener('activate', () => self.clients.claim());

const pushHandler = (event: any) => {
    // Retrieve the textual payload from event.data (a PushMessageData object).
    // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
    // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
    const payloadString = event.data ? event.data.text() : 'no payload';

    const payload = JSON.parse(payloadString) as NotificationPayloadType;

    // Keep the service worker alive until the notification is created.
    event.waitUntil(
        // Show a notification with title 'ServiceWorker Cookbook' and use the payload
        // as the body.
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: 'https://i.ibb.co/2j0b2DX/icon-256x256.png'
        })
    );
}

addEventListener('push', pushHandler)

export type ClientMessageType = 'init-check' | 'stop-check' | 'update-drills';


const sendNotification = async (payload: NotificationPayloadType) => {
    console.log({payload});
    
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
        const registration = self.registration;
        if (registration) {
            const existingSub = await registration.pushManager.getSubscription();
            let newSub;

            if (!existingSub) {
                const response = await fetch(serverOrigin + '/vapidPublicKey');
                const vapidPublicKey = await response.text();

                console.log({ vapidPublicKey });

                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                newSub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            } else {
                newSub = existingSub;
            }

            console.log({ newSub, existingSub })

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
}

const sendingDict: {
    [uuid: string]: {
        sending: boolean;
    };
} = {};

const checkDrillTimes = (drills: any) => {
    //@ts-ignore
    const current = dayjs();
    console.log('Checking:', {drills})

    drills.forEach((drillData: any) => {
        if (sendingDict[drillData.uuid]?.sending === true) {
            return;
        }
        //@ts-ignore
        const start = dayjs(drillData.time_start, 'hh:mm A');
        //@ts-ignore
        const end = dayjs(drillData.time_end, 'hh:mm A');

        if (drillData.status === 'UPCOMING') {
            /* console.groupCollapsed(drillData.title)
            console.log({ [drillData.title]: drillData });
            console.log({ start, current, end }); 
            console.groupEnd();
            */

            if (current.isAfter(start) && current.isBefore(end)) {
                console.log('in the ZONE. sending notification.')

                const payload = generateNotificationPayload({
                    title: 'Drill Starting Now',
                    drillTitle: drillData.title || 'Untitled',
                    body: ''
                })
                sendNotification(payload);
                sendingDict[drillData.uuid] = {
                    sending: true
                }
            } else {
                sendingDict[drillData.uuid] = {
                    sending: false
                }
            }
        }

        if (drillData.status === 'LATE') {
            sendingDict[drillData.uuid] = {
                sending: false
            }
        }
    })
}

interface EventData {
    type: ClientMessageType,
    drills?: [{}],
    planUUID: string
}


interface intervalData {
    interval: NodeJS.Timer | undefined,
    drills?: [{}],
    planUUID: string
}


const planNotificationDict: { [key: string]: intervalData } = {}

addEventListener('message', async (event) => {
    const { type, drills, planUUID } = event.data as EventData;

    if (type === 'stop-check') {
        if (planNotificationDict[planUUID]?.interval) {
            console.log('sw thread: stopping "check-drills" interval', { type, drills, planUUID });
            clearInterval(planNotificationDict[planUUID].interval);
            return;
        }


        return console.warn('recieved a stop-check but no interval exists.')
    }

    if (type === 'init-check') {
        if (planNotificationDict[planUUID]?.interval) {
            clearInterval(planNotificationDict[planUUID].interval);
            console.warn('interval already exists, clearing and creating a new one.')
        }

        //const messageType: SWMessageType = 'check-drills';

        if (drills) {
            console.log('sw thread: initializing "check-drills" interval', { type, drills, planUUID });

            for (const variableKey in sendingDict){
                if (Object.prototype.hasOwnProperty.call(sendingDict, variableKey)){
                    delete sendingDict[variableKey];
                }
            }

            const checkDrillsInterval = setInterval(() => {
                checkDrillTimes(drills)
            }, 1000)

            planNotificationDict[planUUID] = {
                interval: checkDrillsInterval,
                drills,
                planUUID
            };
            
        }

        /* const clients = await self.clients.matchAll();
        clients.forEach(client => {
            checkDrillsInterval = setInterval(() => {
                client.postMessage({ 
                    type: messageType,
                })
            }, 1000)
        }); */
    }

    /* if (type === 'update-drills') {
        const planIntervalData = planNotificationDict[planUUID];
        if (planIntervalData?.interval) {
            planIntervalData.drills = drills;
        }
    } */

})

declare const self: ServiceWorkerGlobalScope;
