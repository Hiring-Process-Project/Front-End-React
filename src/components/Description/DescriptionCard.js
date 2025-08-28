import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col } from "reactstrap";
import Description from "./Description";
import DescriptionButtons from "./DescriptionButtons";
import SkillSelectorReadOnly from "./SkillSelectorReadOnly";

const baseUrl = "http://localhost:8087";

// helpers
const normalizeStatus = (s) =>
    String(s ?? "")
        .replace(/\u00A0/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

export default function DescriptionCard({
    selectedJobAdId,
    allskills = [],
    reloadSidebar,
    onDeleted,
    onPublished, // <— ΝΕΟ callback προς parent
}) {
    const [description, setDescription] = useState("");
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [status, setStatus] = useState(null);

    const canEdit = useMemo(() => {
        const norm = normalizeStatus(status);
        return norm === "pending" || norm === "pedding" || norm === "draft";
    }, [status]);

    const statusLabel = status ?? "—";

    // 🔹 Φόρτωση details (description + status + skills)
    const fetchJobAdDetails = useCallback(async () => {
        if (!selectedJobAdId) return;

        setLoading(true);
        setError("");

        const detailsUrl = `${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`;
        const skillUrlsInPriority = [
            `${baseUrl}/jobAds/${selectedJobAdId}/interview-skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`,
        ];

        try {
            // --- DETAILS ---
            const r = await fetch(detailsUrl, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" },
            });
            if (!r.ok) throw new Error();
            const d = await r.json();
            setDescription(d?.description ?? "");
            setStatus(d?.status ?? null);

            // --- SKILLS ---
            let found = false;
            for (const url of skillUrlsInPriority) {
                try {
                    const res = await fetch(url, {
                        cache: "no-store",
                        headers: { "Cache-Control": "no-cache" },
                    });
                    if (!res.ok) continue;
                    const arr = await res.json();
                    if (Array.isArray(arr) && arr.length > 0) {
                        const titles = arr
                            .map((x) => (typeof x === "string" ? x : x?.title ?? x?.name ?? ""))
                            .filter(Boolean);
                        if (titles.length > 0) {
                            setRequiredSkills(titles);
                            found = true;
                            break;
                        }
                    }
                } catch {
                    /* try next */
                }
            }
            if (!found) setRequiredSkills([]);
        } catch {
            setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
        } finally {
            setLoading(false);
        }
    }, [selectedJobAdId]);

    useEffect(() => {
        fetchJobAdDetails();
    }, [selectedJobAdId, fetchJobAdDetails]);

    const handleUpdate = async () => {
        if (!selectedJobAdId) return;
        setSaving(true);
        setError("");
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/details`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    skills: requiredSkills,
                }),
            });
            if (!r.ok) throw new Error();

            await reloadSidebar?.();
        } catch {
            setError("Αποτυχία ενημέρωσης.");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        // προαιρετικά σώσε πρώτα τα τρέχοντα changes
        await handleUpdate();

        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/publish`, {
                method: "POST",
            });
            if (!r.ok) throw new Error();

            // mini refresh: ξαναφόρτωσε για να φανεί το νέο status
            await fetchJobAdDetails();

            // ενημέρωσε sidebar + γονιό
            await reloadSidebar?.();
            onPublished?.(); // <— ενημέρωσε parent

            // και στείλε και event για όποιο component το ακούει
            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: selectedJobAdId, status: "Published" },
                })
            );
        } catch {
            setError("Αποτυχία δημοσίευσης.");
        }
    };

    const handleDelete = async () => {
        if (!selectedJobAdId) return;
        const ok = window.confirm("Σίγουρα θέλεις να διαγράψεις αυτό το Job Ad;");
        if (!ok) return;
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}`, {
                method: "DELETE",
            });
            if (!r.ok) throw new Error();

            setDescription("");
            setRequiredSkills([]);
            setStatus(null);

            await reloadSidebar?.();
            onDeleted?.();
        } catch {
            setError("Αποτυχία διαγραφής.");
        }
    };

    // --- UI ---
    if (!selectedJobAdId)
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις το Description.</p>;
    if (loading) return <p style={{ padding: "1rem" }}>Φόρτωση…</p>;

    return (
        <Row className="g-3">
            <Col md="6">
                <Description
                    name="Description"
                    description={description}
                    onDescriptionChange={setDescription}
                    readOnly={!canEdit}
                    disabled={!canEdit}
                />
            </Col>

            <Col md="6">
                <Row>
                    <Col>
                        <SkillSelectorReadOnly requiredskills={requiredSkills} />
                    </Col>
                </Row>

                {canEdit ? (
                    <Row>
                        <DescriptionButtons
                            onUpdate={handleUpdate}
                            onPublish={handlePublish}
                            onDelete={handleDelete}
                            saving={saving}
                        />
                    </Row>
                ) : (
                    <Row className="mt-3">
                        <Col>
                            <div
                                style={{
                                    padding: "8px 8px",
                                    borderRadius: 12,
                                    background: "#E5E7EB",
                                    border: "1px solid #bbbbbb",
                                    color: "#374151",
                                    display: "flex",
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    gap: 8,
                                    minHeight: 60,
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                            >
                                <div>
                                    <span role="img" aria-label="lock">🔒</span>{" "}
                                    Το συγκεκριμένο Job Ad είναι σε κατάσταση
                                </div>

                                <div style={{ fontSize: 12, fontWeight: "bold", color: "#111827" }}>
                                    {statusLabel}
                                </div>

                                <div>και δεν μπορεί να επεξεργαστεί.</div>
                            </div>
                        </Col>
                    </Row>
                )}

                {error && (
                    <div className="mt-3 text-danger text-center" style={{ fontSize: 14 }}>
                        {error}
                    </div>
                )}
            </Col>
        </Row>
    );
}
