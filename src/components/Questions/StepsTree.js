import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AddQuestionModal from "./AddQuestionModal";
import ConfirmModal from "../Hire/ConfirmModal"; // <-- προσαρμόσε το path αν χρειάζεται
import "./questions.css";

const API = "http://localhost:8087";

export default function StepsTree({ selectedJobAdId, onSelectQuestion, canEdit = false }) {
    const [steps, setSteps] = useState([]);
    const [openStepId, setOpenStepId] = useState(null);
    const [questionsByStep, setQuestionsByStep] = useState({});
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [selectedQuestionStepId, setSelectedQuestionStepId] = useState(null);

    // confirm modal (DELETE question)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const handleQuestionCreated = ({ stepId, question }) => {
        setQuestionsByStep((prev) => {
            const old = prev[stepId] || [];
            return { ...prev, [stepId]: [...old, { ...question }] };
        });
        setOpenStepId(stepId);
        setSelectedQuestionId(question?.id ?? null);
        setSelectedQuestionStepId(stepId);
    };

    // --- open confirm for delete ---
    const openDeleteConfirm = () => {
        if (!selectedQuestionId) return;
        setConfirmDeleteOpen(true);
    };

    // --- actual delete (confirmed) ---
    const handleDeleteConfirmed = async () => {
        const qId = selectedQuestionId;
        const stepId = selectedQuestionStepId || openStepId;
        if (!qId || !stepId) return;

        setDeleting(true);
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
            setConfirmDeleteOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result || {};
        if (!destination) return;

        const fromStepId = parseInt(source.droppableId.replace("step-", ""), 10);
        const toStepId = parseInt(destination.droppableId.replace("step-", ""), 10);
        const qId = parseInt(draggableId.replace("q-", ""), 10);

        if (fromStepId === toStepId) {
            const from = source.index;
            const to = destination.index;

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

        const toIndex = destination.index;

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
        <Card className="shadow-sm h-100 q-card q-card-bg">
            <CardBody className="q-card-body">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Row className="g-2">
                        {steps.map((step) => {
                            const list = questionsByStep[step.id] || [];
                            return (
                                <Col xs="12" key={step.id}>
                                    <div className="q-step-header" onClick={() => toggleStep(step.id)}>
                                        {step.title || "(Untitled step)"}
                                    </div>

                                    {openStepId === step.id && (
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
                                                                        onClick={() => {
                                                                            setSelectedQuestionId(q.id);
                                                                            setSelectedQuestionStepId(step.id);
                                                                            onSelectQuestion?.(q.id);
                                                                        }}
                                                                        title={label}
                                                                        className={[
                                                                            "q-draggable",
                                                                            isSelected ? "is-selected" : "",
                                                                            snapshot.isDragging ? "is-dragging" : ""
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
                                                                                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                                                                                    <circle cx="3" cy="3" r="1.4"></circle>
                                                                                    <circle cx="9" cy="3" r="1.4"></circle>
                                                                                    <circle cx="3" cy="9" r="1.4"></circle>
                                                                                    <circle cx="9" cy="9" r="1.4"></circle>
                                                                                </svg>
                                                                            </span>

                                                                            <span className="q-question-text">{label}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}

                                                    {dropProvided.placeholder}

                                                    {list.length === 0 && (
                                                        <div className="q-empty">No questions</div>
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
                <div className="q-actions">
                    <Button color="secondary" style={{ minWidth: 110, height: 36 }} onClick={() => setShowAddQuestion(true)}>
                        Create New
                    </Button>
                    <Button
                        color="danger"
                        style={{ minWidth: 110, height: 36 }}
                        onClick={openDeleteConfirm}
                        disabled={!selectedQuestionId}
                    >
                        Delete
                    </Button>
                </div>
            )}

            <AddQuestionModal
                isOpen={showAddQuestion}
                toggle={() => setShowAddQuestion((v) => !v)}
                steps={cleanSteps}
                defaultStepId={openStepId || cleanSteps[0]?.id}
                onCreated={handleQuestionCreated}
            />

            {/* Confirm Delete Question */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Διαγραφή ερώτησης"
                message={
                    <div>
                        Θέλεις σίγουρα να διαγράψεις αυτή την ερώτηση;
                        <br />
                        Η ενέργεια δεν είναι αναστρέψιμη.
                    </div>
                }
                confirmText="Διαγραφή"
                cancelText="Άκυρο"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </Card>
    );
}
