import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Input, Button } from "reactstrap";

export default function StepsDnd({
    steps = [],
    selectedIndex = 0,
    onSelect,
    onReorder,
    onApplyServerReorder,

    // αν είναι undefined, δεν καλούμε update
    onUpdateDescription,

    // flags
    readOnlyDescription = false,
    showSaveButton = true,
    dndDisabled = false,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [draft, setDraft] = useState({});
    const [savingId, setSavingId] = useState(null);

    const toggleOpen = (idx) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
        onSelect?.(idx);
    };

    const handleDragEnd = async (result) => {
        if (dndDisabled) return;
        const { source, destination } = result || {};
        if (!destination) return;
        const from = source.index;
        const to = destination.index;
        if (from === to) return;

        const stepId = steps[from]?.id;
        onReorder?.(from, to); // optimistic
        try {
            await onApplyServerReorder?.(stepId, from, to);
            setOpenIndex((prev) => {
                if (prev == null) return prev;
                if (prev === from) return to;
                if (from < prev && to >= prev) return prev - 1;
                if (from > prev && to <= prev) return prev + 1;
                return prev;
            });
        } catch (e) {
            onReorder?.(to, from); // revert
            console.error(e);
        }
    };

    const startEdit = (stepId, initial) => {
        if (readOnlyDescription) return;
        setDraft((d) => ({ ...d, [stepId]: initial ?? "" }));
    };

    const commitEdit = async (stepId) => {
        if (readOnlyDescription || !onUpdateDescription) return;
        const text = draft[stepId] ?? "";
        if (savingId === stepId) return;
        setSavingId(stepId);
        try {
            await onUpdateDescription(stepId, text);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps-accordion">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {steps.map((s, idx) => {
                            const isSelected = idx === selectedIndex;
                            const isOpen = idx === openIndex;

                            return (
                                <Draggable
                                    key={s.id ?? idx}
                                    draggableId={`step-${s.id ?? idx}`}
                                    index={idx}
                                    isDragDisabled={dndDisabled}
                                >
                                    {(dragProvided, snapshot) => (
                                        <div
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            style={{
                                                border: "1px solid #e0e0e0",
                                                borderRadius: 12,
                                                background: snapshot.isDragging ? "#eef3ff" : "#f7f7f7",
                                                marginBottom: 10,
                                                ...dragProvided.draggableProps.style,
                                            }}
                                        >
                                            {/* HEADER */}
                                            <div
                                                className="step-row-header"
                                                onClick={() => toggleOpen(idx)}
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "1fr 1fr",
                                                    alignItems: "center",
                                                    gap: 12,
                                                    padding: "10px 12px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 24, paddingLeft: 12 }}>
                                                    {!dndDisabled && (
                                                        <span
                                                            {...dragProvided.dragHandleProps}
                                                            title="Drag to reorder"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ userSelect: "none", cursor: "grab", fontSize: 14, opacity: 0.7 }}
                                                        >
                                                            ⠿
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: "#2b2b2b" }}>
                                                        {`Step ${idx + 1}`}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: "#2b2b2b",
                                                        textAlign: "left",
                                                        paddingLeft: 25,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {s.title || "—"}
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div style={{ padding: "0 12px 12px" }}>
                                                    <label style={{ fontSize: 12, opacity: 0.7, marginBottom: 6, display: "block" }}>
                                                        Step Description
                                                    </label>
                                                    <Input
                                                        type="textarea"
                                                        rows={3}
                                                        value={draft[s.id] ?? s.description ?? ""}
                                                        onChange={(e) => startEdit(s.id, e.target.value)}
                                                        onBlur={() => commitEdit(s.id)}
                                                        placeholder="Write a short description for this step…"
                                                        readOnly={readOnlyDescription}
                                                        disabled={readOnlyDescription}
                                                        style={{ resize: "none", overflowWrap: "anywhere", boxSizing: "border-box" }}
                                                    />

                                                    {showSaveButton && onUpdateDescription && (
                                                        <div className="d-flex justify-content-end" style={{ gap: 8, marginTop: 8 }}>
                                                            <Button
                                                                size="sm"
                                                                color="secondary"
                                                                outline
                                                                onClick={() => commitEdit(s.id)}
                                                                disabled={savingId === s.id}
                                                            >
                                                                {savingId === s.id ? "Saving…" : "Save"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
