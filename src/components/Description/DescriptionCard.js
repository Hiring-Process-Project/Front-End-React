import React, { useEffect, useMemo, useState } from "react";
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

export default function DescriptionCars({
    selectedJobAdId,
    allskills = [],
    reloadSidebar,
    onDeleted, // <-- FIXED
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

    useEffect(() => {
        if (!selectedJobAdId) return;

        setLoading(true);
        setError("");

        const detailsUrl = `${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`;

        // μόνο τα σωστά endpoints για να μη σκάει 404 στο console
        const skillUrlsInPriority = [
            `${baseUrl}/jobAds/${selectedJobAdId}/interview-skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`,
        ];

        (async () => {
            try {
                // --- DETAILS ---
                const r = await fetch(detailsUrl);
                if (!r.ok) throw new Error();
                const d = await r.json();
                setDescription(d?.description ?? "");
                setStatus(d?.status ?? null);

                // --- SKILLS ---
                let found = false;
                for (const url of skillUrlsInPriority) {
                    try {
                        const res = await fetch(url);
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
        })();
    }, [selectedJobAdId]);

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
        await handleUpdate();
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/publish`, {
                method: "POST",
            });
            if (!r.ok) throw new Error();
            setStatus("Published");
            await reloadSidebar?.();
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

            // καθάρισε άμεσα το local state για να αδειάσει το panel
            setDescription("");
            setRequiredSkills([]);
            setStatus(null);

            await reloadSidebar?.();
            onDeleted?.(); // ο parent θα κάνει setSelectedJobAdId(null)
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
                <Description name="Description" description={description} onDescriptionChange={setDescription} />
            </Col>

            <Col md="6">
                <Row>
                    <Col>
                        <SkillSelectorReadOnly requiredskills={requiredSkills} />
                    </Col>
                </Row>

                {canEdit && (
                    <Row>
                        <DescriptionButtons
                            onUpdate={handleUpdate}
                            onPublish={handlePublish}
                            onDelete={handleDelete}
                            saving={saving}
                        />
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
