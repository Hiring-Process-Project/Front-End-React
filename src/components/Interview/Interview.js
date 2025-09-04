import React, {
    useEffect, useMemo, useState, useCallback,
    useLayoutEffect, useRef
} from "react";
import { Row, Col, Button } from "reactstrap";

import InterviewSteps from "./InterviewSteps";
import JobDescription from "../Description/Description";
import AddStepModal from "./AddStepModal";
import SkillSelectorReadOnly from "../Description/SkillSelectorReadOnly";
import ConfirmModal from "../Hire/ConfirmModal";

import "./interview.css";

const API = "http://localhost:8087";
const normalizeStatus = (s) =>
    String(s ?? "").replace(/\u00A0/g, " ").trim().toLowerCase().replace(/\s+/g, "");
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === "pending" || n === "pedding" || n === "draft";
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

    /* ===== SCROLL refs & helpers ===== */
    const stepsScrollRef = useRef(null);
    const skillsScrollRef = useRef(null);
    const touchYRef = useRef(null);

    const RESERVE_LEFT = 80;   // χώρο για Create/Delete
    const RESERVE_RIGHT = 16;  // μικρό κενό

    const fitHeights = useCallback(() => {
        const fitOne = (el, reserve) => {
            if (!el) return;
            const top = el.getBoundingClientRect().top;
            const h = window.innerHeight - top - reserve;
            el.style.height = `${Math.max(180, h)}px`;
            el.style.overflowY = "auto";
            el.style.overflowX = "hidden";
        };
        fitOne(stepsScrollRef.current, RESERVE_LEFT);
        fitOne(skillsScrollRef.current, RESERVE_RIGHT);
    }, []);

    useLayoutEffect(() => {
        fitHeights();
        window.addEventListener("resize", fitHeights);
        return () => window.removeEventListener("resize", fitHeights);
    }, [fitHeights, steps.length, showAddStep, selectedStepIndex]);

    // Wheel handler: αν κύλησε ο εσωτερικός scroller, μπλόκαρε το default/bubbling
    const makeWheelHandler = (ref) => (e) => {
        const el = ref.current;
        if (!el) return;
        const before = el.scrollTop;
        el.scrollTop = before + e.deltaY;
        if (el.scrollTop !== before) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // Touch handlers (mobile/precision touchpads)
    const makeTouchStart = () => (e) => {
        touchYRef.current = e.touches?.[0]?.clientY ?? 0;
    };
    const makeTouchMove = (ref) => (e) => {
        const el = ref.current;
        if (!el) return;
        const y = e.touches?.[0]?.clientY ?? 0;
        const prev = el.scrollTop;
        el.scrollTop += (touchYRef.current ?? y) - y;
        touchYRef.current = y;
        if (el.scrollTop !== prev) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    /* ===== DATA ===== */
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
            .catch(() => setError("Δεν ήταν δυνατή η φόρτωση των στοιχείων interview."));

        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    const fetchStepSkills = useCallback((stepId) => {
        if (stepId == null) {
            setStepSkills([]);
            return;
        }
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
        } catch { }
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
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description })
                });
                if (r.ok) ok = true;
            } catch { }
            if (!ok) {
                const r2 = await fetch(`${API}/interviews/${interviewId}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description })
                });
                if (!r2.ok) throw new Error();
            }
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
        } catch {
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

    if (!selectedJobAdId) return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις το Interview.</p>;
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

                    {/* Το card δεν κάνει scroll. Το κάνει ΜΕΣΑ το InterviewSteps (όπως το sidebar). */}
                    <div className="boxStyle iv-card" style={{ overflow: "hidden" }}>
                        <InterviewSteps
                            interviewsteps={steps}
                            onSelect={handleSelectStep}
                            selectedIndex={selectedStepIndex}
                            interviewId={interviewId}
                            reloadSteps={reloadSteps}
                            onLocalReorder={onLocalReorder}
                            canEdit={canEdit}
                            reserve={80}   // ίδια ιδέα με το bottomReserve του sidebar
                        />

                        {canEdit && (
                            <div className="boxFooter iv-footer" style={{ padding: "8px 10px", display: "flex", justifyContent: "center", gap: 15 }}>
                                <Button color="secondary" style={{ minWidth: 104, height: 34, padding: "4px 10px", fontSize: 13.5 }}
                                    onClick={() => setShowAddStep(true)}>
                                    Create New
                                </Button>
                                <Button color="danger" style={{ minWidth: 104, height: 34, padding: "4px 10px", fontSize: 13.5 }}
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
                            <div
                                ref={skillsScrollRef}
                                className="iv-right-scroll"
                                onWheel={makeWheelHandler(skillsScrollRef)}
                                onTouchStart={makeTouchStart()}
                                onTouchMove={makeTouchMove(skillsScrollRef)}
                            >
                                <SkillSelectorReadOnly requiredskills={stepSkills} />
                            </div>

                            {canEdit && (
                                <div className="d-flex justify-content-center" style={{ marginTop: 22 }}>
                                    <Button color="secondary" className="delete-btn-req" onClick={handleUpdate} disabled={saving || !interviewId}>
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
                title="Διαγραφή Step"
                message={
                    <div>
                        Είσαι σίγουρος/η ότι θέλεις να διαγράψεις το step
                        {getCurrentStepTitle() ? <> <b> “{getCurrentStepTitle()}”</b>;</> : <> αυτό;</>}
                        <br />Η ενέργεια δεν είναι αναστρέψιμη.
                    </div>
                }
                confirmText="Διαγραφή"
                cancelText="Άκυρο"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteCurrentStepConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />

            <AddStepModal
                isOpen={showAddStep}
                toggle={() => setShowAddStep((v) => !v)}
                interviewId={interviewId}
                onCreated={reloadSteps}
            />
        </>
    );
}
