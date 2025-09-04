import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./questions.css";

const API = "http://localhost:8087";

/**
 * Καθαρό component ΛΙΣΤΑΣ (χωρίς Card/κουμπιά/modals).
 * Ο γονέας (Questions.jsx) κρατάει τα κουμπιά & τα modals.
 */
export default function StepsTree({
    selectedJobAdId,
    canEdit = false,

    // selection από/προς parent
    selectedQuestionId,
    onSelectQuestion,           // (questionId, stepId)

    // για create/delete: ο γονέας σπρώχνει reload & ποιο step να ανοίξει
    openStepIdProp = null,
    reloadKey = 0,

    // ο γονέας θέλει τα steps για να τροφοδοτήσει modal create
    onStepsChange,              // (steps: {id,title}[])
}) {
    const [steps, setSteps] = useState([]);
    const [openStepId, setOpenStepId] = useState(null);
    const [questionsByStep, setQuestionsByStep] = useState({});

    // ───── Load steps όταν αλλάζει το jobAd ─────
    useEffect(() => {
        if (!selectedJobAdId) {
            setSteps([]);
            setOpenStepId(null);
            setQuestionsByStep({});
            return;
        }

        (async () => {
            try {
                const r = await fetch(`${API}/jobAds/${selectedJobAdId}/interview-details`);
                if (!r.ok) throw new Error();
                const data = await r.json();
                const safeSteps = (Array.isArray(data?.steps) ? data.steps : [])
                    .map(s => ({ id: s.id ?? s.stepId ?? null, title: s.title ?? s.tittle ?? "" }))
                    .filter(s => s.id != null);

                setSteps(safeSteps);
                onStepsChange?.(safeSteps);

                const initialOpen = openStepIdProp ?? safeSteps[0]?.id ?? null;
                setOpenStepId(initialOpen);
            } catch (e) {
                console.error(e);
                setSteps([]);
                onStepsChange?.([]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    // sync από parent (ποιο step να ανοίξει)
    useEffect(() => {
        if (openStepIdProp != null) setOpenStepId(openStepIdProp);
    }, [openStepIdProp]);

    // Load ερωτήσεις για ανοιχτό step (και σε κάθε reloadKey)
    const loadQuestions = useCallback(async (stepId) => {
        if (!stepId) return;
        try {
            const r = await fetch(`${API}/api/v1/step/${stepId}/questions`);
            if (!r.ok) throw new Error("Failed to fetch questions");
            const list = await r.json();
            setQuestionsByStep(prev => ({ ...prev, [stepId]: list || [] }));
        } catch (e) {
            console.error(e);
            setQuestionsByStep(prev => ({ ...prev, [stepId]: [] }));
        }
    }, []);

    useEffect(() => {
        if (openStepId) loadQuestions(openStepId);
    }, [openStepId, reloadKey, loadQuestions]);

    const toggleStep = async (stepId) => {
        setOpenStepId(prev => (prev === stepId ? null : stepId));
        if (openStepId !== stepId) await loadQuestions(stepId);
    };

    const listFor = (sid) => questionsByStep[sid] || [];

    // ───── Drag & drop reorder/move ─────
    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result || {};
        if (!destination) return;

        const fromStepId = parseInt(source.droppableId.replace("step-", ""), 10);
        const toStepId = parseInt(destination.droppableId.replace("step-", ""), 10);
        const qId = parseInt(draggableId.replace("q-", ""), 10);

        if (fromStepId === toStepId) {
            const from = source.index;
            const to = destination.index;

            // optimistic
            setQuestionsByStep(prev => {
                const list = [...(prev[fromStepId] || [])];
                const [m] = list.splice(from, 1);
                list.splice(to, 0, m);
                return { ...prev, [fromStepId]: list };
            });

            if (!canEdit) return;

            try {
                const current = listFor(fromStepId);
                const ids = current.map(q => q.id);
                const re = [...ids];
                const [mv] = re.splice(from, 1);
                re.splice(to, 0, mv);

                await fetch(`${API}/api/v1/step/${fromStepId}/questions/reorder`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questionIds: re }),
                });
            } catch (e) {
                console.error(e);
            }
            return;
        }

        // move σε άλλο step
        const toIndex = destination.index;

        // optimistic
        setQuestionsByStep(prev => {
            const src = [...(prev[fromStepId] || [])];
            const dst = [...(prev[toStepId] || [])];
            const idx = src.findIndex(q => q.id === qId);
            if (idx >= 0) {
                const [item] = src.splice(idx, 1);
                dst.splice(Math.min(toIndex, dst.length), 0, item);
            }
            return { ...prev, [fromStepId]: src, [toStepId]: dst };
        });

        if (!canEdit) return;

        try {
            await fetch(`${API}/api/v1/question/${qId}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toStepId, toIndex }),
            });
        } catch (e) {
            console.error(e);
        }
    };

    const cleanSteps = useMemo(() => steps.map(s => ({ id: s.id, title: s.title })), [steps]);

    useEffect(() => { onStepsChange?.(cleanSteps); }, [cleanSteps, onStepsChange]);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {steps.map(step => {
                const list = listFor(step.id);
                const isOpen = openStepId === step.id;

                return (
                    <div key={step.id} style={{ marginBottom: 10 }}>
                        <div className="q-step-header" onClick={() => toggleStep(step.id)}>
                            {step.title || "(Untitled step)"}
                        </div>

                        {isOpen && (
                            <Droppable droppableId={`step-${step.id}`}>
                                {(dropProvided) => (
                                    <div
                                        ref={dropProvided.innerRef}
                                        {...dropProvided.droppableProps}
                                        className="q-droppable"
                                    >
                                        {list.map((q, idx) => {
                                            const label = q.name ?? q.title ?? "(untitled)";
                                            const isSelected = q.id === selectedQuestionId;
                                            return (
                                                <Draggable
                                                    key={q.id}
                                                    draggableId={`q-${q.id}`}
                                                    index={idx}
                                                    isDragDisabled={!canEdit}
                                                >
                                                    {(dragProvided, snapshot) => (
                                                        <div
                                                            ref={dragProvided.innerRef}
                                                            {...dragProvided.draggableProps}
                                                            onClick={() => onSelectQuestion?.(q.id, step.id)}
                                                            title={label}
                                                            className={[
                                                                "q-draggable",
                                                                isSelected ? "is-selected" : "",
                                                                snapshot.isDragging ? "is-dragging" : "",
                                                            ].join(" ").trim()}
                                                            style={dragProvided.draggableProps.style}
                                                        >
                                                            <div className="q-draggable-row">
                                                                <span
                                                                    {...dragProvided.dragHandleProps}
                                                                    className="q-drag-handle"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    title={canEdit ? "Drag to reorder" : ""}
                                                                >
                                                                    ⠿
                                                                </span>
                                                                <span className="q-question-text">{label}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}

                                        {dropProvided.placeholder}
                                        {list.length === 0 && <div className="q-empty">No questions</div>}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>
                );
            })}
        </DragDropContext>
    );
}
