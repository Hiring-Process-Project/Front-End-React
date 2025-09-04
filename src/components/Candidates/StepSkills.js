import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Input } from "reactstrap";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8087";

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
                padding: "6px 8px",
                borderRadius: 8,
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)", zIndex: 9999,
                fontWeight: 600, fontSize: 11
            }}
            role="status" aria-live="polite"
        >
            {text}
        </div>
    );
}

const normScore = (v) =>
    (v === "" || v === null || typeof v === "undefined" ? "" : Number(v));
const normText = (s) => (s ?? "");
function valuesEqual(a, b) {
    return normScore(a.score) === normScore(b.score)
        && normText(a.comment) === normText(b.comment);
}

/* ---------- κοινά στυλ για ίδια εμφάνιση/πλάτος ---------- */
const BOX_BG = "#F6F6F6";
const fullWidthBox = {
    border: "1px solid #e5e7eb",
    background: BOX_BG,
    borderRadius: 12,
    padding: "10px 12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
    margin: "0 -10px 2px -10px",
    fontSize: 11,
};

export default function StepSkills({ step, mode = "edit", onAfterSave }) {
    const skills = Array.isArray(step?.skills) ? step.skills : [];
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

    /** GET από ΒΔ – χρησιμοποιείται και μετά από Save */
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
                next[s.id] = byId.get(s.id) ?? { score: "", comment: "", exists: false, dirty: false };
            }
            setRows(next);
        } catch {
            // σε αποτυχία δεν αδειάζουμε ό,τι φαίνεται
        } finally {
            setLoading(false);
        }
    }, [candidateId, questionId, skills]);

    // Κάθε φορά που αλλάζει candidate/question/skills → φόρτωσε ΜΟΝΟ ΒΔ
    useEffect(() => {
        if (!candidateId || !questionId) {
            setRows({});
            return;
        }
        fetchEvaluations();
    }, [candidateId, questionId, skills.map(s => s.id).join(","), fetchEvaluations]);

    // Επεξεργασία (τοπικά, χωρίς αποθήκευση μέχρι να πατηθεί Save)
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

    // === ΜΟΝΗ ΑΛΛΑΓΗ: απαιτούμε κάθε dirty row να έχει score 0..100 (όχι μόνο σχόλιο)
    const allDirtyValid = useMemo(() => {
        const dirty = Object.values(rows).filter((r) => r?.dirty);
        if (dirty.length === 0) return false;
        for (const r of dirty) {
            if (r.score === "" || r.score === null || typeof r.score === "undefined") {
                return false; // μόνο σχόλιο → όχι Save
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

        // Για το μήνυμα: τι είναι create vs update με βάση την πρότερη κατάσταση
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
                    // αν κάποιο αποτύχει, δεν αλλάζουμε οπτικά τίποτα – απλώς θα μείνει dirty
                    continue;
                }
            }

            // Μετά το save: κάνε re-fetch από ΒΔ και ΠΡΟΒΑΛΕ ΜΟΝΟ ΤΑ ΑΠΟΘΗΚΕΥΜΕΝΑ
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

    // ====== Placeholder όταν δεν υπάρχουν skills ======
    const showPlaceholder = skills.length === 0;
    const placeholderText = readOnly
        ? "Select a question to see skills evaluation…"
        : "Select a skill to make an evaluation…";

    if (showPlaceholder) {
        return (
            <div style={{ background: "#e5e7eb", borderRadius: 12, padding: 10 }}>
                {step?.name && (
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: "#374151" }}>
                        {step.name}
                    </div>
                )}

                <div style={fullWidthBox}>
                    {placeholderText}
                </div>

                <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
            </div>
        );
    }

    // ====== Κανονικό UI ======
    return (
        <div
            style={{
                background: "#e5e7eb",
                borderRadius: 12,
                padding: 10,
                fontSize: 11,
            }}
        >
            {step?.name && (
                <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: "#374151" }}>
                    {step.name}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {skills.map((s) => {
                    const row = rows[s.id] || { score: "", comment: "", dirty: false, exists: false };

                    // ===== VIEW =====
                    if (readOnly) {
                        return (
                            <div key={s.id} style={fullWidthBox}>
                                <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s.name}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                    <span style={{ opacity: 0.8, minWidth: 52 }}>Score:</span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            padding: "1px 6px",
                                            borderRadius: 6,
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
                                        padding: 8,
                                        minHeight: 38,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {row.comment?.trim() ? row.comment : <span style={{ opacity: 0.6 }}>No comments.</span>}
                                </div>
                            </div>
                        );
                    }

                    // ===== EDIT =====
                    return (
                        <div key={s.id} style={fullWidthBox}>
                            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>{s.name}</div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 110px",
                                    gap: 8,
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
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
                                    style={{ fontSize: 11, height: 32 }}
                                />
                            </div>

                            <div style={{ marginBottom: 6 }}>Comment:</div>
                            <Input
                                type="textarea"
                                rows={3}
                                disabled={loading}
                                value={row.comment}
                                onChange={(e) => handleChangeComment(s.id, e.target.value)}
                                placeholder="Write your comments..."
                                style={{ resize: "vertical", fontSize: 11 }}
                            />
                        </div>
                    );
                })}
            </div>

            {!readOnly && skills.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                    <Button
                        color="success"
                        onClick={handleSave}
                        disabled={!hasSomethingToSave || !allDirtyValid || loading}
                        style={{ minWidth: 108, height: 34, fontSize: 11 }}
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            )}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}
