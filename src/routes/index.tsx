//@ts-nocheck
import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { SupabaseAuth } from '~/components/supabase-auth';

export default component$(() => {
  //const hash = useHash();

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

      <div class={`auth-outer`}>
          <div class="auth-inner">
              <div class="auth-header">
                  Create an Account
              </div>
              <div class="auth-wrapper">
                  <SupabaseAuth view={'sign_up'} client:only />
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
  ],
};
