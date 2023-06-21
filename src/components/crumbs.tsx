import { component$ } from "@builder.io/qwik"

interface BreadCrumbsProps {
    path: string,
    customEnd?: string | null
}
export const BreadCrumbs = component$<BreadCrumbsProps>((props) => {

    const separated = props.path.split('/');

    let currentLength = 0;

    const el = (text: string, length: number, isLast: boolean) => {
        const path = props.path.substring(0, length + 1);
        return <li key={text}>{isLast ? text : <a href={path}>{text}</a>}</li>
    };

    return (
        <ul class="breadcrumb">
            {
            separated.map((s) => {

                if (s == 'q-data.json') {
                    return;
                }

                currentLength = currentLength + s.length ?? 1;
                if (s.length > 0) {
                    const isLast = (s == separated[separated.length - 2]);
                    if (isLast && props.customEnd) {
                        return el(props.customEnd, currentLength, isLast)
                    }
                    return el(s, currentLength, isLast)
                }
            })
            }
        </ul>
    )
})

