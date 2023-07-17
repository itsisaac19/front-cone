import { $, component$, useSignal } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import anime from 'animejs';
import { BreadCrumbs } from './crumbs';

interface NavbarProps {
    path: string,
    planData?: any,
    currentEmail?: string,
}

export const Navbar = component$<NavbarProps>((props) => {
    const path = props.path;
    const planData = props.planData;

    const isMenuOpen = useSignal(false);

    const openMenu = $(() => {
        document.querySelector('.menu-sidebar-outer')?.classList.add('open');
        anime({
            targets: '.menu-sidebar-outer',
            translateY: ['20%', '0%'],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutQuint',
            begin: () => {
                document.querySelector('.menu-sidebar-outer')?.classList.add('anime-start');
            },
            complete: () => {
                document.querySelector('.menu-sidebar-outer')?.classList.remove('anime-start');
                document.querySelector('.menu-sidebar-outer')?.classList.add('open');
            },
        })
    })
    const closeMenu = $(() => {
        anime({
            targets: '.menu-sidebar-outer',
            translateY: ['0%', '20%'],
            opacity: [1, 0],
            duration: 1000,
            easing: 'easeOutQuint',
            complete: () => {
                if (document.querySelector('.menu-sidebar-outer')?.classList.contains('anime-start')) return;
                document.querySelector('.menu-sidebar-outer')?.classList.remove('open');
            }
        })
    })

    return (
        <div class="dashboard-top-bar">
            <div class={`menu-sidebar-outer`}>
                <div class="menu-sidebar-inner">
                    <span class="menu-sidebar-label first">NAVIGATION</span>
                    <div class="link-group">
                        <Link class="menu-sidebar-link" href="/plan">My Plans</Link>
                        <Link class="menu-sidebar-link" href="/">Home</Link>
                    </div>

                    <span class="menu-sidebar-label">ACCOUNT</span>
                    <div class="link-group">
                        <Link class="menu-sidebar-link" href="/?signout=1">Sign Out</Link>
                    </div>
                </div>
            </div>

            <div class={`hamburger ${isMenuOpen.value ? 'open' : 'close'}`} onClick$={() => {
                isMenuOpen.value = !isMenuOpen.value;
                if (isMenuOpen.value) {
                    openMenu();
                } else {
                    closeMenu();
                }
            }}>
                <div class="hamburger-lines">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
            
            <div class="navigation-crumbs">
                <BreadCrumbs path={path} customEnd={planData ? (planData.title || 'Untitled') : null} />
            </div>
        </div>
    );
});