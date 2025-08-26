import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
import CandidateDropdown from "./CandidateDropDown";
import StepsDropDown from "./StepsDropDown";
import StepSkills from "./StepSkills";
import "./Candidates.css";

const API_BASE =
    process.env.REACT_APP_API_BASE || "http://localhost:8087";

export default function Candidates({ jobAdId }) {
    // selections
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // data
    const [candidates, setCandidates] = useState([]);
    const [steps, setSteps] = useState([]);
    const [interviewId, setInterviewId] = useState(null);

    // loading states
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [errCandidates, setErrCandidates] = useState(null);
    const [loadingSteps, setLoadingSteps] = useState(false);
    const [errSteps, setErrSteps] = useState(null);
    const [loadingAssess, setLoadingAssess] = useState(false);

    // reset on job change
    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
        setCandidates([]);
        setSteps([]);
        setInterviewId(null);
    }, [jobAdId]);

    /* 1) candidates */
    useEffect(() => {
        if (!jobAdId) {
            setCandidates([]);
            return;
        }
        const ac = new AbortController();
        setLoadingCandidates(true);
        setErrCandidates(null);

        (async () => {
            try {
                const url = `${API_BASE}/api/v1/candidates/jobad/${jobAdId}`;
                const res = await fetch(url, { signal: ac.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const mapped = (Array.isArray(data) ? data : []).map((c) => ({
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`.trim(),
                    email: c.email,
                    status: c.status,
                    cv: c.cvPath,
                }));
                setCandidates(mapped);
            } catch (e) {
                if (e.name !== "AbortError")
                    setErrCandidates(e.message || "Load error");
            } finally {
                setLoadingCandidates(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    /* 2) interview + steps + questions */
    useEffect(() => {
        if (!jobAdId) return;
        const ac = new AbortController();

        (async () => {
            try {
                setLoadingSteps(true);
                setErrSteps(null);

                const detailsRes = await fetch(
                    `${API_BASE}/jobAds/${jobAdId}/interview-details`,
                    { signal: ac.signal }
                );
                if (!detailsRes.ok) throw new Error("Failed to fetch interview-details");
                const d = await detailsRes.json();

                const iid = d?.id ?? null;
                setInterviewId(iid);

                const baseSteps = (Array.isArray(d?.steps) ? d.steps : [])
                    .map((s) => ({
                        id: s.id ?? s.stepId ?? null,
                        name: s.title ?? s.tittle ?? "",
                        questions: [],
                    }))
                    .filter((s) => s.id != null);

                const withQuestions = [];
                for (const st of baseSteps) {
                    try {
                        const qsRes = await fetch(
                            `${API_BASE}/api/v1/step/${st.id}/questions`,
                            { signal: ac.signal }
                        );
                        const qs = qsRes.ok ? await qsRes.json() : [];
                        const mappedQs = (Array.isArray(qs) ? qs : []).map((q) => ({
                            id: q.id,
                            question: q.name ?? q.title ?? "",
                        }));
                        withQuestions.push({ ...st, questions: mappedQs });
                    } catch {
                        withQuestions.push({ ...st, questions: [] });
                    }
                }

                setSteps(withQuestions);
            } catch (e) {
                if (e.name !== "AbortError") setErrSteps(e.message || "Load error");
            } finally {
                setLoadingSteps(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    /* 3) assessments per candidate */
    useEffect(() => {
        if (!interviewId || !selectedCandidate?.id) {
            setSteps((prev) => prev.map((s) => ({ ...s, __metrics: undefined })));
            return;
        }
        const ac = new AbortController();
        setLoadingAssess(true);

        (async () => {
            try {
                const url = `${API_BASE}/api/v1/assessment/interviews/${interviewId}/candidates/${selectedCandidate.id}/steps`;
                const r = await fetch(url, { signal: ac.signal });
                const data = r.ok ? await r.json() : [];

                const byId = new Map(
                    (Array.isArray(data) ? data : []).map((a) => [a.stepId, a])
                );
                setSteps((prev) =>
                    prev.map((s) => {
                        const a = byId.get(s.id);
                        return a
                            ? {
                                ...s,
                                __metrics: {
                                    totalQuestions: a.totalQuestions ?? 0,
                                    ratedQuestions: a.ratedQuestions ?? 0,
                                    averageScore: a.averageScore ?? null,
                                },
                            }
                            : { ...s, __metrics: undefined };
                    })
                );
            } catch {
                setSteps((prev) => prev.map((s) => ({ ...s, __metrics: undefined })));
            } finally {
                setLoadingAssess(false);
            }
        })();

        return () => ac.abort();
    }, [interviewId, selectedCandidate?.id]);

    /* 4) right pane: skills (κρατάμε και IDs) */
    const [rightPane, setRightPane] = useState(null);

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
                if (!r.ok) throw new Error();
                const d = await r.json();
                const skills = (Array.isArray(d?.skills) ? d.skills : [])
                    .map((s) => ({
                        id: s?.id,
                        name: s?.title || s?.name || "",
                    }))
                    .filter((s) => s.id && s.name);

                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills,
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                    },
                });
            } catch {
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills: [],
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                    },
                });
            }
        },
        [selectedCandidate?.id]
    );

    const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

    // === Κλείδωμα επεξεργασίας με βάση status ===
    const isLocked = !!selectedCandidate && ["APPROVED", "REJECTED"]
        .includes((selectedCandidate.status || "").toUpperCase());
    const canEdit = !!selectedCandidate && !isLocked;

    // === Update status στη βάση + refresh τοπικού state ===
    async function updateCandidateStatus(newStatus) {
        if (!selectedCandidate) return;
        try {
            const resp = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            if (!resp.ok) throw new Error("Failed to update status");
            // ανανέωση local state ώστε να κλειδώσει αμέσως το UI
            setSelectedCandidate((prev) => prev ? { ...prev, status: newStatus } : prev);
            // ανανέωση λίστας υποψηφίων
            setCandidates((prev) =>
                prev.map(c => c.id === selectedCandidate.id ? { ...c, status: newStatus } : c)
            );
            // “αγγίζουμε” τα steps
            setSteps((prev) => [...prev]);
        } catch (e) {
            console.error(e);
            alert("Αποτυχία ενημέρωσης status");
        }
    }

    // (προαιρετικό) καθάρισε drafts όταν κλειδώνει (χρησιμοποιούμε localStorage)
    useEffect(() => {
        if (!rightPane?.context || !isLocked) return;
        const { candidateId, questionId } = rightPane.context;
        try {
            const raw = localStorage.getItem("hf_skill_drafts");
            if (!raw) return;
            const all = JSON.parse(raw);
            const key = `cand:${candidateId}|q:${questionId}`;
            delete all[key];
            localStorage.setItem("hf_skill_drafts", JSON.stringify(all));
        } catch { }
    }, [isLocked, rightPane?.context]);

    return (
        <Row>
            {/* LEFT: candidates */}
            <Col md="4" className="d-flex flex-column align-items-stretch">
                <Card className="panel">
                    <CardBody>
                        <Row className="panel__header-row">
                            <Col md="4">
                                <label className="active-label">Candidate No:</label>
                            </Col>
                            <Col md="4">
                                <label className="active-label">Name:</label>
                            </Col>
                            <Col md="4">
                                <label className="active-label">Status:</label>
                            </Col>
                        </Row>

                        {!jobAdId ? (
                            <div style={{ opacity: 0.7 }}>
                                Select a job ad to view its candidates.
                            </div>
                        ) : loadingCandidates ? (
                            <div>Loading candidates…</div>
                        ) : errCandidates ? (
                            <div style={{ color: "crimson" }}>Error: {errCandidates}</div>
                        ) : (
                            <CandidateDropdown
                                candidates={candidates}
                                onSelect={(cand) => {
                                    setSelectedCandidate(cand);
                                    setSelectedStep(null);
                                    setSelectedQuestion(null);
                                    setRightPane(null);
                                }}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Approve / Reject */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                        marginTop: 16,
                    }}
                >
                    <Button
                        color="success"
                        style={{ minWidth: 120, height: 40 }}
                        disabled={!selectedCandidate || isLocked}
                        onClick={() => updateCandidateStatus("APPROVED")}
                    >
                        Approve
                    </Button>
                    <Button
                        color="danger"
                        style={{ minWidth: 120, height: 40 }}
                        disabled={!selectedCandidate || isLocked}
                        onClick={() => updateCandidateStatus("REJECTED")}
                    >
                        Reject
                    </Button>
                </div>
            </Col>

            {/* MIDDLE: steps */}
            <Col md="4">
                <label className="description-labels">Interview Steps:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {!jobAdId ? (
                            <div style={{ opacity: 0.6 }}>
                                Select a job ad to see its steps…
                            </div>
                        ) : loadingSteps ? (
                            <div>Loading steps…</div>
                        ) : errSteps ? (
                            <div style={{ color: "crimson" }}>Error: {errSteps}</div>
                        ) : selectedCandidate ? (
                            <StepsDropDown
                                steps={steps}
                                ratings={{}}
                                onSelect={handleSelectQ}
                                showScore={true}
                            />
                        ) : (
                            <div style={{ opacity: 0.6 }}>
                                Select a candidate to see steps…
                            </div>
                        )}
                        {loadingAssess && selectedCandidate && (
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                                Loading ratings…
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>

            {/* RIGHT: skills */}
            <Col md="4">
                <label className="description-labels">Skills for this question:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <>
                                <StepSkills step={rightPaneStepObj} mode={canEdit ? "edit" : "view"} />
                                {isLocked && (
                                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                                        Ο υποψήφιος είναι {String(selectedCandidate.status).toUpperCase()}. Οι βαθμολογίες έχουν κλειδώσει.
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ opacity: 0.6 }}>
                                Select a candidate to see skills…
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}
