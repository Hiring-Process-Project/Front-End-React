import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col } from 'reactstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './questions.css';

const API = 'http://localhost:8087';

export default function StepsTree({
    selectedJobAdId,
    onSelectQuestion,
    canEdit = false,
    selectedQuestionId,
    // NEW: callbacks για να “εκθέτουμε” steps & active step
    onStepsChange,
    onSelectStep,
}) {
    const [steps, setSteps] = useState([]);
    const [openStepId, setOpenStepId] = useState(null);
    const [questionsByStep, setQuestionsByStep] = useState({});

    useEffect(() => {
        if (!selectedJobAdId) {
            setSteps([]); setOpenStepId(null); setQuestionsByStep({});
            onSelectQuestion?.(null);
            // NEW:
            onStepsChange?.([]);
            onSelectStep?.(null);
            return;
        }
        (async () => {
            try {
                const r = await fetch(`${API}/jobAds/${selectedJobAdId}/interview-details`);
                if (!r.ok) throw new Error();
                const data = await r.json();
                const safe = (data?.steps || [])
                    .map(s => ({ id: s.id ?? s.stepId ?? null, title: s.title ?? s.tittle ?? '' }))
                    .filter(s => s.id != null);
                setSteps(safe);
                // NEW: ενημέρωσε τον γονέα με τα steps
                onStepsChange?.(safe);

                if (safe[0]?.id) {
                    setOpenStepId(safe[0].id);
                    // NEW: ενημέρωσε τον γονέα για το ενεργό step
                    onSelectStep?.(safe[0].id);
                    await loadQuestions(safe[0].id);
                }
            } catch {
                setSteps([]);
                onStepsChange?.([]);
                setOpenStepId(null);
                onSelectStep?.(null);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    const loadQuestions = useCallback(async (stepId) => {
        try {
            const r = await fetch(`${API}/api/v1/step/${stepId}/questions`);
            const list = r.ok ? await r.json() : [];
            setQuestionsByStep(prev => ({ ...prev, [stepId]: list || [] }));
        } catch {
            setQuestionsByStep(prev => ({ ...prev, [stepId]: [] }));
        }
    }, []);

    const toggleStep = async (stepId) => {
        setOpenStepId(prev => (prev === stepId ? null : stepId));
        // NEW: ενημέρωσε ποιο step έγινε ενεργό (ή null αν κλείσει)
        onSelectStep?.(openStepId === stepId ? null : stepId);

        await loadQuestions(stepId);
        onSelectQuestion?.(null);
    };
    // NEW: άκου το custom event "question-deleted" για να αφαιρείς τη διαγραμμένη ερώτηση
    useEffect(() => {
        const handler = (ev) => {
            const { questionId, stepId } = ev.detail || {};
            if (!questionId) return;

            setQuestionsByStep((prev) => {
                const next = { ...prev };
                if (stepId && next[stepId]) {
                    next[stepId] = (next[stepId] || []).filter((q) => q.id !== questionId);
                    return next;
                }
                // αλλιώς, ψάξε παντού
                Object.keys(next).forEach((k) => {
                    next[k] = (next[k] || []).filter((q) => q.id !== questionId);
                });
                return next;
            });
        };

        window.addEventListener('question-deleted', handler);
        return () => window.removeEventListener('question-deleted', handler);
    }, []);

    // NEW: άκου το custom event "question-created" για να προσθέτεις στο UI τη νέα ερώτηση
    useEffect(() => {
        const handler = (ev) => {
            const { stepId, question } = ev.detail || {};
            if (!stepId || !question) return;

            setQuestionsByStep(prev => {
                const arr = [...(prev[stepId] || [])];
                // απόφυγε duplicates
                if (!arr.some(q => q.id === question.id)) {
                    // διατήρησε το shape όπως το χρησιμοποιείς στο render: {id, name|title}
                    arr.push({ id: question.id, name: question.name ?? question.title ?? '(untitled)' });
                }
                return { ...prev, [stepId]: arr };
            });

            // αν το step δεν είναι ανοιχτό, άνοιξέ το για να φανεί αμέσως
            setOpenStepId(curr => {
                if (curr !== stepId) {
                    onSelectStep?.(stepId);
                    // lazy load αν δεν έχει φορτωθεί ήδη
                    if (!questionsByStep[stepId]) {
                        loadQuestions(stepId);
                    }
                    return stepId;
                }
                return curr;
            });
        };

        window.addEventListener('question-created', handler);
        return () => window.removeEventListener('question-created', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionsByStep, loadQuestions]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result || {};
        if (!destination) return;

        const fromStepId = parseInt(source.droppableId.replace('step-', ''), 10);
        const toStepId = parseInt(destination.droppableId.replace('step-', ''), 10);
        const qId = parseInt(draggableId.replace('q-', ''), 10);

        if (fromStepId === toStepId) {
            const from = source.index, to = destination.index;
            setQuestionsByStep(prev => {
                const list = [...(prev[fromStepId] || [])];
                const [mv] = list.splice(from, 1);
                list.splice(to, 0, mv);
                return { ...prev, [fromStepId]: list };
            });
            if (!canEdit) return;
            try {
                const ids = (questionsByStep[fromStepId] || []).map(q => q.id);
                const arr = [...ids]; const [mv] = arr.splice(from, 1); arr.splice(to, 0, mv);
                await fetch(`${API}/api/v1/step/${fromStepId}/questions/reorder`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionIds: arr })
                });
            } catch { /* noop */ }
            return;
        }

        const toIndex = destination.index;
        setQuestionsByStep(prev => {
            const src = [...(prev[fromStepId] || [])];
            const dst = [...(prev[toStepId] || [])];
            const idx = src.findIndex(q => q.id === qId);
            if (idx >= 0) { const [it] = src.splice(idx, 1); dst.splice(Math.min(toIndex, dst.length), 0, it); }
            return { ...prev, [fromStepId]: src, [toStepId]: dst };
        });
        if (!canEdit) return;
        try {
            await fetch(`${API}/api/v1/question/${qId}/move`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toStepId, toIndex })
            });
        } catch { /* noop */ }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Row className="g-2">
                {steps.map(step => {
                    const list = questionsByStep[step.id] || [];
                    return (
                        <Col xs="12" key={step.id}>
                            <div
                                className="q-step-header"
                                onClick={() => toggleStep(step.id)}
                                title={step.title}
                            >
                                {step.title || '(Untitled step)'}
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
                                                const label = q.name ?? q.title ?? '(untitled)';
                                                const isSel = q.id === selectedQuestionId;
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
                                                                onClick={() => onSelectQuestion?.(q.id)}
                                                                className={
                                                                    'q-draggable' +
                                                                    (isSel ? ' is-selected' : '') +
                                                                    (snapshot.isDragging ? ' is-dragging' : '')
                                                                }
                                                                title={label}
                                                                style={dragProvided.draggableProps.style}
                                                            >
                                                                <div className="q-draggable-row">
                                                                    <span
                                                                        {...dragProvided.dragHandleProps}
                                                                        className="q-drag-handle"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title={canEdit ? 'Drag to reorder' : ''}
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
                        </Col>
                    );
                })}
            </Row>
        </DragDropContext>
    );
}
