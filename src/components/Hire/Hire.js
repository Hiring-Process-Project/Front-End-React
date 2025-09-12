import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Card, CardBody, Button, Input } from "reactstrap";
import StepsDropDown from "../Candidates/StepsDropDown";
import StepSkills from "../Candidates/StepSkills";
import ConfirmModal from "./ConfirmModal";
import CandidateDropdown from "../Candidates/CandidateDropDown";
import "./Hire.css";

/** TinyToast με τις έτοιμες κλάσεις από το CSS */
function TinyToast({ show, text, type = "info", onHide }) {
    React.useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const variant =
        type === "success"
            ? "tiny-toast tiny-toast--success"
            : type === "warning"
                ? "tiny-toast tiny-toast--warning"
                : type === "error"
                    ? "tiny-toast tiny-toast--error"
                    : "tiny-toast tiny-toast--info";

    return (
        <div className={variant} role="status" aria-live="polite">
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

    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

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

    // Approved candidates με τελικό score
    useEffect(() => {
        if (!jobAdId) return;
        (async () => {
            try {
                const r = await fetch(`${API_BASE}/api/v1/candidates/jobad/${jobAdId}/final-scores`);
                const data = r.ok ? await r.json() : [];
                const mapped = (Array.isArray(data) ? data : [])
                    .filter((d) =>
                        ["approved", "accepted", "hired"].includes(String(d.status || "").toLowerCase())
                    )
                    .map((d) => ({
                        id: d.candidateId ?? d.id,
                        name: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
                        status: d.status,
                        avgScore:
                            typeof d.avgScore === "number" && isFinite(d.avgScore) ? d.avgScore : null,
                    }));
                setCandidates(mapped);
            } catch {
                setCandidates([]);
            }
        })();
    }, [jobAdId]);

    // interview + steps + questions
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

    // comments (read-only)
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

    const openHireModal = () => {
        if (!selectedCandidate) return;
        if (String(selectedCandidate.status || "").toLowerCase() === "hired") {
            showToast("This candidate is already hired", "warning");
            return;
        }
        setShowConfirm(true);
    };

    const doHire = async () => {
        if (!selectedCandidate) return;
        setConfirmLoading(true);
        try {
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
            const data = await r.json();
            setCandidates((prev) =>
                prev.map((c) =>
                    c.id === data.candidateId ? { ...c, status: data.candidateStatus } : c
                )
            );
            setSelectedCandidate((prev) =>
                prev && prev.id === data.candidateId
                    ? { ...prev, status: data.candidateStatus }
                    : prev
            );

            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: data.jobAdId ?? jobAdId, status: data.jobAdStatus ?? "Complete" },
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

    if (!jobAdId) return <p style={{ padding: "1rem" }}>Select a Job Ad to view its candidates.</p>;

    return (
        <div className="vh-shell hire-shell">
            {/* TOP ROW: γεμίζει τον χώρο, με εσωτερικά scroll */}
            <Row className="g-3" style={{ flex: '1 1 auto', minHeight: 0 }}>
                {/* Approved candidates */}
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: '100%' }}>
                    <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <label className="description-labels">Approved Candidates:</label>

                        <Card className="panel panel--flex" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex' }}>
                            <CardBody
                                style={{
                                    minHeight: 0,
                                    height: '100%',
                                    display: 'grid',
                                    gridTemplateRows: 'auto 1fr', // header / scroll list
                                    gap: 8,
                                }}
                            >
                                {/* Header εκτός scroll */}
                                <Row className="panel__header-row">
                                    <Col md="4"><label className="active-label">Score:</label></Col>
                                    <Col md="4"><label className="active-label">Name:</label></Col>
                                    <Col md="4"><label className="active-label">Status:</label></Col>
                                </Row>

                                {/* ΜΟΝΟ εδώ κάνει scroll (όπως στο Candidates) */}
                                <div className="clp-scroll">
                                    <CandidateDropdown
                                        candidates={candidates}
                                        selectedId={selectedCandidate?.id ?? null}   // <-- ΚΡΙΣΙΜΟ: controlled mode
                                        renderLeft={(c) => (Number.isFinite(c.avgScore) ? c.avgScore : '—')}
                                        onSelect={async (cand) => {
                                            // toggle off -> καθάρισε τα πάντα ΚΑΙ κλείνει το collapse στο ίδιο κλικ
                                            if (!cand) {
                                                setSelectedCandidate(null);
                                                setSelectedStep(null);
                                                setSelectedQuestion(null);
                                                setRightPane(null);
                                                setCandComment('');
                                                return;
                                            }

                                            // επιλογή νέου candidate
                                            try {
                                                const r = await fetch(`${API_BASE}/api/v1/candidates/${cand.id}`);
                                                const d = r.ok ? await r.json() : null;
                                                const enriched = { ...cand, email: d?.email ?? '', cv: d?.cvPath ?? '' };
                                                setSelectedCandidate(enriched);
                                                setCandidates(prev =>
                                                    prev.map(x => (x.id === cand.id ? { ...x, email: enriched.email, cv: enriched.cv } : x))
                                                );
                                            } catch {
                                                setSelectedCandidate(cand);
                                            }

                                            // reset steps/questions/skills κάθε φορά που αλλάζει υποψήφιος
                                            setSelectedStep(null);
                                            setSelectedQuestion(null);
                                            setRightPane(null);
                                        }}
                                    />


                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Col>

                {/* Steps */}
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: '100%' }}>
                    <label className="description-labels">Interview Steps:</label>
                    <Card className="panel panel--flex">
                        {/* ΣΗΜΑΝΤΙΚΟ: το CardBody να είναι scrollable */}
                        <CardBody className="panel__scroll">
                            {selectedCandidate ? (
                                <StepsDropDown
                                    steps={steps}
                                    ratings={{}}
                                    onSelect={handleSelectQ}
                                    showScore={true}
                                    candidateId={selectedCandidate?.id}
                                    interviewReportId={selectedCandidate?.interviewReportId}
                                />
                            ) : (
                                <div className="muted">Select a candidate to see steps…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {/* Skills (read-only) */}
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: '100%' }}>
                    <label className="description-labels">Skills for this question:</label>
                    <Card className="panel panel--flex">
                        {/* ΣΗΜΑΝΤΙΚΟ: scroll και εδώ */}
                        <CardBody className="panel__scroll">
                            {selectedCandidate ? (
                                <StepSkills step={rightPaneStepObj} mode="view" />
                            ) : (
                                <div className="muted">Select a candidate to see skills…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* BOTTOM ROW: κολλημένο κάτω, δεν μεγαλώνει */}
            <Row className="g-3 mt-8" style={{ flex: '0 0 auto' }}>
                <Col md="8">
                    <Card className="shadow-sm hire-comments-card">
                        <CardBody>
                            {!selectedCandidate ? (
                                <div className="muted">Select a candidate to see comments…</div>
                            ) : (
                                <Input
                                    type="textarea"
                                    rows={2}
                                    value={candComment}
                                    readOnly
                                    className="hire-readonly-input"
                                />
                            )}
                        </CardBody>
                    </Card>
                </Col>

                <Col md="4" className="d-flex justify-content-center">
                    <Button
                        color="success"
                        onClick={openHireModal}
                        disabled={!selectedCandidate || String(selectedCandidate.status || '').toLowerCase() === 'hired'}
                        className="hire-btn"
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
                        Do you really want to <b>Hire</b> <b>{selectedCandidate?.name}</b>? This will change the
                        status to <b>Hired</b>.
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
