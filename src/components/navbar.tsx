import { component$ } from "@builder.io/qwik";
import { md5 } from "~/routes/share/[id]/utils";
import { BreadCrumbs } from "./crumbs";

interface NavbarProps {
    path: string,
    planData?: any,
    currentEmail?: string,
}

export const Navbar = component$<NavbarProps>((props) => {
    const path = props.path;
    const planData = props.planData;
    const currentEmail = props.currentEmail;

    return (
        <div class="dashboard-top-bar">
            <div class="hamburger">
                <img onClick$={() => location.assign('/')} width={53} height={65} src="/logo-black.png" alt="" />    
            </div>
            <div class="navigation-crumbs">
                <BreadCrumbs path={path} customEnd={planData ? (planData.title || 'Untitled') : null} />
            </div>

            <div class="author-logo">
                <img class="image-logo" width={80} height={80} src={`https://www.gravatar.com/avatar/${currentEmail ? md5(currentEmail) : '00000000000000000000000000000000'}?s=80&d=identicon`} alt="" />
            </div>
        </div>
    );
});