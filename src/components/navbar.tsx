import { component$ } from "@builder.io/qwik";
import { BreadCrumbs } from "./crumbs";

interface NavbarProps {
    path: string,
    planData?: any
}

export const Navbar = component$<NavbarProps>((props) => {
    const path = props.path;
    const planData = props.planData;

    return (
        <div class="dashboard-top-bar">
            <div class="hamburger">
                <img onClick$={() => location.assign('/')} width={53} height={65} src="/logo-black.png" alt="" />    
            </div>
            <div class="navigation-crumbs">
                <BreadCrumbs path={path} customEnd={planData ? (planData.title || 'Untitled') : null} />
            </div>
        </div>
    );
});