import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import AddQuestionModal from "./AddQuestionModal";

export default function StepsTree({ selectedJobAdId, onSelectQuestion }) {
    const [steps, setSteps] = useState([]);
    const [openStepId, setOpenStepId] = useState(null);
    const [questionsByStep, setQuestionsByStep] = useState({});
    const [showAddQuestion, setShowAddQuestion] = useState(false);

    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const [selectedQuestionStepId, setSelectedQuestionStepId] = useState(null);

    useEffect(() => {
        if (!selectedJobAdId) {
            setSteps([]);
            setOpenStepId(null);
            setQuestionsByStep({});
            setSelectedQuestionId(null);
            setSelectedQuestionStepId(null);
            return;
        }

        const load = async () => {
            try {
                const r = await fetch(
                    `http://localhost:8087/jobAds/${selectedJobAdId}/interview-details`
                );
                if (!r.ok) throw new Error("Failed to fetch interview details");
                const data = await r.json();

                const stepsArr = Array.isArray(data?.steps) ? data.steps : [];
                const safeSteps = stepsArr.map((s) => ({
                    id: s.id ?? s.stepId ?? null,
                    title: s.title ?? s.tittle ?? "",
                }));

                setSteps(safeSteps);
                if (safeSteps[0]?.id) {
                    setOpenStepId(safeSteps[0].id);
                    loadQuestions(safeSteps[0].id);
                }
            } catch (e) {
                console.error(e);
                setSteps([]);
                setOpenStepId(null);
                setQuestionsByStep({});
            }
        };

        load();
    }, [selectedJobAdId]);

    const loadQuestions = useCallback(
        async (stepId) => {
            if (!stepId) return;
            if (questionsByStep[stepId]) return;

            try {
                const r = await fetch(
                    `http://localhost:8087/api/v1/step/${stepId}/questions`
                );
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

    const toggleStep = (stepId) => {
        setOpenStepId((prev) => (prev === stepId ? null : stepId));
        loadQuestions(stepId);
        // αν αλλάξει step, καθάρισε τυχόν επιλεγμένη ερώτηση από άλλο step
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
            return { ...prev, [stepId]: [{ ...question }, ...old] };
        });
        setOpenStepId(stepId);
        setSelectedQuestionId(question?.id ?? null);
        setSelectedQuestionStepId(stepId);
    };

    const handleQuestionClick = (q, stepId) => {
        setSelectedQuestionId(q.id);
        setSelectedQuestionStepId(stepId);
        onSelectQuestion && onSelectQuestion(q.id);
    };

    const handleDeleteSelectedQuestion = async () => {
        const qId = selectedQuestionId;
        const stepId = selectedQuestionStepId || openStepId;
        if (!qId || !stepId) return;

        const ok = window.confirm("Σίγουρα θέλεις να διαγράψεις αυτή την ερώτηση;");
        if (!ok) return;

        try {
            // Υποθέτω endpoint: DELETE /api/v1/question/{id}
            const r = await fetch(`http://localhost:8087/api/v1/question/${qId}`, {
                method: "DELETE",
            });
            if (!r.ok) throw new Error("Failed to delete question");

            setQuestionsByStep((prev) => {
                const list = prev[stepId] || [];
                const newList = list.filter((x) => x.id !== qId);
                return { ...prev, [stepId]: newList };
            });
            setSelectedQuestionId(null);
            setSelectedQuestionStepId(null);
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
                    width: "300px",
                }}
            >
                <Row className="g-2">
                    {steps.map((step) => (
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
                                <div style={{ padding: "8px 12px", borderLeft: "2px solid #aaa", marginTop: 6 }}>
                                    {(questionsByStep[step.id] || []).map((q) => {
                                        const isSelected = q.id === selectedQuestionId;
                                        return (
                                            <div
                                                key={q.id}
                                                onClick={() => handleQuestionClick(q, step.id)}
                                                style={{
                                                    cursor: "pointer",
                                                    background: isSelected ? "#eef4ff" : "#f9f9f9",
                                                    border: isSelected ? "1px solid #9db7ff" : "1px solid #eee",
                                                    borderRadius: 8,
                                                    padding: "8px 10px",
                                                    marginBottom: 6,
                                                    width: "100%",
                                                    boxSizing: "border-box",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    minHeight: 34,
                                                }}
                                                title={q.name}
                                            >
                                                {q.name}
                                            </div>
                                        );
                                    })}
                                    {(!questionsByStep[step.id] || questionsByStep[step.id].length === 0) && (
                                        <div style={{ fontSize: 12, opacity: 0.6, paddingLeft: 4 }}>No questions</div>
                                    )}
                                </div>
                            )}
                        </Col>
                    ))}
                </Row>
            </CardBody>

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
