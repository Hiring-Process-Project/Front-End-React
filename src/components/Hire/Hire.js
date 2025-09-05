import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Card, CardBody, Button, Input } from "reactstrap";
import StepsDropDown from "../Candidates/StepsDropDown";
import StepSkills from "../Candidates/StepSkills";
import ConfirmModal from "./ConfirmModal";
import CandidateDropdown from "../Candidates/CandidateDropDown";
import "../Candidates/Candidates.css";

/* tiny toast */
function TinyToast({ show, text, type = "info", onHide }) {
    React.useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const bg =
        type === "success"
            ? "#16a34a"
            : type === "warning"
                ? "#f59e0b"
                : type === "error"
                    ? "#dc2626"
                    : "#334155";

    return (
        <div
            style={{
                position: "fixed",
                right: 16,
                bottom: 16,
                background: bg,
                color: "white",
                padding: "10px 14px",
                borderRadius: 10,
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                zIndex: 9999,
                fontWeight: 600,
            }}
            role="status"
            aria-live="polite"
        >
            {text}
        </div>
    );
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8087";

export default function Hire({ jobAdId }) {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [steps, setSteps] = useState([]);
    const [interviewId, setInterviewId] = useState(null);

    const [candComment, setCandComment] = useState("");
    const [rightPane, setRightPane] = useState(null);

    // toast
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    // confirm modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // disable HIRE when already hired someone
    const [isHireDisabled, setIsHireDisabled] = useState(false);

    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
        setCandComment("");
        setCandidates([]);
        setSteps([]);
        setInterviewId(null);
        setRightPane(null);
    }, [jobAdId]);

    // === LOAD ranked candidates with FINAL SCORE (server-sorted) ===
    useEffect(() => {
        if (!jobAdId) return;
        (async () => {
            try {
                const r = await fetch(
                    `${API_BASE}/api/v1/candidates/jobad/${jobAdId}/final-scores`
                );
                const data = r.ok ? await r.json() : [];
                const mapped = (Array.isArray(data) ? data : [])
                    // δείξε μόνο approved/accepted/hired
                    .filter((d) =>
                        ["approved", "accepted", "hired"].includes(
                            String(d.status || "").toLowerCase()
                        )
                    )
                    .map((d) => ({
                        id: d.candidateId ?? d.id,
                        name: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
                        status: d.status,
                        avgScore:
                            typeof d.avgScore === "number" && isFinite(d.avgScore)
                                ? d.avgScore
                                : null,
                    }));
                setCandidates(mapped);
                setIsHireDisabled(
                    mapped.some((c) => String(c.status || "").toLowerCase() === "hired")
                );
            } catch {
                setCandidates([]);
                setIsHireDisabled(false);
            }
        })();
    }, [jobAdId]);

    // interview details + steps + questions
    useEffect(() => {
        if (!jobAdId) return;
        (async () => {
            try {
                const det = await fetch(`${API_BASE}/jobAds/${jobAdId}/interview-details`);
                const d = det.ok ? await det.json() : null;
                const iid = d?.id ?? d?.interviewId ?? null;
                setInterviewId(iid);

                const baseSteps = (Array.isArray(d?.steps) ? d.steps : [])
                    .map((s) => ({
                        id: s.id ?? s.stepId ?? null,
                        name: s.title ?? s.tittle ?? "",
                        questions: [],
                    }))
                    .filter((s) => s.id != null);

                const withQs = [];
                for (const st of baseSteps) {
                    try {
                        const r = await fetch(`${API_BASE}/api/v1/step/${st.id}/questions`);
                        const list = r.ok ? await r.json() : [];
                        withQs.push({
                            ...st,
                            questions: (Array.isArray(list) ? list : []).map((q) => ({
                                id: q.id,
                                question: q.name ?? q.title ?? "",
                            })),
                        });
                    } catch {
                        withQs.push({ ...st, questions: [] });
                    }
                }
                setSteps(withQs);
            } catch {
                setSteps([]);
            }
        })();
    }, [jobAdId]);

    // when candidate changes → load comments (read-only on Hire)
    useEffect(() => {
        if (!selectedCandidate?.id) {
            setCandComment("");
            return;
        }
        (async () => {
            try {
                const r = await fetch(`${API_BASE}/api/v1/candidates/${selectedCandidate.id}`);
                const d = r.ok ? await r.json() : null;
                setCandComment(d?.comments ?? "");
            } catch {
                setCandComment("");
            }
        })();
    }, [selectedCandidate?.id]);

    const handleSelectQ = useCallback(
        async (step, q) => {
            setSelectedStep(step);
            setSelectedQuestion(q);
            if (!q?.id) {
                setRightPane(null);
                return;
            }
            try {
                const r = await fetch(`${API_BASE}/api/v1/question/${q.id}/details`);
                const d = r.ok ? await r.json() : null;
                const skills = (Array.isArray(d?.skills) ? d.skills : [])
                    .map((s) => ({ id: s?.id, name: s?.title || s?.name }))
                    .filter((s) => s.id && s.name);
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills,
                    context: { candidateId: selectedCandidate?.id ?? null, questionId: q.id },
                });
            } catch {
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills: [],
                    context: { candidateId: selectedCandidate?.id ?? null, questionId: q.id },
                });
            }
        },
        [selectedCandidate?.id]
    );

    const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

    /* --- HIRE flow (with modal) --- */
    const openHireModal = () => {
        if (!selectedCandidate) return;
        setShowConfirm(true);
    };

    const doHire = async () => {
        if (!selectedCandidate) return;
        setConfirmLoading(true);
        try {
            // 🔁 νέο endpoint: κάνει ταυτόχρονα candidate=Hired & jobAd=Complete
            const r = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/hire`,
                { method: "POST" }
            );
            if (!r.ok) {
                const msg =
                    r.status === 400
                        ? "Only Approved candidates can be hired"
                        : r.status === 409
                            ? "JobAd already complete"
                            : "Hire failed";
                throw new Error(msg);
            }
            const data = await r.json(); // { candidateId, candidateStatus, jobAdId, jobAdStatus }

            // ενημέρωση τοπικής λίστας/επιλογής
            setCandidates(prev =>
                prev.map(c =>
                    c.id === data.candidateId ? { ...c, status: data.candidateStatus } : c
                )
            );
            setSelectedCandidate(prev =>
                prev && prev.id === data.candidateId ? { ...prev, status: data.candidateStatus } : prev
            );

            // κλείδωμα κουμπιού HIRE
            setIsHireDisabled(true);

            // ενημέρωσε το JobAd status στο υπόλοιπο UI
            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: data.jobAdId ?? jobAdId, status: data.jobAdStatus ?? "Complete" }
                })
            );

            showToast("Candidate hired", "success");
        } catch (e) {
            showToast(e.message || "Hire failed", "error");
        } finally {
            setConfirmLoading(false);
            setShowConfirm(false);
        }
    };


    /* ---------- EARLY RETURN όταν δεν έχει επιλεγεί Job Ad ---------- */
    if (!jobAdId) {
        return (
            <Row>
                <Col md="12">
                    <CardBody>Select a job ad to view its candidates.</CardBody>
                </Col>
            </Row>
        );
    }

    return (
        <div>
            <Row>
                {/* Approved candidates (με Score) */}
                <Col md="4">
                    <label className="description-labels">Approved Candidates:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            <Row className="panel__header-row">
                                <Col md="4">
                                    <label className="active-label">Score:</label>
                                </Col>
                                <Col md="4">
                                    <label className="active-label">Name:</label>
                                </Col>
                                <Col md="4">
                                    <label className="active-label">Status:</label>
                                </Col>
                            </Row>

                            <CandidateDropdown
                                candidates={candidates}                  // πρέπει να έχουν avgScore, name, status
                                renderLeft={(c) => Number.isFinite(c.avgScore) ? c.avgScore : "—"}
                                onSelect={async (cand) => {
                                    if (!cand) return;
                                    // εμπλούτιση για να ανοίγουν οι λεπτομέρειες με Email/CV
                                    try {
                                        const r = await fetch(`${API_BASE}/api/v1/candidates/${cand.id}`);
                                        const d = r.ok ? await r.json() : null;
                                        const enriched = {
                                            ...cand,
                                            email: d?.email ?? "",
                                            cv: d?.cvPath ?? "", // ή μόνο filename αν έτσι δουλεύει το download
                                        };
                                        setSelectedCandidate(enriched);
                                        setCandidates(prev =>
                                            prev.map(x => x.id === cand.id ? { ...x, email: enriched.email, cv: enriched.cv } : x)
                                        );
                                    } catch {
                                        setSelectedCandidate(cand);
                                    }
                                    setSelectedStep(null);
                                    setSelectedQuestion(null);
                                    setRightPane(null);
                                }}
                            />

                        </CardBody>
                    </Card>
                </Col>

                {/* Steps */}
                <Col md="4">
                    <label className="description-labels">Interview Steps:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            {selectedCandidate ? (
                                <StepsDropDown
                                    steps={steps}
                                    ratings={{}}
                                    onSelect={handleSelectQ}
                                    showScore={true}
                                    candidateId={selectedCandidate?.id}
                                    interviewReportId={selectedCandidate?.interviewReportId} // optional
                                />) : (
                                <div style={{ opacity: 0.6 }}>Select a candidate to see steps…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {/* Skills read-only */}
                <Col md="4">
                    <label className="description-labels">Skills for this question:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            {selectedCandidate ? (
                                <StepSkills step={rightPaneStepObj} mode="view" />
                            ) : (
                                <div style={{ opacity: 0.6 }}>Select a candidate to see skills…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Comments (read-only) + HIRE */}
            <Row style={{ marginTop: 16, alignItems: "flex-start" }}>
                <Col md="8">
                    <Card
                        className="shadow-sm"
                        style={{ backgroundColor: "#E5E7EB", borderRadius: 12, minHeight: 140 }}
                    >
                        <CardBody>
                            {!selectedCandidate ? (
                                <div style={{ opacity: 0.6 }}>Select a candidate to see comments…</div>
                            ) : (
                                <Input
                                    type="textarea"
                                    rows={2}
                                    value={candComment}
                                    readOnly
                                    style={{ resize: "none", backgroundColor: "#f3f4f6", cursor: "default", fontSize: 11 }}
                                />
                            )}
                        </CardBody>
                    </Card>
                </Col>

                <Col md="4" className="d-flex justify-content-center">
                    <Button
                        color="success"
                        onClick={openHireModal}
                        disabled={isHireDisabled || !selectedCandidate}
                        style={{ minWidth: 160, height: 44, fontWeight: 600 }}
                    >
                        HIRE
                    </Button>
                </Col>
            </Row>

            <ConfirmModal
                isOpen={showConfirm}
                title="Confirm Hire"
                message={
                    <>
                        Do you really want to <b>Hire</b> <b>{selectedCandidate?.name}</b>? This will change the status to{" "}
                        <b>Hired</b>.
                    </>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                confirmColor="success"
                loading={confirmLoading}
                onConfirm={doHire}
                onCancel={() => setShowConfirm(false)}
            />

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}
