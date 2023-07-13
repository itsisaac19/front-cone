import { component$, useVisibleTask$ } from '@builder.io/qwik';
import NProgress from 'nprogress';

export const ProgressBar = component$(() => {

    useVisibleTask$(() => {
        NProgress.configure({ showSpinner: false });
        NProgress.start();

        window.onbeforeunload = (() => {
            NProgress.start();
        })

        let timer: NodeJS.Timeout;
        let state: string;
        let activeRequests = 0;
        const delay = 0;
        
        const load = () => {
            if (state === 'loading') {
                return;
            }
        
            state = 'loading';
        
            timer = setTimeout(function () {
                NProgress.start();
            }, delay); // only show progress bar if it takes longer than the delay
        }
        
        const stop = () => {
            if (activeRequests > 0) {
                return;
            }
        
            state = 'stop';
        
            clearTimeout(timer);
            NProgress.done();
        }

        const originalFetch = window.fetch;
        console.log({originalFetch})
        window.fetch = async function (...args) {
            if (activeRequests === 0) {
                load();
            }

            activeRequests++;

            try {
                const response = await originalFetch(...args);
                return response;
            } catch (error) {
                return Promise.reject(error);
            } finally {
                activeRequests -= 1;
                if (activeRequests === 0) {
                stop();
                }
            }
        };

        NProgress.done();
    })

    return <></>
})