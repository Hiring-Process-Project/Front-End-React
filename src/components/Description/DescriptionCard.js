import React, { useEffect, useMemo, useState } from "react";
import { Row, Col } from "reactstrap";
import Description from "./Description";
import DescriptionButtons from "./DescriptionButtons";
import SkillSelectorReadOnly from "./SkillSelectorReadOnly";

const baseUrl = "http://localhost:8087";

export default function DescriptionCars({
    selectedJobAdId,
    allskills = [],
    reloadSidebar,
    onDeleted,
}) {
    const [description, setDescription] = useState("");
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ΝΕΟ: status για να ελέγχουμε αν δείχνουμε κουμπιά
    const [status, setStatus] = useState("Pending");
    const isPending = (status || "").toLowerCase() === "pending";

    useEffect(() => {
        if (!selectedJobAdId) return;
        setLoading(true);
        setError("");

        Promise.all([
            fetch(`${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`)
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((d) => {
                    setStatus(String(d?.status ?? "Pending"));
                    return d?.description ?? "";
                }),
            fetch(`${baseUrl}/jobAds/jobAds/${selectedJobAdId}/interview-skills`)
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((list) => (Array.isArray(list) ? list.map((x) => x.name) : [])),
        ])
            .then(([desc, skills]) => {
                setDescription(desc || "");
                setRequiredSkills(skills || []);
            })
            .catch(() => setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων."))
            .finally(() => setLoading(false));
    }, [selectedJobAdId]);

    const canSave = useMemo(() => !!selectedJobAdId, [selectedJobAdId]);

    const handleUpdate = async () => {
        if (!canSave) return;
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
        // πρώτα σώσε τυχόν αλλαγές
        await handleUpdate();
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/publish`, {
                method: "POST",
            });
            if (!r.ok) throw new Error();
            // ΚΛΕΙΔΩΜΑ ΑΜΕΣΑ ΧΩΡΙΣ REFRESH
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
            await reloadSidebar?.();
            onDeleted?.();
        } catch {
            setError("Αποτυχία διαγραφής.");
        }
    };

    if (!selectedJobAdId) {
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις το Description.</p>;
    }

    if (loading) {
        return <p style={{ padding: "1rem" }}>Φόρτωση…</p>;
    }

    return (
        <Row className="g-3">
            <Col md="6">
                <Description
                    name="Description"
                    description={description}
                    onDescriptionChange={setDescription}
                />
            </Col>

            <Col md="6">
                <Row>
                    <Col>
                        <SkillSelectorReadOnly requiredskills={requiredSkills} />
                    </Col>
                </Row>

                {/* ΔΕΙΧΝΕ ΤΑ ΚΟΥΜΠΙΑ ΜΟΝΟ ΑΝ status === Pending */}
                {isPending && (
                    <Row>
                        <DescriptionButtons
                            onUpdate={handleUpdate}
                            onPublish={handlePublish}
                            onDelete={handleDelete}
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
