import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { md5 } from '~/routes/share/[id]/utils';

interface AuthBannerProps {
    planData?: any,
    accessString: 'Viewing' | 'Editing'
    currentEmail?: string,
}

export const AuthBanner = component$<AuthBannerProps>((props) => {
    const planData = props.planData;
    const accessString = props.accessString;
    const currentEmail = props.currentEmail;

    console.log(currentEmail);


    let showEdit = false;

    if (planData.user_email == currentEmail && accessString === 'Viewing') {
        showEdit = true;
    }

    return (
        <div class="auth-banner-wrap">
            <div class="auth-banner-grid">
                <span class="auth-banner-email-label">{accessString} as</span>
                <span class="auth-banner-email">{currentEmail || 'Anonymous'}</span>
                {showEdit ? <Link href={`/plan/${planData.uuid}`} class="auth-banner-edit">Edit Plan</Link> : null}
            </div>

            <div class="author-logo">
                <img class="image-logo" width={80} height={80} src={`https://www.gravatar.com/avatar/${currentEmail ? md5(currentEmail) : '00000000000000000000000000000000'}?s=80&d=identicon`} alt="" />
            </div>
        </div>
    );
});