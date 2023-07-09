/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react';

import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true,
    }
});

interface SupabaseAuthProps {
    view: "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password" | "verify_otp"
    children: any
}

export const SupabaseAuth = qwikify$((props: SupabaseAuthProps) => {
    const { view } = props;

    return (
        <Auth 
            supabaseClient={supabase}
            appearance={
                {
                    theme: ThemeSupa,  
                }
            }
            providers={['google', 'discord']}
            theme="dark"
            redirectTo="/home"
            view={view}
        />
    ); 
})