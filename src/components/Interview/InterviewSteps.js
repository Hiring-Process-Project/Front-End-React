import React, { useState, useEffect } from "react";
import StepsDnd from "./StepsDnd";
import "./interview.css";

/**
 * Backends:
 * - PUT   /api/v1/step/{stepId}/description
 * - PATCH /api/v1/step/interviews/{interviewId}/steps/reorder
 */
const API_STEP = "http://localhost:8087/api/v1/step";

export default function InterviewSteps({
    interviewsteps = [],           // [{ id, title, description }]
    onSelect,                      // (index, stepId, stepObj)
    selectedIndex: controlledSelectedIndex,
    interviewId,
    reloadSteps,
    onLocalReorder,                // (from, to) => void
    canEdit = true,                // έλεγχος editability από γονέα
}) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(null);
    const selectedIndex = controlledSelectedIndex ?? internalSelectedIndex;

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

    // === Server reorder (PATCH) ===
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

    // === Update description (PUT) ===
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
    );
}
