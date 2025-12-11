import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Row, Col, Card, CardBody } from "reactstrap";
import CandidateListPanel from "./CandidateListPanel";
import StepsDropDown from "./StepsDropDown";
import StepSkills from "./StepSkills";
import "./Candidates.css";
import CandidateComments from "./CandidateComments";
import ConfirmModal from "../Hire/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_BASE;

/* Toast helper (global) */
const toast = (msg, type = "info", ttl = 2500) => {
    try { window.hfToast && window.hfToast(msg, type, ttl); } catch { }
};

/* ----------  Ενιαίο banner όταν ο υποψήφιος είναι κλειδωμένος ---------- */
function LockBanner({ status }) {
    const up = String(status || "").toUpperCase();
    return (
        <div className="lock-banner mt-6" role="note" aria-live="polite">
            <div className="lock-banner__title">
                <span style={{ fontSize: 13 }} aria-hidden>🔒</span>
                <span>Candidate Status</span>
            </div>
            <div className="lock-banner__status">{up || "LOCKED"}</div>
            <div className="lock-banner__desc">Scores are locked and cannot be edited.</div>
        </div>
    );
}

export default function Candidates({ jobAdId }) {
    // selections
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [, setSelectedStep] = useState(null);
    const [, setSelectedQuestion] = useState(null);

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

    // modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmType, setConfirmType] = useState(null); // 'APPROVED' | 'REJECTED'
    const [confirmLoading, setConfirmLoading] = useState(false);

    // comments
    const [candComment, setCandComment] = useState("");

    // ► Σταθερό ύψος περιοχής σχολίων (αν το χρειαστείς)
    const [commentsHeight, setCommentsHeight] = useState(null);
    const handleCommentsMeasure = useCallback((h) => {
        setCommentsHeight((prev) => (prev == null ? h : Math.max(prev, h)));
    }, []);

    // Μία φορά παγωμένο ύψος
    const [frozenCommentsHeight, setFrozenCommentsHeight] = useState(null);
    const handleCommentsMeasureOnce = useCallback((h) => {
        setFrozenCommentsHeight((prev) => prev ?? h);
    }, []);

    // status
    const statusUp = (selectedCandidate?.status || "").toUpperCase();
    const lockedByCandidate = ["APPROVED", "REJECTED", "HIRED"].includes(statusUp);
    const isLocked = !!selectedCandidate && lockedByCandidate;
    const canEdit = !!selectedCandidate && !isLocked;
    const isCommentLocked = isLocked;

    const [rightPane, setRightPane] = useState(null);

    // reset on job change
    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
        setCandidates([]);
        setSteps([]);
        setInterviewId(null);
        setCommentsHeight(null);
    }, [jobAdId]);

    useEffect(() => {
        if (!selectedCandidate) {
            setSelectedStep(null);
            setSelectedQuestion(null);
            setRightPane(null);                        // κλείνει τα skills
            setCandComment("");                        // καθαρίζει σχόλια
            setSteps(prev => prev.map(s => ({          // καθαρίζει metrics/ratings
                ...s,
                __metrics: undefined,
                questions: (s.questions || []).map(q => ({ ...q, __metrics: undefined }))
            })));
        }
    }, [selectedCandidate]);

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
                    cvName: c.cvOriginalName,
                    interviewReportId: c?.interviewReportId ?? null,
                }));
                setCandidates(mapped);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setErrCandidates(e.message || "Load error");
                    toast("Failed to load candidates", "error");
                }
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
                if (e.name !== "AbortError") {
                    setErrSteps(e.message || "Load error");
                    toast("Failed to load steps", "error");
                }
            } finally {
                setLoadingSteps(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    /* 2.5) reset metrics όταν αλλάζει υποψήφιος */
    useEffect(() => {
        setRightPane(null);
        setSteps(prev =>
            prev.map(s => ({
                ...s,
                __metrics: undefined,
                questions: (s.questions || []).map(q => ({ ...q, __metrics: undefined }))
            }))
        );
    }, [selectedCandidate?.id]);

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

    /* 4) right pane: skills */
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
                    .map((s) => ({ id: s?.id, name: s?.title || s?.name || "" }))
                    .filter((s) => s.id && s.name);

                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills,
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                        stepId: step?.id ?? null,
                    },
                });
            } catch {
                setRightPane({
                    name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
                    skills: [],
                    context: {
                        candidateId: selectedCandidate?.id ?? null,
                        questionId: q.id,
                        stepId: step?.id ?? null,
                    },
                });
            }
        },
        [selectedCandidate?.id]
    );

    // refresh metrics after save
    const refreshMetrics = useCallback(
        async ({ stepId, questionId, totalSkills }) => {
            if (!selectedCandidate?.id || !questionId) return;
            try {
                const r = await fetch(
                    `${API_BASE}/api/v1/skill-scores/candidate/${selectedCandidate.id}/question/${questionId}`
                );
                const arr = r.ok ? await r.json() : [];
                const scores = arr.map((x) => Number(x?.score)).filter((v) => Number.isFinite(v));
                const ratedSkills = scores.length;
                const avg = ratedSkills > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / ratedSkills) : null;

                setSteps((prev) =>
                    prev.map((s) => {
                        if (s.id !== stepId) return s;
                        const newQuestions = (s.questions || []).map((q) => {
                            if ((q.id ?? q.questionId) !== questionId) return q;
                            const total = Number.isFinite(totalSkills)
                                ? totalSkills
                                : Array.isArray(q.skills) ? q.skills.length : 0;
                            return { ...q, __metrics: { totalSkills: total, ratedSkills, averageScore: avg } };
                        });

                        let fullyRated = 0, sum = 0, cnt = 0;
                        for (const q of newQuestions) {
                            const m = q.__metrics;
                            const totalForQ = Number.isFinite(m?.totalSkills) ? m.totalSkills : Array.isArray(q?.skills) ? q.skills.length : 0;
                            const ratedForQ = Number.isFinite(m?.ratedSkills) ? m.ratedSkills : 0;
                            if (totalForQ > 0 && ratedForQ === totalForQ) fullyRated += 1;
                            if (Number.isFinite(m?.averageScore)) { sum += m.averageScore; cnt += 1; }
                        }
                        const localAvg = cnt ? Math.round(sum / cnt) : null;

                        return {
                            ...s,
                            questions: newQuestions,
                            __metrics: {
                                totalQuestions: newQuestions.length,
                                ratedQuestions: fullyRated,
                                averageScore: localAvg,
                            },
                        };
                    })
                );

                if (interviewId) {
                    const r2 = await fetch(
                        `${API_BASE}/api/v1/assessment/interviews/${interviewId}/candidates/${selectedCandidate.id}/steps`
                    );
                    if (r2.ok) {
                        const data = await r2.json();
                        const byId = new Map((Array.isArray(data) ? data : []).map((a) => [a.stepId, a]));
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
                                    : s;
                            })
                        );
                    }
                }
                toast("Scores saved", "success");
            } catch {
                toast("Failed to refresh metrics", "error");
            }
        },
        [selectedCandidate?.id, interviewId]
    );

    const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

    async function updateCandidateStatus(newStatus) {
        if (!selectedCandidate) return;
        try {
            const backendStatus =
                newStatus === "APPROVED" ? "Approved" :
                    newStatus === "REJECTED" ? "Rejected" : newStatus;

            const resp = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/status`,
                { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: backendStatus }) }
            );
            if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`Failed to update status. HTTP ${resp.status} ${txt}`.trim());
            }

            setSelectedCandidate((prev) => prev ? { ...prev, status: backendStatus } : prev);
            setCandidates((prev) => prev.map((c) => c.id === selectedCandidate.id ? { ...c, status: backendStatus } : c));
            setSteps((prev) => [...prev]);

            toast(`Candidate ${backendStatus}`, "success");
        } catch (e) {
            console.error(e);
            toast(e.message || "Status update failed", "error");
        }
    }

    const openConfirm = (type) => {
        if (!selectedCandidate) return;
        setConfirmType(type);
        setShowConfirm(true);
    };

    const onConfirm = async () => {
        if (!confirmType) return;
        setConfirmLoading(true);
        await updateCandidateStatus(confirmType);
        setConfirmLoading(false);
        setShowConfirm(false);
        setConfirmType(null);
    };

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

    async function saveCandidateComment() {
        if (!selectedCandidate) return;
        try {
            const resp = await fetch(
                `${API_BASE}/api/v1/candidates/${selectedCandidate.id}/comments`,
                { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comments: candComment }) }
            );
            if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`Failed to save comment. HTTP ${resp.status} ${txt}`.trim());
            }
            toast("Comment saved", "success");
        } catch (e) {
            console.error(e);
            toast(e.message || "Failed to save comment", "error");
        }
    }

    if (!jobAdId) return <p style={{ padding: "1rem" }}>Select a Job Ad to view its candidates.</p>;

    return (
        <div className="vh-shell">
            <Row style={{ flex: 1, display: "flex", minHeight: 0 }}>
                <CandidateListPanel
                    jobAdId={jobAdId}
                    loadingCandidates={loadingCandidates}
                    errCandidates={errCandidates}
                    candidates={candidates}
                    setSelectedCandidate={setSelectedCandidate}
                    openConfirm={openConfirm}
                    selectedCandidate={selectedCandidate}
                    isLocked={isLocked}
                    onCreated={(newCand) => {
                        const mapped = {
                            id: newCand.id,
                            name: `${newCand.firstName} ${newCand.lastName}`.trim(),
                            email: newCand.email,
                            status: newCand.status ?? "Pending",
                            cv: newCand.cvPath,
                            cvName: newCand.cvOriginalName,
                            interviewReportId: newCand?.interviewReport?.id ?? null,
                        };

                        // ενημέρωση λίστας χωρίς διπλά
                        setCandidates(prev => {
                            const exists = prev.some(c => c.id === mapped.id);
                            return exists ? prev.map(c => (c.id === mapped.id ? mapped : c)) : [...prev, mapped];
                        });

                        // ΔΕΝ αλλάζουμε selectedCandidate -> μένει ο παλιός με τις βαθμολογίες του
                        toast("Candidate added", "success");
                    }}
                />

                {/* RIGHT: Steps + Skills + Comments */}
                <Col md="8" className="d-flex flex-column" style={{ minHeight: "100%", height: "100%" }}>
                    <div style={{ flexGrow: 1, minHeight: 0 }}>
                        <Row style={{ height: "100%", minHeight: 0 }}>
                            {/* Steps */}
                            <Col md="6" className="d-flex flex-column" style={{ height: "100%", minHeight: 0 }}>
                                <label className="description-labels">Interview Steps:</label>
                                <Card className="panel panel--flex">
                                    <CardBody>
                                        {loadingSteps ? (
                                            <div>Loading steps…</div>
                                        ) : errSteps ? (
                                            <div style={{ color: "crimson" }}>Error: {errSteps}</div>
                                        ) : selectedCandidate ? (
                                            <StepsDropDown
                                                steps={steps}
                                                ratings={{}}
                                                onSelect={handleSelectQ}
                                                showScore={true}
                                                candidateId={selectedCandidate?.id}
                                                interviewReportId={selectedCandidate?.interviewReportId}
                                            />
                                        ) : (
                                            <div className="text-muted">Select a candidate to see steps…</div>
                                        )}
                                        {loadingAssess && selectedCandidate && (
                                            <div className="mt-8" style={{ fontSize: 11, opacity: 0.7 }}>Loading ratings…</div>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* Skills */}
                            <Col md="6" className="d-flex flex-column" style={{ height: "100%", minHeight: 0 }}>
                                <label className="description-labels">Skills for this question:</label>
                                <Card className="panel panel--flex">
                                    <CardBody>
                                        {selectedCandidate ? (
                                            <>
                                                <StepSkills
                                                    step={rightPaneStepObj}
                                                    mode={canEdit ? "edit" : "view"}
                                                    onAfterSave={({ stepId, questionId, totalSkills }) =>
                                                        refreshMetrics({
                                                            stepId,
                                                            questionId,
                                                            totalSkills: Number.isFinite(totalSkills)
                                                                ? totalSkills
                                                                : rightPaneStepObj?.skills?.length ?? 0,
                                                        })
                                                    }
                                                />
                                                {isLocked && <LockBanner status={selectedCandidate.status} />}
                                            </>
                                        ) : (
                                            <div className="text-muted">Select a candidate to see skills…</div>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* Comments */}
                    <Row className="mt-8">
                        <Col md="12">
                            <label className="description-labels">Comments about the candidate:</label>
                            <div
                                className="fixed-comments-container"
                                style={{
                                    height: frozenCommentsHeight ?? 0,
                                    overflow: "hidden",
                                    visibility: frozenCommentsHeight ? "visible" : "hidden",
                                }}
                            >
                                <CandidateComments
                                    selectedCandidate={selectedCandidate}
                                    candComment={candComment}
                                    setCandComment={setCandComment}
                                    isCommentLocked={isCommentLocked}
                                    saveCandidateComment={saveCandidateComment}
                                    onMeasureOnce={handleCommentsMeasureOnce}
                                    frozenHeight={frozenCommentsHeight}
                                />
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* Modal επιβεβαίωσης έξω από τα panels */}
            <ConfirmModal
                isOpen={showConfirm}
                title={confirmType === "REJECTED" ? "Confirm Reject" : "Confirm Approve"}
                message={
                    <>
                        Do you really want to <b>{confirmType === "REJECTED" ? "Reject" : "Approve"}</b>{" "}
                        <b>{selectedCandidate?.name}</b>? This will change the status to <b>{confirmType}</b>.
                    </>
                }
                confirmText="Confirm"
                cancelText="Cancel"
                confirmColor={confirmType === "REJECTED" ? "danger" : "success"}
                loading={confirmLoading}
                onConfirm={onConfirm}
                onCancel={() => { setShowConfirm(false); setConfirmType(null); }}
            />
        </div>
    );
}
