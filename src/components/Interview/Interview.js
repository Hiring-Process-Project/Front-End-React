import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Button } from "reactstrap";
import InterviewSteps from "./InterviewSteps";
import JobDescription from "../Description/Description";
import AddStepModal from "./AddStepModal";
import SkillSelectorReadOnly from "../Description/SkillSelectorReadOnly";
import ConfirmModal from "../Hire/ConfirmModal"; // <-- πρόσθεσε το modal
import "./interview.css";

const API = "http://localhost:8087";

// helpers για status
const normalizeStatus = (s) =>
    String(s ?? "").replace(/\u00A0/g, " ").trim().toLowerCase().replace(/\s+/g, "");
const isEditableStatus = (raw) => {
    const norm = normalizeStatus(raw);
    return norm === "pending" || norm === "pedding" || norm === "draft";
};

function Interview({ selectedJobAdId }) {
    const [interviewId, setInterviewId] = useState(null);
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]); // [{id,title,description}]
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [stepSkills, setStepSkills] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showAddStep, setShowAddStep] = useState(false);

    // status από backend
    const [status, setStatus] = useState(null);
    const canEdit = useMemo(() => isEditableStatus(status), [status]);

    // state για confirm modal (delete step)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
        setStatus(null);

        // 1) interview details
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

        // 2) job status για lock
        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

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

    // Φόρτωσε ταξινομημένα steps
    const reloadSteps = useCallback(
        async () => {
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
        },
        [interviewId, selectedStepIndex, fetchStepSkills]
    );

    useEffect(() => {
        if (interviewId != null) reloadSteps();
    }, [interviewId, reloadSteps]);

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
    const getCurrentStepTitle = () => steps[selectedStepIndex]?.title || "";

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
            } catch { /* noop */ }

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

    // Ανοίγουμε το confirm όταν πατηθεί Delete
    const openDeleteConfirm = () => setConfirmOpen(true);

    // Διαγραφή step (τρέχει όταν πατηθεί "Διαγραφή" στο modal)
    const handleDeleteCurrentStepConfirmed = async () => {
        const stepId = getCurrentStepId();
        if (!stepId) {
            setConfirmOpen(false);
            return;
        }

        setDeleting(true);

        const prevSteps = steps;
        const currentIndex = selectedStepIndex;
        const nextSteps = prevSteps.filter((s) => s.id !== stepId);
        const newIndex = Math.max(0, Math.min(currentIndex, nextSteps.length - 1));

        // optimistic UI
        setSteps(nextSteps);
        setSelectedStepIndex(newIndex);
        const nextSelectedId = nextSteps[newIndex]?.id ?? null;
        if (nextSelectedId != null) fetchStepSkills(nextSelectedId);
        else setStepSkills([]);

        try {
            const res = await fetch(`${API}/api/v1/step/${stepId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete step");
            setConfirmOpen(false);
        } catch (e) {
            console.error(e);
            // rollback
            setSteps(prevSteps);
            setSelectedStepIndex(currentIndex);
            const rollbackId = prevSteps[currentIndex]?.id ?? null;
            if (rollbackId != null) fetchStepSkills(rollbackId);
            else setStepSkills([]);
            setConfirmOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    if (!selectedJobAdId) {
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις το Interview.</p>;
    }
    if (error) {
        return <p style={{ padding: "1rem", color: "red" }}>{error}</p>;
    }

    return (
        <>
            <Row className="g-3 iv-root-row">
                {/* Left: Steps */}
                <Col md="5" className="iv-col">
                    <label className="description-labels iv-left-title">Interview Steps</label>

                    <div className="boxStyle iv-card">
                        <div className="iv-card-scroll">
                            <InterviewSteps
                                interviewsteps={steps}
                                onSelect={handleSelectStep}
                                selectedIndex={selectedStepIndex}
                                interviewId={interviewId}
                                reloadSteps={reloadSteps}
                                onLocalReorder={onLocalReorder}
                                canEdit={canEdit}
                            />
                        </div>

                        {canEdit && (
                            <div className="boxFooter iv-footer">
                                <Button color="secondary" style={actionBtnStyle} onClick={() => setShowAddStep(true)}>
                                    Create New
                                </Button>
                                <Button
                                    color="danger"
                                    style={actionBtnStyle}
                                    onClick={openDeleteConfirm}          // <-- ανοίγει modal
                                    disabled={!getCurrentStepId()}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                </Col>

                {/* Right: Description + Skills */}
                <Col md="7" className="iv-col">
                    <Row className="g-3 iv-fill">
                        <Col md="7" className="iv-col">
                            <div className="iv-right-fill">
                                <JobDescription
                                    name="Interview Description"
                                    description={description}
                                    onDescriptionChange={setDescription}
                                    readOnly={!canEdit}
                                    disabled={!canEdit}
                                />
                            </div>
                        </Col>

                        <Col md="5" className="iv-col">
                            <div className="iv-right-scroll">
                                <SkillSelectorReadOnly requiredskills={stepSkills} />
                            </div>

                            {canEdit && (
                                <div className="d-flex justify-content-center iv-update-row">
                                    <Button
                                        color="secondary"
                                        className="delete-btn-req"
                                        onClick={handleUpdate}
                                        disabled={saving || !interviewId}
                                    >
                                        {saving ? "Saving..." : "Update"}
                                    </Button>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Col>

                <AddStepModal
                    isOpen={showAddStep}
                    toggle={() => setShowAddStep((v) => !v)}
                    interviewId={interviewId}
                    onCreated={reloadSteps}
                />
            </Row>

            {/* Confirm Modal για διαγραφή Step */}
            <ConfirmModal
                isOpen={confirmOpen}
                title="Διαγραφή Step"
                message={
                    <div>
                        Είσαι σίγουρος/η ότι θέλεις να διαγράψεις το step
                        {getCurrentStepTitle() ? (
                            <> <b> “{getCurrentStepTitle()}”</b>;</>
                        ) : (
                            <> αυτό;</>
                        )}
                        <br />
                        Η ενέργεια δεν είναι αναστρέψιμη.
                    </div>
                }
                confirmText="Διαγραφή"
                cancelText="Άκυρο"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteCurrentStepConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}

export default Interview;
