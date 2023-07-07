import { type RequestHandler } from "@builder.io/qwik-city";

import webPush from 'web-push';

export const onGet: RequestHandler = async (requestEvent) => { 

    const params = requestEvent.params;
    const endpoint = params.endpoint as 'vapidPublicKey' | 'register' | 'sendNotification';
    console.log({ endpoint })

    if (endpoint === 'vapidPublicKey') {
        let vapidPublicKey = requestEvent.env.get('VAPID_PUBLIC_KEY');
        let vapidPrivateKey = requestEvent.env.get('VAPID_PRIVATE_KEY');
    
        if (!vapidPublicKey|| !vapidPrivateKey) {
            const generatedKeys = webPush.generateVAPIDKeys();
            vapidPublicKey = generatedKeys.publicKey;
            vapidPrivateKey = generatedKeys.privateKey;
        }
    
        webPush.setVapidDetails(
            'mailto: isaactsai6@gmail.com', 
            vapidPublicKey, 
            vapidPrivateKey
        )

        requestEvent.text(200, vapidPublicKey)
    }
}

export const onPost: RequestHandler = async (requestEvent) => { 

    const params = requestEvent.params;
    const endpoint = params.endpoint as 'vapidPublicKey' | 'register' | 'sendNotification';
    console.log({ endpoint })

    if (endpoint === 'register') {
        // Store subscription information
        const data = await requestEvent.parseBody();
        console.log('register', { data })

        requestEvent.status(201);
    }

    if (endpoint === 'sendNotification') {
        const body: any = await requestEvent.parseBody();

        const subscription = body.subscription;
        const payload = body.payload;
        console.log({payload})
        const options = {
            TTL: body.ttl,
        };
    
        setTimeout(function () {
            webPush.sendNotification(subscription, payload, options)
                .then(function () {
                    requestEvent.status(201);
                })
                .catch(function (error) {
                console.log(error);
                    requestEvent.status(500);
                });
        }, body.delay * 1000);
    }
}