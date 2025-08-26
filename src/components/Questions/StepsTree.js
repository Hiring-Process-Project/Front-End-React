import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AddQuestionModal from "./AddQuestionModal";

const API = "http://localhost:8087";

export default function StepsTree({ selectedJobAdId, onSelectQuestion, canEdit = false }) {
    const [steps, setSteps] = useState([]);
    const [openStepId, setOpenStepId] = useState(null);
    const [questionsByStep, setQuestionsByStep] = useState({});
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [selectedQuestionStepId, setSelectedQuestionStepId] = useState(null);

    // ===== Load steps for selected job ad =====
    useEffect(() => {
        if (!selectedJobAdId) {
            setSteps([]);
            setOpenStepId(null);
            setQuestionsByStep({});
            setSelectedQuestionId(null);
            setSelectedQuestionStepId(null);
            return;
        }

        (async () => {
            try {
                const r = await fetch(`${API}/jobAds/${selectedJobAdId}/interview-details`);
                if (!r.ok) throw new Error();
                const data = await r.json();
                const safeSteps = (Array.isArray(data?.steps) ? data.steps : []).map((s) => ({
                    id: s.id ?? s.stepId ?? null,
                    title: s.title ?? s.tittle ?? "",
                }));
                setSteps(safeSteps);
                if (safeSteps[0]?.id) {
                    setOpenStepId(safeSteps[0].id);
                    await loadQuestions(safeSteps[0].id);
                }
            } catch (e) {
                console.error(e);
                setSteps([]);
            }
        })();
    }, [selectedJobAdId]);

    // ===== Lazy-load questions per step (cached) =====
    const loadQuestions = useCallback(
        async (stepId) => {
            if (!stepId) return;
            if (questionsByStep[stepId]) return; // cached
            try {
                const r = await fetch(`${API}/api/v1/step/${stepId}/questions`);
                if (!r.ok) throw new Error("Failed to fetch questions");
                const list = await r.json();
                setQuestionsByStep((prev) => ({ ...prev, [stepId]: list || [] }));
            } catch (e) {
                console.error(e);
                setQuestionsByStep((prev) => ({ ...prev, [stepId]: [] }));
            }
        },
        [questionsByStep]
    );

    const toggleStep = async (stepId) => {
        setOpenStepId((prev) => (prev === stepId ? null : stepId));
        await loadQuestions(stepId);
        setSelectedQuestionId(null);
        setSelectedQuestionStepId(null);
    };

    const cleanSteps = useMemo(
        () => steps.filter((s) => s?.id != null).map((s) => ({ id: s.id, title: s.title })),
        [steps]
    );

    // ===== Create / Delete =====
    const handleQuestionCreated = ({ stepId, question }) => {
        setQuestionsByStep((prev) => {
            const old = prev[stepId] || [];
            return { ...prev, [stepId]: [...old, { ...question }] };
        });
        setOpenStepId(stepId);
        setSelectedQuestionId(question?.id ?? null);
        setSelectedQuestionStepId(stepId);
    };

    const handleDeleteSelectedQuestion = async () => {
        const qId = selectedQuestionId;
        const stepId = selectedQuestionStepId || openStepId;
        if (!qId || !stepId) return;
        if (!window.confirm("Σίγουρα θέλεις να διαγράψεις αυτή την ερώτηση;")) return;

        try {
            const r = await fetch(`${API}/api/v1/question/${qId}`, { method: "DELETE" });
            if (!r.ok) throw new Error("Failed to delete question");
            setQuestionsByStep((prev) => {
                const list = prev[stepId] || [];
                return { ...prev, [stepId]: list.filter((x) => x.id !== qId) };
            });
            setSelectedQuestionId(null);
            setSelectedQuestionStepId(null);
            onSelectQuestion?.(null);
        } catch (e) {
            console.error(e);
        }
    };

    // ===== DnD handlers (ONE DragDropContext for all steps) =====
    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result || {};
        if (!destination) return;

        const fromStepId = parseInt(source.droppableId.replace("step-", ""), 10);
        const toStepId = parseInt(destination.droppableId.replace("step-", ""), 10);
        const qId = parseInt(draggableId.replace("q-", ""), 10);

        // --- Same list: reorder ---
        if (fromStepId === toStepId) {
            const from = source.index;
            const to = destination.index;

            // optimistic
            setQuestionsByStep((prev) => {
                const list = [...(prev[fromStepId] || [])];
                const [moved] = list.splice(from, 1);
                list.splice(to, 0, moved);
                return { ...prev, [fromStepId]: list };
            });

            if (!canEdit) return;

            try {
                const current = questionsByStep[fromStepId] || [];
                const ids = current.map((q) => q.id);
                const newIds = [...ids];
                const [mv] = newIds.splice(from, 1);
                newIds.splice(to, 0, mv);

                const r = await fetch(`${API}/api/v1/step/${fromStepId}/questions/reorder`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questionIds: newIds }),
                });
                if (!r.ok) console.error("reorder failed", r.status);
            } catch (e) {
                console.error(e);
            }
            return;
        }

        // --- Cross-step: move ---
        const toIndex = destination.index;

        // optimistic
        setQuestionsByStep((prev) => {
            const src = [...(prev[fromStepId] || [])];
            const dst = [...(prev[toStepId] || [])];
            const idx = src.findIndex((q) => q.id === qId);
            if (idx >= 0) {
                const [item] = src.splice(idx, 1);
                dst.splice(Math.min(toIndex, dst.length), 0, item);
            }
            return { ...prev, [fromStepId]: src, [toStepId]: dst };
        });

        if (!canEdit) return;

        try {
            const r = await fetch(`${API}/api/v1/question/${qId}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toStepId, toIndex }),
            });
            if (!r.ok) console.error("move failed", r.status);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Card className="shadow-sm h-100 flex-column" style={{ backgroundColor: "#E5E7EB" }}>
            <CardBody
                style={{
                    backgroundColor: "#E5E7EB",
                    overflowY: "auto",
                    scrollbarGutter: "stable both-edges",
                    paddingRight: 8,
                    width: 300,
                }}
            >
                <DragDropContext onDragEnd={onDragEnd}>
                    <Row className="g-2">
                        {steps.map((step) => {
                            const list = questionsByStep[step.id] || [];
                            return (
                                <Col xs="12" key={step.id}>
                                    <div
                                        onClick={() => toggleStep(step.id)}
                                        style={{
                                            cursor: "pointer",
                                            background: "#fff",
                                            border: "1px solid #dcdcdc",
                                            borderRadius: 10,
                                            padding: "10px 12px",
                                            fontWeight: 600,
                                            width: "100%",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        {step.title || "(Untitled step)"}
                                    </div>

                                    {openStepId === step.id && (
                                        <Droppable droppableId={`step-${step.id}`}>
                                            {(dropProvided) => (
                                                <div
                                                    ref={dropProvided.innerRef}
                                                    {...dropProvided.droppableProps}
                                                    style={{ padding: "8px 12px", borderLeft: "2px solid #aaa", marginTop: 6 }}
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
                                                                        {...dragProvided.draggableProps}   // ⬅️ ΜΟΝΟ αυτά στο container
                                                                        onClick={() => {
                                                                            setSelectedQuestionId(q.id);
                                                                            setSelectedQuestionStepId(step.id);
                                                                            onSelectQuestion?.(q.id);
                                                                        }}
                                                                        title={label}
                                                                        style={{
                                                                            background: isSelected
                                                                                ? "#eef4ff"
                                                                                : snapshot.isDragging
                                                                                    ? "#f0f5ff"
                                                                                    : "#f9f9f9",
                                                                            border: isSelected ? "1px solid #9db7ff" : "1px solid #eee",
                                                                            borderRadius: 8,
                                                                            padding: "8px 10px",
                                                                            marginBottom: 6,
                                                                            userSelect: "none",
                                                                            width: "100%",
                                                                            boxSizing: "border-box",
                                                                            minHeight: 34,
                                                                            ...dragProvided.draggableProps.style,
                                                                        }}
                                                                    >
                                                                        {/* row: handle + text */}
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                            {/* ⠿ Χερούλι: μόνο εδώ τα dragHandleProps */}
                                                                            <span
                                                                                {...dragProvided.dragHandleProps}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                title={canEdit ? "Drag to reorder" : ""}
                                                                                style={{
                                                                                    width: 16,
                                                                                    height: 16,
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    cursor: canEdit ? "grab" : "default",
                                                                                    opacity: 0.7,
                                                                                    userSelect: "none",
                                                                                }}
                                                                            >
                                                                                {/* SVG grip (φαίνεται σε όλες τις γραμματοσειρές) */}
                                                                                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                                                                    <circle cx="3" cy="3" r="1.4"></circle>
                                                                                    <circle cx="9" cy="3" r="1.4"></circle>
                                                                                    <circle cx="3" cy="9" r="1.4"></circle>
                                                                                    <circle cx="9" cy="9" r="1.4"></circle>
                                                                                </svg>
                                                                            </span>

                                                                            <span
                                                                                style={{
                                                                                    flex: 1,
                                                                                    whiteSpace: "nowrap",
                                                                                    overflow: "hidden",
                                                                                    textOverflow: "ellipsis",
                                                                                    color: "#2b2b2b",
                                                                                    fontSize: 14,
                                                                                }}
                                                                            >
                                                                                {label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}

                                                    {dropProvided.placeholder}

                                                    {list.length === 0 && (
                                                        <div style={{ fontSize: 12, opacity: 0.6, paddingLeft: 4 }}>No questions</div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    )}
                                </Col>
                            );
                        })}
                    </Row>
                </DragDropContext>
            </CardBody>

            {canEdit && (
                <Row>
                    <Col className="text-center" style={{ paddingBottom: 10 }}>
                        <div className="d-flex justify-content-center" style={{ gap: 10 }}>
                            <Button color="secondary" style={{ minWidth: 110, height: 36 }} onClick={() => setShowAddQuestion(true)}>
                                Create New
                            </Button>
                            <Button
                                color="danger"
                                style={{ minWidth: 110, height: 36 }}
                                onClick={handleDeleteSelectedQuestion}
                                disabled={!selectedQuestionId}
                            >
                                Delete
                            </Button>
                        </div>
                    </Col>
                </Row>
            )}

            <AddQuestionModal
                isOpen={showAddQuestion}
                toggle={() => setShowAddQuestion((v) => !v)}
                steps={cleanSteps}
                defaultStepId={openStepId || cleanSteps[0]?.id}
                onCreated={handleQuestionCreated}
            />
        </Card>
    );
}
