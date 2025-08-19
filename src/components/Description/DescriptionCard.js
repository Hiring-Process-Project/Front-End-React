import React, { useEffect, useMemo, useState } from "react";
import { Row, Col } from "reactstrap";
import Description from "./Description";
import DescriptionButtons from "./DescriptionButtons";
import SkillSelectorReadOnly from "./SkillSelectorReadOnly";

const baseUrl = "http://localhost:8087";

// μικρό helper: προσπαθεί διαδοχικά λίστα από URLs μέχρι να πάρει κανονικό JSON array
async function tryFetchArray(urls) {
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (Array.isArray(data)) return data;
        } catch {
            // δοκιμάζουμε το επόμενο
        }
    }
    return null; // καμία επιτυχία
}

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

    const [status, setStatus] = useState("Pending");
    const isPending = (status || "").toLowerCase() === "pending";

    useEffect(() => {
        if (!selectedJobAdId) return;

        setLoading(true);
        setError("");

        // 1) Details (description / status)
        const detailsUrl = `${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`;

        // 2) Πιθανοί δρόμοι για skills (δοκιμάζονται με αυτή τη σειρά)
        const skillUrls = [
            `${baseUrl}/jobAds/jobAds/${selectedJobAdId}/interview-skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`,
        ];

        (async () => {
            let detailsOk = false;

            // --- DETAILS ---
            try {
                const r = await fetch(detailsUrl);
                if (!r.ok) throw new Error();
                const d = await r.json();
                setStatus(String(d?.status ?? "Pending"));
                setDescription(d?.description ?? "");
                detailsOk = true;
            } catch {
                setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
            }

            // --- SKILLS ---
            const skillsArr = await tryFetchArray(skillUrls);
            if (skillsArr) {
                // δεχόμαστε title ή name ή σκέτο string
                const titles = skillsArr
                    .map((x) =>
                        typeof x === "string" ? x : x?.title ?? x?.name ?? ""
                    )
                    .filter(Boolean);
                setRequiredSkills(titles);
            } else {
                // αν απέτυχαν τα skills αλλά τα details ήρθαν, ΜΗ δείχνεις κόκκινο error·
                // απλώς άφησε τα skills κενά.
                if (!detailsOk) setError("Δεν ήταν δυνατή η φόρτωση των δεδομένων.");
            }

            setLoading(false);
        })();
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
                    // ο server μπορεί να περιμένει τίτλους/ονόματα — στέλνουμε array από strings
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
            setStatus("Published"); // κλείδωσε άμεσα
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
        return (
            <p style={{ padding: "1rem" }}>
                Επέλεξε ένα Job Ad για να δεις το Description.
            </p>
        );
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
