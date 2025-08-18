import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Button } from "reactstrap";
import InterviewSteps from "./InterviewSteps";
import JobDescription from "../Description/Description";
import AddStepModal from "./AddStepModal";
import SkillSelectorReadOnly from "../Description/SkillSelectorReadOnly";

const API = "http://localhost:8087";
const isPublished = (s) => String(s ?? '').trim().toLowerCase() === 'published';

function Interview({ selectedJobAdId }) {
    const [interviewId, setInterviewId] = useState(null);
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]); // [{id,title,description}]
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [stepSkills, setStepSkills] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showAddStep, setShowAddStep] = useState(false);
    const [status, setStatus] = useState("Pending");

    const published = isPublished(status);
    const actionBtnStyle = { minWidth: 104, height: 34, padding: "4px 10px", fontSize: 13.5 };

    // Φόρτωση interview details + job status
    useEffect(() => {
        if (!selectedJobAdId) return;

        setError(null);
        setInterviewId(null);
        setDescription("");
        setSteps([]);
        setStepSkills([]);
        setSelectedStepIndex(0);

        fetch(`${API}/jobAds/${selectedJobAdId}/interview-details`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch interview details");
                return r.json();
            })
            .then((data) => {
                const iid = data?.id ?? null;
                setInterviewId(iid);
                setDescription(data?.description ?? "");
            })
            .catch(() => setError("Δεν ήταν δυνατή η φόρτωση των στοιχείων interview."));

        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => setStatus(String(d?.status ?? 'Pending')))
            .catch(() => setStatus("Pending"));
    }, [selectedJobAdId]);

    // Φόρτωσε ταξινομημένα steps (position ASC)
    const reloadSteps = useCallback(async () => {
        if (!interviewId) return;
        try {
            const r = await fetch(`${API}/api/v1/step/interviews/${interviewId}/steps`);
            if (!r.ok) throw new Error("Failed to fetch ordered steps");
            const data = await r.json();
            const safe = (data || []).map((s) => ({
                id: s.id ?? s.stepId ?? null,
                title: s.title ?? s.tittle ?? "",
                description: s.description ?? "",
            }));
            setSteps(safe);

            const idx = Math.min(selectedStepIndex, Math.max(0, safe.length - 1));
            setSelectedStepIndex(idx);
            const currentId = safe[idx]?.id ?? null;
            if (currentId != null) fetchStepSkills(currentId);
            else setStepSkills([]);
        } catch (e) {
            console.error(e);
        }
    }, [interviewId, selectedStepIndex]);

    useEffect(() => {
        if (interviewId != null) reloadSteps();
    }, [interviewId, reloadSteps]);

    // Φέρε skills για συγκεκριμένο step
    const fetchStepSkills = useCallback((stepId) => {
        if (stepId == null) {
            setStepSkills([]);
            return;
        }
        fetch(`${API}/api/v1/step/${stepId}/skills`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch step skills");
                return r.json();
            })
            .then((data) => {
                const names = (data || []).map((x) => x.skillName).filter(Boolean);
                setStepSkills(names);
            })
            .catch(() => setStepSkills([]));
    }, []);

    // Επιλογή step
    const handleSelectStep = useCallback(
        (index, stepIdFromChild) => {
            const idx = index ?? 0;
            setSelectedStepIndex(idx);
            const stepId = stepIdFromChild ?? steps[idx]?.id ?? null;
            if (stepId != null) fetchStepSkills(stepId);
            else setStepSkills([]);
        },
        [steps, fetchStepSkills]
    );

    const getCurrentStepId = () => steps[selectedStepIndex]?.id ?? null;

    // Αισιόδοξο reorder στο UI
    const onLocalReorder = useCallback((from, to) => {
        setSteps((prev) => {
            if (!prev || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
            const arr = [...prev];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return arr;
        });
        setSelectedStepIndex((prevIdx) => {
            if (prevIdx === from) return to;
            if (from < prevIdx && to >= prevIdx) return prevIdx - 1;
            if (from > prevIdx && to <= prevIdx) return prevIdx + 1;
            return prevIdx;
        });
    }, []);

    const handleUpdate = async () => {
        if (!interviewId) return;
        setSaving(true);
        setError("");

        try {
            let descOk = false;
            try {
                const r = await fetch(`${API}/interviews/${interviewId}/description`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description }),
                });
                if (r.ok) descOk = true;
            } catch { /* ignore */ }

            if (!descOk) {
                const r2 = await fetch(`${API}/interviews/${interviewId}`, {
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
            const res = await fetch(`${API}/api/v1/step/${stepId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete step");
            await reloadSteps();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStepCreated = async () => {
        await reloadSteps();
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

                <div
                    className="boxStyle"
                    style={{ padding: 0, minHeight: 375, display: "flex", flexDirection: "column", overflow: "hidden", flexGrow: 1 }}
                >
                    <div style={{ flex: 1, overflow: "auto", padding: "2px 10px 0" }}>
                        <InterviewSteps
                            interviewsteps={steps}
                            onSelect={handleSelectStep}
                            selectedIndex={selectedStepIndex}
                            interviewId={interviewId}
                            reloadSteps={reloadSteps}
                            onLocalReorder={onLocalReorder}
                        />
                    </div>

                    {/* ΔΕΝ δείχνουμε actions αν είναι published */}
                    {!published && (
                        <div className="boxFooter" style={{ padding: "8px 10px", display: "flex", justifyContent: "center", gap: 15 }}>
                            <Button color="secondary" style={actionBtnStyle} onClick={() => setShowAddStep(true)}>
                                Create New
                            </Button>
                            <Button color="danger" style={actionBtnStyle} onClick={handleDeleteCurrentStep} disabled={!getCurrentStepId()}>
                                Delete
                            </Button>
                        </div>
                    )}
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
                                <SkillSelectorReadOnly requiredskills={stepSkills} />
                                {/* ΔΕΝ δείχνουμε Update αν είναι published */}
                                {!published && (
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
                                )}
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
