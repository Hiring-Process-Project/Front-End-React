import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import StepsDnd from "./StepsDnd";
import "./interview.css";

const API_STEP = process.env.REACT_APP_BASE_URL+'/api/v1/step';

export default function InterviewSteps({
    interviewsteps = [],
    onSelect,
    selectedIndex: controlledSelectedIndex,
    interviewId,
    reloadSteps,
    onLocalReorder,
    canEdit = true,
    /** extra "ανάσα" κάτω, όπως στο sidebar */
    reserve = 80,
}) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(null);
    const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

    /* ---- exact ίδιο fitting με το sidebar ---- */
    const scrollRef = useRef(null);
    useLayoutEffect(() => {
        const fit = () => {
            const el = scrollRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            // αν έχει footer κάτω στο card (Create/Delete), αφαιρείται αυτόματα μέσω reserve
            const height = window.innerHeight - rect.top - reserve;
            el.style.height = `${Math.max(160, height)}px`;
            el.style.overflowY = "auto";
            el.style.overflowX = "hidden";
        };
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [reserve, interviewsteps.length]);

    useEffect(() => {
        if (
            selectedIndex != null &&
            interviewsteps?.length > 0 &&
            selectedIndex >= interviewsteps.length
        ) {
            const safe = interviewsteps.length - 1;
            setInternalSelectedIndex(safe);
            const step = interviewsteps[safe];
            onSelect?.(safe, step?.id ?? null, step ?? null);
        }
    }, [interviewsteps, selectedIndex, onSelect]);

    const handleSelect = (index) => {
        if (controlledSelectedIndex == null) setInternalSelectedIndex(index);
        const step = interviewsteps?.[index];
        onSelect?.(index, step?.id ?? null, step ?? null);
    };

    const applyServerReorder = async (_stepId, from, to) => {
        if (from === to) return;
        if (!interviewId) throw new Error("Missing interviewId for reorder");

        const orderedIds = interviewsteps.map((s) => s.id);
        const [moved] = orderedIds.splice(from, 1);
        orderedIds.splice(to, 0, moved);

        const r = await fetch(`${API_STEP}/interviews/${interviewId}/steps/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stepIds: orderedIds }),
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`reorder-failed (${r.status}) ${txt}`);
        }
        await reloadSteps?.();
    };

    const updateDescription = async (stepId, description) => {
        const r = await fetch(`${API_STEP}/${stepId}/description`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: description ?? "" }),
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`failed-to-update-step (${r.status}) ${txt}`);
        }
        await reloadSteps?.();
    };

    return (
        <div className="iv-no-x">
            <div className="iv-steps-head">
                <label className="active-label" style={{ margin: 0 }}>Steps:</label>
                <label className="active-label" style={{ margin: 0 }}>Category:</label>
            </div>

            {/* 🟩 Ο scroller είναι εδώ, όπως στο sidebar */}
            <div ref={scrollRef} className="iv-dnd-scroll row">
                <div className="iv-dnd-list">
                    <StepsDnd
                        steps={interviewsteps}
                        selectedIndex={selectedIndex ?? 0}
                        onSelect={handleSelect}
                        onReorder={onLocalReorder}
                        onApplyServerReorder={applyServerReorder}
                        onUpdateDescription={canEdit ? updateDescription : undefined}
                        readOnlyDescription={!canEdit}
                        showSaveButton={!!canEdit}
                        dndDisabled={!canEdit}
                    />
                </div>
            </div>
        </div>
    );
}
