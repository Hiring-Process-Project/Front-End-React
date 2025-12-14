import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Card, CardBody, Button, Input } from "reactstrap";
import StepsDropDown from "../Candidates/StepsDropDown";
import StepSkills from "../Candidates/StepSkills";
import ConfirmModal from "./ConfirmModal";
import CandidateDropdown from "../Candidates/CandidateDropDown";
import "./Hire.css";

const API_BASE = process.env.REACT_APP_BASE_URL;

/* ---------- Toast helper (global + fallback) ---------- */
const toast = (msg, type = "success", ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent("hf:toast", { detail: { message: msg, type, ttl } }));
};

// μικρό helper για basename από path (fallback όταν δεν υπάρχει originalName)
const fileNameFromPath = (p) => (typeof p === "string" ? p.split("/").pop() : "");

export default function Hire({ jobAdId }) {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [steps, setSteps] = useState([]);
    const [interviewId, setInterviewId] = useState(null);

    const [candComment, setCandComment] = useState("");
    const [rightPane, setRightPane] = useState(null);

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
                    .filter((d) => ["approved", "accepted", "hired"].includes(String(d.status || "").toLowerCase()))
                    .map((d) => ({
                        id: d.candidateId ?? d.id,
                        name: `${d.firstName || ""} ${d.lastName || ""}`.trim(),
                        status: d.status,
                        avgScore: typeof d.avgScore === "number" && isFinite(d.avgScore) ? d.avgScore : null,
                    }));
                setCandidates(mapped);
            } catch {
                setCandidates([]);
                toast("Failed to load approved candidates", "error");
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
                toast("Failed to load steps", "error");
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
            toast("This candidate is already hired", "info");
            return;
        }
        setShowConfirm(true);
    };

    const doHire = async () => {
        if (!selectedCandidate) return;
        setConfirmLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/v1/candidates/${selectedCandidate.id}/hire`, { method: "POST" });
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
                prev.map((c) => (c.id === data.candidateId ? { ...c, status: data.candidateStatus } : c))
            );
            setSelectedCandidate((prev) =>
                prev && prev.id === data.candidateId ? { ...prev, status: data.candidateStatus } : prev
            );

            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: data.jobAdId ?? jobAdId, status: data.jobAdStatus ?? "Complete" },
                })
            );
            toast("Candidate hired", "success");
        } catch (e) {
            toast(e.message || "Hire failed", "error");
        } finally {
            setConfirmLoading(false);
            setShowConfirm(false);
        }
    };

    if (!jobAdId) return <p style={{ padding: "1rem" }}>Select a Job Ad to view its candidates.</p>;

    return (
        <div className="vh-shell hire-shell">
            {/* TOP ROW */}
            <Row className="g-3" style={{ flex: "1 1 auto", minHeight: 0 }}>
                {/* Approved candidates */}
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: "100%" }}>
                    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <label className="description-labels">Approved Candidates:</label>

                        <Card className="panel panel--flex" style={{ flex: "1 1 0%", minHeight: 0, display: "flex" }}>
                            <CardBody
                                style={{
                                    minHeight: 0,
                                    height: "100%",
                                    display: "grid",
                                    gridTemplateRows: "auto 1fr",
                                    gap: 8,
                                }}
                            >
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

                                <div className="clp-scroll">
                                    <CandidateDropdown
                                        candidates={candidates}
                                        selectedId={selectedCandidate?.id ?? null}
                                        renderLeft={(c) => (Number.isFinite(c.avgScore) ? c.avgScore : "—")}
                                        onSelect={async (cand) => {
                                            if (!cand) {
                                                setSelectedCandidate(null);
                                                setSelectedStep(null);
                                                setSelectedQuestion(null);
                                                setRightPane(null);
                                                setCandComment("");
                                                return;
                                            }
                                            try {
                                                const r = await fetch(`${API_BASE}/api/v1/candidates/${cand.id}`);
                                                const d = r.ok ? await r.json() : null;

                                                // === ΜΟΝΕΣ ουσιαστικές αλλαγές: κρατάμε cvPath + cvName (originalName ή basename) ===
                                                const enriched = {
                                                    ...cand,
                                                    email: d?.email ?? "",
                                                    cvPath: d?.cvPath ?? "",
                                                    cvName: d?.cvOriginalName ?? fileNameFromPath(d?.cvPath) ?? "",
                                                    interviewReportId:
                                                        d?.interviewReport?.id ?? d?.interviewReportId ?? cand?.interviewReportId ?? null,
                                                };

                                                setSelectedCandidate(enriched);
                                                setCandidates((prev) =>
                                                    prev.map((x) =>
                                                        x.id === cand.id
                                                            ? { ...x, email: enriched.email, cvPath: enriched.cvPath, cvName: enriched.cvName }
                                                            : x
                                                    )
                                                );
                                            } catch {
                                                setSelectedCandidate(cand);
                                            }
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
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: "100%" }}>
                    <label className="description-labels">Interview Steps:</label>
                    <Card className="panel panel--flex">
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
                <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: "100%" }}>
                    <label className="description-labels">Skills for this question:</label>
                    <Card className="panel panel--flex">
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

            {/* BOTTOM ROW */}
            <Row className="g-3 mt-8" style={{ flex: "0 0 auto" }}>
                <Col md="8">
                    <Card className="shadow-sm hire-comments-card">
                        <CardBody>
                            {!selectedCandidate ? (
                                <div className="muted">Select a candidate to see comments…</div>
                            ) : (
                                <Input type="textarea" rows={2} value={candComment} readOnly className="hire-readonly-input" />
                            )}
                        </CardBody>
                    </Card>
                </Col>

                <Col md="4" className="d-flex justify-content-center">
                    <Button
                        color="success"
                        onClick={openHireModal}
                        disabled={!selectedCandidate || String(selectedCandidate.status || "").toLowerCase() === "hired"}
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
        </div>
    );
}
