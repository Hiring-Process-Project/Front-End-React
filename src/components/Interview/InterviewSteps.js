import React, { useState, useEffect } from "react";
import StepsDnd from "./StepsDnd";

const API = "http://localhost:8087/api/v1/step";

export default function InterviewSteps({
    interviewsteps,               // [{ id, title, description }]
    onSelect,                     // (index, stepId, stepObj)
    selectedIndex: controlledSelectedIndex,
    interviewId,
    reloadSteps,
    onLocalReorder,               // (from, to) => void
}) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(null);
    const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

    useEffect(() => {
        if (selectedIndex != null && interviewsteps?.length > 0 && selectedIndex >= interviewsteps.length) {
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

    // batch reorder στο backend
    const applyServerReorder = async (_stepId, from, to) => {
        if (from === to) return;
        if (!interviewId) throw new Error("Missing interviewId for reorder");

        const orderedIds = interviewsteps.map((s) => s.id);
        const [moved] = orderedIds.splice(from, 1);
        orderedIds.splice(to, 0, moved);

        const r = await fetch(`${API}/interviews/${interviewId}/steps/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stepIds: orderedIds }),
        });
        if (!r.ok) throw new Error("reorder-failed");

        await reloadSteps?.();
    };

    // update description (PUT /step/{id})
    const updateDescription = async (stepId, description) => {
        const r = await fetch(`${API}/${stepId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description }),
        });
        if (!r.ok) throw new Error("failed-to-update-step");
        await reloadSteps?.();
    };

    return (
        <div style={{ padding: 0, overflow: "hidden" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    padding: "8px 10px",
                    borderBottom: "1px solid rgb(183,186,188)",
                }}
            >
                <label className="active-label" style={{ margin: 0 }}>Steps:</label>
                <label className="active-label" style={{ margin: 0 }}>Category:</label>
            </div>

            <div style={{ padding: "8px 10px", overflow: "auto" }}>
                <StepsDnd
                    steps={interviewsteps}
                    selectedIndex={selectedIndex ?? 0}
                    onSelect={handleSelect}
                    onReorder={onLocalReorder}
                    onApplyServerReorder={applyServerReorder}
                    onUpdateDescription={updateDescription}
                />
            </div>
        </div>
    );
}
