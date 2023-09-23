import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Navbar } from '~/components/navbar';

/* import type { Database } from '~/supabase';
type PlanRow = Database['public']['Tables']['plans']['Row'];
type DrillRow = Database['public']['Tables']['drills']['Row']; */
import { createClient } from '@supabase/supabase-js';

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

    return {
        refreshToken,
        accessToken,
        pathname
    }
}) 

export default component$(() => {
    const loader = useInitialLoader();
    if (!loader.value) throw new Error('loader is empty');
    const { pathname, accessToken, refreshToken } = loader.value;

    const currentUserEmail = useSignal('')

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
            <div class="coming-soon">Coming soon!</div>
        </div>
    )    
})