import { $, component$, useSignal } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import anime from 'animejs';
import { BreadCrumbs } from './crumbs';

interface NavbarProps {
    path: string,
    /**
     * Replaces the last crumb. Useful if the last crumb is a UUID, and you want to display a title.
     */
    customLastCrumb?: any,
}

export const Navbar = component$<NavbarProps>((props) => {
    console.log(props.path)
    const path = props.path;
    const customLastCrumb = props.customLastCrumb;

    const isMenuOpen = useSignal(false);

    const openMenu = $(() => {
        document.querySelector('.menu-sidebar-outer')?.classList.add('open');
        anime({
            targets: '.menu-sidebar-outer',
            translateY: ['10%', '0%'],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutQuint',
            begin: () => {
                document.querySelector('.menu-sidebar-outer')?.classList.add('anime-open');
            },
            complete: () => {
                document.querySelector('.menu-sidebar-outer')?.classList.remove('anime-open');
                document.querySelector('.menu-sidebar-outer')?.classList.add('open');
            },
        })
    })
    const closeMenu = $(() => {
        anime({
            targets: '.menu-sidebar-outer',
            translateY: ['0%', '10%'],
            opacity: [1, 0],
            duration: 500,
            easing: 'easeOutQuint',
            begin: () => {
                document.querySelector('.menu-sidebar-outer')?.classList.add('anime-close');
            },
            complete: () => {
                if (document.querySelector('.menu-sidebar-outer')?.classList.contains('anime-open')) return;
                document.querySelector('.menu-sidebar-outer')?.classList.remove('anime-close');
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
                        <Link class="menu-sidebar-link" href="/plans">My Plans</Link>
                        <Link class="menu-sidebar-link" href="/shards">My Shards</Link>
                        <Link class="menu-sidebar-link" href="/share">Community</Link>
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
                <BreadCrumbs path={path} customLastCrumb={customLastCrumb} />
            </div>
        </div>
    );
});