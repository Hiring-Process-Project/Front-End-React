import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Button } from "reactstrap";
import InterviewSteps from "./InterviewSteps";
import SkillSelector from "../Description/SkillSelector";
import JobDescription from "../Description/Description";
import AddStepModal from "./AddStepModal";

function Interview({ selectedJobAdId }) {
    const [interviewId, setInterviewId] = useState(null);
    const [description, setDescription] = useState("");

    const [steps, setSteps] = useState([]);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);

    const [stepSkills, setStepSkills] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [showAddStep, setShowAddStep] = useState(false);

    // Μικρότερα & ίδιου μεγέθους κουμπιά
    const actionBtnStyle = { minWidth: 104, height: 34, padding: "4px 10px", fontSize: 13.5 };

    useEffect(() => {
        fetch("http://localhost:8087/skills")
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch all skills");
                return r.json();
            })
            .then((data) => setAllSkills((data || []).map((s) => s.name)))
            .catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        if (!selectedJobAdId) return;

        setError(null);
        setInterviewId(null);
        setDescription("");
        setSteps([]);
        setStepSkills([]);
        setSelectedStepIndex(0);

        fetch(`http://localhost:8087/jobAds/${selectedJobAdId}/interview-details`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch interview details");
                return r.json();
            })
            .then((data) => {
                setInterviewId(data?.id ?? null);
                setDescription(data?.description ?? "");

                const stepsArr = Array.isArray(data?.steps) ? data.steps : [];
                const safeSteps = stepsArr.map((s) => ({
                    id: s.id ?? s.stepId ?? null,
                    title: s.title ?? s.tittle ?? "",
                }));
                setSteps(safeSteps);

                if (safeSteps.length > 0 && safeSteps[0].id != null) {
                    fetchStepSkills(safeSteps[0].id);
                    setSelectedStepIndex(0);
                }
            })
            .catch((e) => {
                console.error(e);
                setError("Δεν ήταν δυνατή η φόρτωση των στοιχείων interview.");
            });
    }, [selectedJobAdId]);

    const fetchStepSkills = useCallback((stepId) => {
        if (stepId == null) {
            setStepSkills([]);
            return;
        }
        fetch(`http://localhost:8087/api/v1/step/${stepId}/skills`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch step skills");
                return r.json();
            })
            .then((data) => {
                const names = (data || []).map((x) => x.skillName).filter(Boolean);
                setStepSkills(names);
            })
            .catch((e) => {
                console.error(e);
                setStepSkills([]);
            });
    }, []);

    const handleSelectStep = useCallback(
        (index) => {
            setSelectedStepIndex(index);
            const step = steps[index];
            if (step && step.id != null) fetchStepSkills(step.id);
            else setStepSkills([]);
        },
        [steps, fetchStepSkills]
    );

    const numberedSteps = useMemo(() => steps.map((_, i) => `Step ${i + 1}`), [steps]);
    const stepTitles = useMemo(() => steps.map((s) => s.title), [steps]);

    const getCurrentStepId = () => {
        const s = steps[selectedStepIndex];
        return s && s.id != null ? s.id : null;
    };

    const handleUpdate = async () => {
        if (!interviewId) return;
        setSaving(true);
        setError("");

        try {
            let descOk = false;
            try {
                const r = await fetch(`http://localhost:8087/interviews/${interviewId}/description`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description }),
                });
                if (r.ok) descOk = true;
            } catch { }

            if (!descOk) {
                const r2 = await fetch(`http://localhost:8087/interviews/${interviewId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description }),
                });
                if (!r2.ok) throw new Error("failed-to-update-interview-description");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCurrentStep = async () => {
        const stepId = getCurrentStepId();
        if (!stepId) return;

        const ok = window.confirm("Σίγουρα θέλεις να διαγράψεις αυτό το βήμα;");
        if (!ok) return;

        try {
            const res = await fetch(`http://localhost:8087/api/v1/step/${stepId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete step");

            setSteps((prev) => {
                const newList = prev.filter((s) => s.id !== stepId);
                let newIndex = 0;
                if (newList.length === 0) {
                    setStepSkills([]);
                } else {
                    newIndex = Math.min(selectedStepIndex, newList.length - 1);
                    const newId = newList[newIndex]?.id ?? null;
                    if (newId != null) fetchStepSkills(newId);
                    else setStepSkills([]);
                }
                setSelectedStepIndex(newIndex);
                return newList;
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleStepCreated = (newStep) => {
        const withId = {
            id: newStep?.id ?? Date.now() * -1,
            title: newStep?.title ?? "",
        };
        setSteps((prev) => [...prev, withId]);
        setSelectedStepIndex((prevIdx) => prevIdx);
    };

    if (!selectedJobAdId) {
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις το Interview.</p>;
    }

    if (error) {
        return <p style={{ padding: "1rem", color: "red" }}>{error}</p>;
    }

    return (
        <Row className="g-3">
            <Col md="5" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <label className="description-labels" style={{ paddingLeft: 10, marginBottom: 14 }}>
                    Interview Steps
                </label>

                {/* BOX: μηδένισε padding της κλάσης για να φύγει ΟΛΟ το πάνω κενό */}
                <div
                    className="boxStyle"
                    style={{
                        padding: 0,                // <— override τυχόν CSS .boxStyle { padding: ... }
                        minHeight: 375,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        flexGrow: 1,
                    }}
                >
                    {/* Scrollable area με πολύ μικρό top padding & ίσο L/R */}
                    <div style={{ flex: 1, overflow: "auto", padding: "2px 10px 0" }}>
                        <InterviewSteps
                            interviewsteps={numberedSteps}
                            category={stepTitles}
                            onSelect={handleSelectStep}
                            selectedIndex={selectedStepIndex}
                        />
                    </div>

                    <div
                        className="boxFooter"
                        style={{
                            padding: "8px 10px",
                            display: "flex",
                            justifyContent: "center",
                            gap: 15,
                        }}
                    >
                        <Button color="secondary" style={actionBtnStyle} onClick={() => setShowAddStep(true)}>
                            Create New
                        </Button>
                        <Button
                            color="danger"
                            style={actionBtnStyle}
                            onClick={handleDeleteCurrentStep}
                            disabled={!getCurrentStepId()}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Col>

            <Col md="7">
                <Row className="g-3">
                    <Col md="7">
                        <JobDescription
                            name="Interview Description"
                            description={description}
                            onDescriptionChange={setDescription}
                        />
                    </Col>

                    <Col md="5">
                        <Row className="g-3">
                            <Col>
                                <SkillSelector
                                    allskills={allSkills}
                                    requiredskills={stepSkills}
                                    setRequiredskills={setStepSkills}
                                />
                                <Row>
                                    <div className="d-flex justify-content-center">
                                        <Button
                                            color="secondary"
                                            className="delete-btn-req"
                                            style={{ marginTop: 22, minWidth: 110, height: 34 }}
                                            onClick={handleUpdate}
                                            disabled={saving || !interviewId}
                                        >
                                            {saving ? "Saving..." : "Update"}
                                        </Button>
                                    </div>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>

            <AddStepModal
                isOpen={showAddStep}
                toggle={() => setShowAddStep((v) => !v)}
                interviewId={interviewId}
                onCreated={handleStepCreated}
            />
        </Row>
    );
}

export default Interview;
