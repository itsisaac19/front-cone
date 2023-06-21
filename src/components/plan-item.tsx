import { component$ } from "@builder.io/qwik";
import { Link } from '@builder.io/qwik-city';

import type { Database } from "~/supabase";
type PlanRow = Database['public']['Tables']['plans']['Row'];

export const PlanItem = component$((data: PlanRow) => {
    

    return (
        <div class="plan-item-outer">
            <div class="plan-item">
                <div class="plan-primary-content">
                    <div class="plan-item-title">{data.title || 'Untitled'}</div>
                    <div class="plan-item-description">{data.description || 'No description'}</div>
                </div>
                <div class="plan-secondary-content">
                    <div class="plan-edit">
                        <Link href={`/plan/${data.uuid}`}>Edit Plan</Link>
                    </div>
                    <u class="plan-copy-link" data-link={data.shared_link}>Copy Link</u>
                </div>
            </div>
        </div>
    )
})