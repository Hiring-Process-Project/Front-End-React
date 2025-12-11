import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useLayoutEffect,
    useRef,
} from "react";
import { Row, Col, Button } from "reactstrap";

import InterviewSteps from "./InterviewSteps";
import JobDescription from "../Description/Description";
import AddStepModal from "./AddStepModal";
import SkillSelectorReadOnly from "../Description/SkillSelectorReadOnly";
import ConfirmModal from "../Hire/ConfirmModal";

import "./interview.css";

const API = process.env.REACT_APP_BASE_URL;
const normalizeStatus = (s) =>
    String(s ?? "").replace(/\u00A0/g, " ").trim().toLowerCase().replace(/\s+/g, "");
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === "pending" || n === "pedding" || n === "draft";
};

// safe toast helper
const toast = (msg, type = "success", ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent("hf:toast", { detail: { message: msg, type, ttl } }));
};

export default function Interview({ selectedJobAdId }) {
    const [interviewId, setInterviewId] = useState(null);
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [stepSkills, setStepSkills] = useState([]);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showAddStep, setShowAddStep] = useState(false);

    const [status, setStatus] = useState(null);
    const canEdit = useMemo(() => isEditableStatus(status), [status]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* ====== ΥΠΟΛΟΓΙΣΜΟΣ ΥΨΟΥΣ ΓΙΑ ΤΟ SKILLS PANEL ====== */
    const rightDescWrapRef = useRef(null);
    const skillsColRef = useRef(null);
    const updateBtnRef = useRef(null);
    const [skillsPanelHeight, setSkillsPanelHeight] = useState(null);

    const recalcHeights = useCallback(() => {
        const col = skillsColRef.current;
        const btn = updateBtnRef.current;
        if (!col) return;

        const colH = col.clientHeight;

        let buttonsTotal = 0;
        if (btn) {
            const csBtn = getComputedStyle(btn);
            const btnH = btn.offsetHeight || 0;
            const btnMt = parseFloat(csBtn.marginTop || "0");
            const btnMb = parseFloat(csBtn.marginBottom || "0");
            buttonsTotal = btnH + btnMt + btnMb;
        }

        const SKILLS_HEADER_H = 28;
        const buffer = 8;

        let available = Math.max(140, colH - buttonsTotal - SKILLS_HEADER_H - buffer);

        if (rightDescWrapRef.current) {
            const leftH = rightDescWrapRef.current.clientHeight;
            if (leftH > 0) available = Math.min(available, leftH);
        }

        setSkillsPanelHeight(available);
    }, []);

    const kickRecalc = useCallback(() => {
        recalcHeights();
        requestAnimationFrame(() => recalcHeights());
        setTimeout(recalcHeights, 0);
        setTimeout(recalcHeights, 120);
        if (document?.fonts?.ready) document.fonts.ready.then(() => recalcHeights());
    }, [recalcHeights]);

    useLayoutEffect(() => { kickRecalc(); }, [kickRecalc]);
    useEffect(() => {
        let raf = 0;
        const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(kickRecalc); };
        window.addEventListener("resize", onResize);
        const t = setTimeout(kickRecalc, 0);
        return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); clearTimeout(t); };
    }, [kickRecalc, steps.length, selectedStepIndex]);

    /* ====== DATA ====== */
    useEffect(() => {
        if (!selectedJobAdId) return;

        setError(null);
        setInterviewId(null);
        setDescription("");
        setSteps([]);
        setStepSkills([]);
        setSelectedStepIndex(0);
        setStatus(null);

        fetch(`${API}/jobAds/${selectedJobAdId}/interview-details`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => {
                setInterviewId(d?.id ?? null);
                setDescription(d?.description ?? "");
            })
            .catch(() => setError("Failed to load interview details."));

        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    const fetchStepSkills = useCallback((stepId) => {
        if (stepId == null) { setStepSkills([]); return; }
        fetch(`${API}/api/v1/step/${stepId}/skills`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                const names = (data || []).map((x) => x.skillName).filter(Boolean);
                setStepSkills(names);
            })
            .catch(() => setStepSkills([]));
    }, []);

    const reloadSteps = useCallback(async () => {
        if (!interviewId) return;
        try {
            const r = await fetch(`${API}/api/v1/step/interviews/${interviewId}/steps`);
            if (!r.ok) throw new Error();
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
        } catch { /* ignore */ }
    }, [interviewId, selectedStepIndex, fetchStepSkills]);

    useEffect(() => { if (interviewId != null) reloadSteps(); }, [interviewId, reloadSteps]);

    const handleSelectStep = useCallback((index, stepIdFromChild) => {
        const idx = index ?? 0;
        setSelectedStepIndex(idx);
        const stepId = stepIdFromChild ?? steps[idx]?.id ?? null;
        if (stepId != null) fetchStepSkills(stepId);
        else setStepSkills([]);
    }, [steps, fetchStepSkills]);

    const getCurrentStepId = () => steps[selectedStepIndex]?.id ?? null;
    const getCurrentStepTitle = () => steps[selectedStepIndex]?.title || "";

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
        try {
            let ok = false;
            try {
                const r = await fetch(`${API}/interviews/${interviewId}/description`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description }),
                });
                if (r.ok) ok = true;
            } catch { /* ignore */ }
            if (!ok) {
                const r2 = await fetch(`${API}/interviews/${interviewId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description }),
                });
                if (!r2.ok) throw new Error();
            }
            toast("Interview updated", "success");
        } catch {
            toast("Update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = () => setConfirmOpen(true);

    const handleDeleteCurrentStepConfirmed = async () => {
        const stepId = getCurrentStepId();
        if (!stepId) { setConfirmOpen(false); return; }

        setDeleting(true);
        const prevSteps = steps;
        const currentIndex = selectedStepIndex;
        const nextSteps = prevSteps.filter((s) => s.id !== stepId);
        const newIndex = Math.max(0, Math.min(currentIndex, nextSteps.length - 1));

        setSteps(nextSteps);
        setSelectedStepIndex(newIndex);
        const nextSelectedId = nextSteps[newIndex]?.id ?? null;
        if (nextSelectedId != null) fetchStepSkills(nextSelectedId);
        else setStepSkills([]);

        try {
            const res = await fetch(`${API}/api/v1/step/${stepId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setConfirmOpen(false);
            toast("Step deleted", "success");
        } catch {
            setSteps(prevSteps);
            setSelectedStepIndex(currentIndex);
            const rollbackId = prevSteps[currentIndex]?.id ?? null;
            if (rollbackId != null) fetchStepSkills(rollbackId);
            else setStepSkills([]);
            setConfirmOpen(false);
            toast("Delete failed", "error");
        } finally {
            setDeleting(false);
        }
    };

    if (!selectedJobAdId) return <p style={{ padding: "1rem" }}>Select a Job Ad to view the Interview.</p>;
    if (error) return <p style={{ padding: "1rem", color: "red" }}>{error}</p>;

    const actionBtnStyle = { minWidth: 104, height: 34, padding: "4px 10px", fontSize: 13.5 };

    return (
        <>
            <Row className="g-3 iv-root-row">
                {/* LEFT: Steps */}
                <Col md="5" className="iv-col">
                    <label className="description-labels" style={{ paddingLeft: 10, marginBottom: 14 }}>
                        Interview Steps
                    </label>

                    <div className="boxStyle iv-card" style={{ overflow: "hidden" }}>
                        <InterviewSteps
                            interviewsteps={steps}
                            onSelect={handleSelectStep}
                            selectedIndex={selectedStepIndex}
                            interviewId={interviewId}
                            reloadSteps={async () => { await reloadSteps(); toast("Steps updated", "info"); }}
                            onLocalReorder={onLocalReorder}
                            canEdit={canEdit}
                            reserve={80}
                        />

                        {canEdit && (
                            <div className="boxFooter iv-footer" style={{ padding: "8px 10px", display: "flex", justifyContent: "center", gap: 15 }}>
                                <Button color="secondary" style={actionBtnStyle}
                                    onClick={() => setShowAddStep(true)}>
                                    Create New
                                </Button>
                                <Button color="danger" style={actionBtnStyle}
                                    onClick={openDeleteConfirm} disabled={!getCurrentStepId()}>
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                </Col>

                {/* RIGHT: Description + Skills */}
                <Col md="7" className="iv-col">
                    <Row className="g-3 iv-fill">
                        {/* Interview Description */}
                        <Col md="7" className="iv-col">
                            <div className="iv-right-fill" ref={rightDescWrapRef}>
                                <JobDescription
                                    name="Interview Description"
                                    description={description}
                                    onDescriptionChange={setDescription}
                                    readOnly={!canEdit}
                                    disabled={!canEdit}
                                />
                            </div>
                        </Col>

                        {/* Skills */}
                        <Col md="5" className="iv-col" ref={skillsColRef}>
                            <div style={{ flex: "0 0 auto", minHeight: 0, height: skillsPanelHeight ?? "auto" }}>
                                <SkillSelectorReadOnly
                                    label="Required Step Skills"
                                    requiredskills={stepSkills}
                                    panelHeight={skillsPanelHeight}
                                />
                            </div>

                            {canEdit && (
                                <div ref={updateBtnRef} className="d-flex justify-content-center" style={{ marginTop: 22 }}>
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
            </Row>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Step"
                message={
                    <div>
                        Are you sure you want to delete this step?
                        {getCurrentStepTitle() ? <> <b> “{getCurrentStepTitle()}”</b>;</> : <> this?</>}
                        <br />This action cannot be undone.
                    </div>
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteCurrentStepConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />

            <AddStepModal
                isOpen={showAddStep}
                toggle={() => setShowAddStep((v) => !v)}
                interviewId={interviewId}
                onCreated={async () => { await reloadSteps(); toast("Step created", "success"); }}
            />
        </>
    );
}
