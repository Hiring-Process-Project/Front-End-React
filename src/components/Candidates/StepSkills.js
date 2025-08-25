import React, { useEffect, useMemo, useState } from "react";
import { Button, Input } from "reactstrap";

const API_BASE =
    (import.meta?.env?.VITE_API_BASE) ||
    process.env.REACT_APP_API_BASE ||
    "http://localhost:8087";

/** Μικρό toast χωρίς libs */
function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const bg =
        type === "success" ? "#16a34a" :
            type === "warning" ? "#f59e0b" :
                type === "error" ? "#dc2626" : "#334155";

    return (
        <div
            style={{
                position: "fixed", right: 16, bottom: 16,
                background: bg, color: "#fff",
                padding: "10px 14px", borderRadius: 10,
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)", zIndex: 9999,
                fontWeight: 600
            }}
            role="status" aria-live="polite"
        >
            {text}
        </div>
    );
}

/* ===== drafts σε localStorage για μονιμότητα (χρησιμοποιούνται ΜΟΝΟ σε edit mode) ===== */
const DRAFT_NS = "hf_skill_drafts";

function makePairKey(candidateId, questionId) {
    return `cand:${candidateId}|q:${questionId}`;
}
function readDrafts(candidateId, questionId) {
    try {
        const raw = localStorage.getItem(DRAFT_NS);
        if (!raw) return {};
        const all = JSON.parse(raw);
        return all[makePairKey(candidateId, questionId)] || {};
    } catch { return {}; }
}
function writeDrafts(candidateId, questionId, draftsObj) {
    try {
        const raw = localStorage.getItem(DRAFT_NS);
        const all = raw ? JSON.parse(raw) : {};
        all[makePairKey(candidateId, questionId)] = draftsObj;
        localStorage.setItem(DRAFT_NS, JSON.stringify(all));
    } catch { }
}

const normScore = (v) => (v === "" || v === null || typeof v === "undefined" ? "" : Number(v));
const normText = (s) => (s ?? "");
function valuesEqual(a, b) {
    return normScore(a.score) === normScore(b.score)
        && normText(a.comment) === normText(b.comment);
}

/**
 * Props:
 *  - step: { name, skills: [{id, name}], context?: { candidateId, questionId } }
 *  - mode: "edit" | "view"  (default: "edit")
 */
export default function StepSkills({ step, mode = "edit" }) {
    const skills = Array.isArray(step?.skills) ? step.skills : [];
    const candidateId = step?.context?.candidateId ?? null;
    const questionId = step?.context?.questionId ?? null;

    const readOnly = mode !== "edit";
    const useDrafts = !readOnly; // ΣΤΟ HIRE (view) δεν χρησιμοποιούμε drafts

    // { [skillId]: { score, comment, dirty, exists } }
    const [rows, setRows] = useState({});
    const [loading, setLoading] = useState(false);

    // toast
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    // Φόρτωση από backend + (αν είμαστε σε edit) overlay drafts από localStorage
    useEffect(() => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        let ignore = false;
        (async () => {
            try {
                setLoading(true);

                // 1) από backend
                const url = `${API_BASE}/api/v1/candidates/${candidateId}/questions/${questionId}/evaluations`;
                const r = await fetch(url);
                const data = r.ok ? await r.json() : [];
                const byId = new Map(
                    (Array.isArray(data) ? data : []).map((e) => [
                        e.skillId,
                        {
                            score: Number.isFinite(e.score) ? e.score : "",
                            comment: e.comment || "",
                            exists: true,
                            dirty: false,
                        },
                    ])
                );

                let next = {};
                if (useDrafts) {
                    // 2) overlay με drafts (edit mode)
                    const drafts = readDrafts(candidateId, questionId);
                    for (const s of skills) {
                        const base = byId.get(s.id) ?? { score: "", comment: "", exists: false, dirty: false };
                        const draft = drafts[String(s.id)];
                        if (draft) {
                            const merged = { ...base, ...draft };
                            next[s.id] = { ...merged, dirty: !valuesEqual(merged, base) };
                        } else {
                            next[s.id] = base;
                        }
                    }
                } else {
                    // view mode: δείξε ΜΟΝΟ τα της βάσης
                    for (const s of skills) {
                        next[s.id] = byId.get(s.id) ?? { score: "", comment: "", exists: false, dirty: false };
                    }
                }

                if (!ignore) setRows(next);
            } catch {
                if (!ignore) setRows({});
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateId, questionId, skills.map((s) => s.id).join(","), useDrafts]);

    // === Edit mode: ενημέρωση drafts ===
    const upsertDraft = (skillId, patch) => {
        setRows((prev) => {
            const cur = prev[skillId] || { score: "", comment: "", dirty: false, exists: false };
            const merged = { ...cur, ...patch, dirty: true };
            const drafts = readDrafts(candidateId, questionId);
            drafts[String(skillId)] = { score: merged.score, comment: merged.comment };
            writeDrafts(candidateId, questionId, drafts);
            return { ...prev, [skillId]: merged };
        });
    };
    const handleChangeScore = (skillId, val) => upsertDraft(skillId, { score: val === "" ? "" : Number(val) });
    const handleChangeComment = (skillId, val) => upsertDraft(skillId, { comment: val });

    const hasSomethingToSave = useMemo(() => Object.values(rows).some((r) => r?.dirty), [rows]);

    const allDirtyValid = useMemo(() => {
        const dirty = Object.values(rows).filter((r) => r?.dirty);
        if (dirty.length === 0) return false;
        for (const r of dirty) {
            if (r.score === "" || r.score === null || typeof r.score === "undefined") continue;
            const sc = Number(r.score);
            if (!Number.isFinite(sc) || sc < 0 || sc > 100) return false;
        }
        return true;
    }, [rows]);

    const handleSave = async () => {
        if (!candidateId || !questionId) return;
        if (!hasSomethingToSave || !allDirtyValid) return;

        setLoading(true);
        let anyCreated = false;
        let anyUpdated = false;
        let anyError = false;

        try {
            const entries = Object.entries(rows).filter(([, v]) => v?.dirty === true);

            for (const [skillId, v] of entries) {
                const payloadScore =
                    v.score === "" || v.score === null || typeof v.score === "undefined"
                        ? null
                        : Number(v.score);
                if (
                    payloadScore !== null &&
                    (!Number.isFinite(payloadScore) || payloadScore < 0 || payloadScore > 100)
                ) {
                    anyError = true;
                    continue;
                }

                const body = {
                    candidateId,
                    questionId,
                    skillId: Number(skillId),
                    score: payloadScore,
                    comment: v.comment ?? "",
                };

                const resp = await fetch(`${API_BASE}/api/v1/skill-scores`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!resp.ok) {
                    anyError = true;
                    continue;
                }

                if (!v.exists) anyCreated = true;
                else anyUpdated = true;
            }

            // Μετά το save: κρατάμε τις τιμές, μη‑dirty, και τις περνάμε στα drafts (edit mode)
            setRows((prev) => {
                const next = {};
                if (useDrafts) {
                    const drafts = readDrafts(candidateId, questionId);
                    for (const [k, v] of Object.entries(prev)) {
                        if (!v) continue;
                        const clean = { ...v, dirty: false, exists: true };
                        next[k] = clean;
                        drafts[String(k)] = { score: clean.score, comment: clean.comment };
                    }
                    writeDrafts(candidateId, questionId, drafts);
                } else {
                    for (const [k, v] of Object.entries(prev)) {
                        if (!v) continue;
                        next[k] = { ...v, dirty: false, exists: true };
                    }
                }
                return next;
            });

            if (anyError) showToast("Some items failed to save", "error");
            else if (anyUpdated && anyCreated) showToast("Saved & modified", "success");
            else if (anyUpdated) showToast("Modified", "success");
            else if (anyCreated) showToast("Saved", "success");
        } catch {
            showToast("Save failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: "#e5e7eb", borderRadius: 12, padding: 12, minHeight: 220 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#374151" }}>
                {step?.name || "—"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {skills.map((s) => {
                    const row = rows[s.id] || { score: "", comment: "", dirty: false, exists: false };

                    // ===== VIEW (HIRE): καθαρή ανάγνωση χωρίς inputs =====
                    if (readOnly) {
                        return (
                            <div
                                key={s.id}
                                style={{
                                    background: "#f3f4f6",
                                    borderRadius: 10,
                                    padding: 12,
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <div style={{ fontWeight: 800, marginBottom: 8 }}>{s.name}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ opacity: 0.8, minWidth: 60 }}>Score:</span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: 8,
                                            background: "#e5e7eb",
                                            border: "1px solid #d1d5db",
                                        }}
                                    >
                                        {row.score === "" ? "—" : `${row.score}/100`}
                                    </span>
                                </div>
                                <div style={{ opacity: 0.8, marginBottom: 4 }}>Comment:</div>
                                <div
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 8,
                                        padding: 10,
                                        minHeight: 44,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {row.comment?.trim() ? row.comment : <span style={{ opacity: 0.6 }}>No comments.</span>}
                                </div>
                            </div>
                        );
                    }

                    // ===== EDIT (Candidates): inputs =====
                    return (
                        <div
                            key={s.id}
                            style={{
                                background: "#f3f4f6",
                                borderRadius: 10,
                                padding: 12,
                                border: "1px solid #e5e7eb",
                            }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.name}</div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 120px",
                                    gap: 10,
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <div>Score:</div>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="0–100"
                                    disabled={loading}
                                    value={row.score}
                                    onChange={(e) => handleChangeScore(s.id, e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: 8 }}>Comment:</div>
                            <Input
                                type="textarea"
                                rows={3}
                                disabled={loading}
                                value={row.comment}
                                onChange={(e) => handleChangeComment(s.id, e.target.value)}
                                placeholder="Write your comments..."
                                style={{ resize: "vertical" }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Save μόνο σε edit mode */}
            {!readOnly && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                    <Button
                        color="success"
                        onClick={handleSave}
                        disabled={!hasSomethingToSave || !allDirtyValid || loading}
                        style={{ minWidth: 120, height: 40 }}
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            )}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}
