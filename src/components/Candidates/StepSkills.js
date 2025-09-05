import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Input } from "reactstrap";
import './Candidates.css';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8087";

/** Tiny toast using CSS classes */
function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const variantClass =
        type === "success"
            ? "tiny-toast tiny-toast--success"
            : type === "warning"
                ? "tiny-toast tiny-toast--warning"
                : type === "error"
                    ? "tiny-toast tiny-toast--error"
                    : "tiny-toast tiny-toast--info";

    return (
        <div className={variantClass} role="status" aria-live="polite">
            {text}
        </div>
    );
}

/* ---------- helper: color from score ---------- */
function scoreColor(value) {
    if (!Number.isFinite(value)) return "#a8a8a8ff"; // gray N/A
    if (value < 25) return "#dc2626"; // red
    if (value < 50) return "#f97316"; // orange
    if (value < 75) return "#eab308"; // yellow
    return "#16a34a"; // green
}

/* Color swatch (keeps tiny inline styles only for dynamic parts)
   shape: 'dot' | 'square' | 'bar' | 'vbar'
*/
function ColorSwatch({ value, shape = "dot", title }) {
    const bg = scoreColor(
        value === "" || value === null || typeof value === "undefined"
            ? NaN
            : Number(value)
    );

    const base = { display: "inline-block", background: bg };

    const style =
        shape === "bar"
            ? { ...base, width: 40, height: 8, borderRadius: 4 }
            : shape === "vbar"
                ? { ...base, width: 8, height: 30, borderRadius: 4 }
                : shape === "square"
                    ? {
                        ...base,
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                    }
                    : {
                        ...base,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: "1px solid rgba(0,0,0,0.08)",
                    };

    return <span aria-hidden title={title} style={style} />;
}

export default function StepSkills({ step, mode = "edit", onAfterSave }) {
    // Skills memoization
    const skills = useMemo(
        () => (Array.isArray(step?.skills) ? step.skills : []),
        [step?.skills]
    );
    const skillsMemoKey = useMemo(
        () => skills.map((s) => s.id).join("|"),
        [skills]
    );

    const candidateId = step?.context?.candidateId ?? null;
    const questionId = step?.context?.questionId ?? null;

    const readOnly = mode !== "edit";

    // rows: { [skillId]: { score, comment, dirty, exists } }
    const [rows, setRows] = useState({});
    const [loading, setLoading] = useState(false);

    // toast
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    /** GET from API – used also after Save */
    const fetchEvaluations = useCallback(async () => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        setLoading(true);
        try {
            const url = `${API_BASE}/api/v1/skill-scores/candidate/${candidateId}/question/${questionId}`;
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

            const next = {};
            for (const s of skills) {
                next[s.id] =
                    byId.get(s.id) ?? { score: "", comment: "", exists: false, dirty: false };
            }
            setRows(next);
        } catch {
            // keep current state on failure
        } finally {
            setLoading(false);
        }
    }, [candidateId, questionId, skills]);

    useEffect(() => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        fetchEvaluations();
    }, [candidateId, questionId, skillsMemoKey, fetchEvaluations]);

    // Local edits (not saved until Save pressed)
    const upsertLocal = (skillId, patch) => {
        setRows((prev) => {
            const cur = prev[skillId] || { score: "", comment: "", dirty: false, exists: false };
            const merged = { ...cur, ...patch, dirty: true };
            return { ...prev, [skillId]: merged };
        });
    };

    // clamp 0..100
    const handleChangeScore = (skillId, val) => {
        if (val === "" || val === null || typeof val === "undefined") {
            upsertLocal(skillId, { score: "" });
            return;
        }
        let num = Number(val);
        if (!Number.isFinite(num)) num = "";
        else {
            if (num > 100) num = 100;
            if (num < 0) num = 0;
        }
        upsertLocal(skillId, { score: num });
    };
    const handleChangeComment = (skillId, val) => upsertLocal(skillId, { comment: val });

    const hasSomethingToSave = useMemo(
        () => Object.values(rows).some((r) => r?.dirty),
        [rows]
    );

    // require each dirty row to have valid score 0..100
    const allDirtyValid = useMemo(() => {
        const dirty = Object.values(rows).filter((r) => r?.dirty);
        if (dirty.length === 0) return false;
        for (const r of dirty) {
            if (r.score === "" || r.score === null || typeof r.score === "undefined") {
                return false; // comment-only → no Save
            }
            const sc = Number(r.score);
            if (!Number.isFinite(sc) || sc < 0 || sc > 100) return false;
        }
        return true;
    }, [rows]);

    const handleSave = async () => {
        if (!candidateId || !questionId) return;
        if (!hasSomethingToSave || !allDirtyValid) return;

        setLoading(true);

        const dirtyEntries = Object.entries(rows).filter(([, v]) => v?.dirty === true);
        const toCreate = dirtyEntries.filter(([, v]) => !v.exists);
        const toUpdate = dirtyEntries.filter(([, v]) => v.exists);

        try {
            for (const [skillId, v] of dirtyEntries) {
                const payloadScore =
                    v.score === "" || v.score === null || typeof v.score === "undefined"
                        ? null
                        : Number(v.score);

                if (
                    payloadScore !== null &&
                    (!Number.isFinite(payloadScore) || payloadScore < 0 || payloadScore > 100)
                ) {
                    continue; // skip invalid
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
                    continue; // leave dirty on failure
                }
            }

            await fetchEvaluations();

            // Toast policy
            if (toCreate.length > 0 && toUpdate.length === 0) {
                showToast("Saved", "success");
            } else {
                showToast("Modified", "success");
            }
        } catch {
            showToast("Save failed", "error");
        } finally {
            setLoading(false);
        }
        try {
            onAfterSave?.({
                candidateId,
                questionId,
                stepId: step?.context?.stepId ?? null,
                totalSkills: skills.length,
            });
        } catch { }
    };

    // ====== Placeholder when no skills ======
    const showPlaceholder = skills.length === 0;
    const placeholderText = readOnly
        ? "Select a question to see skills evaluation…"
        : "Select a skill to make an evaluation…";

    if (showPlaceholder) {
        return (
            <div className="placeholder-wrap">
                {step?.name && <div className="description-labels">{step.name}</div>}

                <div className="box box--fullwidth box__content-min50">{placeholderText}</div>

                <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
            </div>
        );
    }

    // ====== Main UI ======
    return (
        <div className="step-skills">
            {step?.name && <div className="description-labels step-skills__title">{step.name}</div>}

            <div className="candidate-container mt-6">
                {skills.map((s) => {
                    const row =
                        rows[s.id] || { score: "", comment: "", dirty: false, exists: false };

                    // ===== VIEW =====
                    if (readOnly) {
                        return (
                            <div key={s.id} className="box box--fullwidth step-skills__card">
                                <div className="step-skills__item" style={{ fontWeight: 700 }}>{s.name}</div>

                                {/* Score line: value + colored vertical bar */}
                                <div className="ss-view-grid">
                                    <span className="text-muted" style={{ minWidth: 52 }}>Score:</span>
                                    <span className="ss-chip">
                                        {row.score === "" ? "—" : `${row.score}/100`}
                                    </span>
                                    <div className="vbar-center">
                                        <ColorSwatch value={row.score} shape="vbar" title="Score color" />
                                    </div>
                                </div>

                                <div className="text-muted mt-6">Comment:</div>
                                <div className="ss-comment">
                                    {row.comment?.trim() ? (
                                        row.comment
                                    ) : (
                                        <span className="text-muted">No comments.</span>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // ===== EDIT =====
                    return (
                        <div key={s.id} className="box box--fullwidth step-skills__card">
                            <div className="step-skills__item" style={{ fontWeight: 700 }}>{s.name}</div>

                            {/* Score input + colored vertical bar */}
                            <div className="ss-edit-grid">
                                <div>Score:</div>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={10}
                                    placeholder="0–100"
                                    disabled={loading}
                                    value={row.score}
                                    onChange={(e) => handleChangeScore(s.id, e.target.value)}
                                    className="input-sm"
                                    style={{ height: 32 }}
                                />
                                <div className="vbar-center">
                                    <ColorSwatch
                                        value={row.score === "" ? NaN : Number(row.score)}
                                        shape="vbar"
                                        title="score color"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">Comment:</div>
                            <Input
                                type="textarea"
                                rows={3}
                                disabled={loading}
                                value={row.comment}
                                onChange={(e) => handleChangeComment(s.id, e.target.value)}
                                placeholder="Write your comments..."
                                className="textarea-sm step-skills__comments"
                            />
                        </div>
                    );
                })}
            </div>

            {!readOnly && skills.length > 0 && (
                <div className="btn-row bottom-controls">
                    <Button
                        color="success"
                        onClick={handleSave}
                        disabled={!hasSomethingToSave || !allDirtyValid || loading}
                        className="btn-sm-fixed"
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            )}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}