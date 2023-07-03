import { component$ } from "@builder.io/qwik";

export const LiveBar = component$(() => {
    // ${runPlanButtonText.value === 'Stop Live' ? 'live' : ''}
    return (
        <div class={`live-bar-wrap live`}>
            <div class="live-bar-inner">
                <div class="live-bar"></div>
            </div>
        </div>
    )
})