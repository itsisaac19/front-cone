import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuth } from '~/components/supabase-auth';

const supabase = createClient('https://mockfcvyjtpqnpctspcq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2tmY3Z5anRwcW5wY3RzcGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4MDc4ODQsImV4cCI6MjAwMjM4Mzg4NH0.bcBpMwUR3kdjXSbZAePUpExkmX0UdgRM_ANtI9G1v0s', {
    auth: {
        persistSession: true,
    }
});

type viewString = 'sign_up' | 'sign_in' | 'magic_link' | 'forgotten_password' | 'update_password' | 'verify_otp';

export default component$(() => {
  const { url } = useLocation();
  const loaded = useSignal(false);
  const view = useSignal<viewString>('sign_up');

  const initialBuffer = $(() => {
    return new Promise(resolve => {
        setTimeout(resolve, 200);
    })
  })

  useVisibleTask$(async () => {
    await initialBuffer();
    loaded.value = true;

    let signout = false;

    const signoutParam = url.searchParams.get('signout');
    if (signoutParam && parseInt(signoutParam) === 1) {
      signout = true;
    }

    supabase.auth.onAuthStateChange((event, session) => {
        console.log({event, session});
        
        if (event === 'SIGNED_OUT') {
            // delete cookies on sign out
            const expires = new Date(0).toUTCString()
            document.cookie = `my-access-token=; path=/; expires=${expires}; SameSite=Lax;`
            document.cookie = `my-refresh-token=; path=/; expires=${expires}; SameSite=Lax;`
            document.cookie = `userid=; path=/; expires=${expires}; SameSite=Lax;`;

        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const maxAge = 100 * 365 * 24 * 60 * 60 // 100 years, never expires
            document.cookie = `my-access-token=${session!.access_token}; path=/; max-age=${maxAge}; SameSite=Lax;`
            document.cookie = `my-refresh-token=${session!.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax;`
            document.cookie = `userid=${session!.user.id}; path=/; max-age=${maxAge}; SameSite=Lax;`;
        }

        if (event == 'SIGNED_IN' || session?.user) {
          if (signout == true) {
            url.searchParams.delete('signout');
            window.history.replaceState({}, '', url);
            signout = false;
            supabase.auth.signOut();
            return
          } else {
            location.assign('/plans')
          }
        }
    })
  })

  return (
    <div class="main-outer">

      <div class="logo-wrap">
        <div class="logo-text">
          <div>Front</div>
          <div>Cone</div>
        </div>
        <div class="logo-img">
          <img width={53} height={65} src="/logo-black.png" alt="" />
        </div>
      </div>

      <div class="hero-tagline">
      Front Cone <span class="grad-text">Alpha Testing</span>
      </div>

      <div class="hero-paragraph">
      During the Alpha stage of Front Cone, you might
      encounter various bugs and problems. Please report them
      as soon as possible to <u>isaactsai6@gmail.com</u>
      </div>

      <div class="underlay-image">
        <img width={1656} height={3584} src="/frontcone-standard-plan.png" alt="" />
      </div>

      <div class={`auth-outer ${loaded.value ? 'loaded' : ''}`}>
          <div class="auth-inner">
              <div class="auth-header">
              {view.value == 'sign_up' ? 'Sign up to create your account.' : 'Welcome back. Sign in to continue.'}
              </div>
              <div class="auth-wrapper">
                  {//@ts-ignore
                    <SupabaseAuth view={view.value} />
                  }
                  <div class="switcher">
                      {view.value === 'sign_up' ? 
                      <button onClick$={() => {view.value = 'sign_in'}}>I already have an account</button> 
                      : <button onClick$={() => {view.value = 'sign_up'}}>New here? Create a new account</button> }
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Welcome to Front Cone',
  meta: [
    {
      name: 'description',
      content: 'Ultimate Frisbee Coaching Management',
    },
    {
      property: 'og:image',
      content: `${import.meta.env.DEV ? 'http://localhost:5173' : 'https://frontcone.com'}/frontconeog.png`
    },
    {
      name: 'og:title',
      content: 'Welcome to Front Cone',
    },
    {
      name: 'og:description',
      content: 'Ultimate Frisbee Coaching Management',
    },
    {
      property: 'twitter:card',
      content: `summary_large_image`
    },
    {
      property: 'twitter:image',
      content: `${import.meta.env.DEV ? 'http://localhost:5173' : 'https://frontcone.com'}/frontconeog.png`
    },
    {
      name: 'twitter:title',
      content: 'Welcome to Front Cone',
    },
    {
      name: 'twitter:description',
      content: 'Ultimate Frisbee Coaching Management',
    },
  ],
};
