// Description/DescriptionCard.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Row, Col } from 'reactstrap';
import Description from './Description';
import DescriptionButtons from './DescriptionButtons';
import SkillSelectorReadOnly from './SkillSelectorReadOnly';
import ConfirmModal from '../Hire/ConfirmModal'; // προσαρμόσε path αν χρειάζεται

const baseUrl = 'http://localhost:8087';

const normalizeStatus = (s) =>
    String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase().replace(/\s+/g, '');

export default function DescriptionCard({
    selectedJobAdId,
    allskills = [],
    reloadSidebar,
    onDeleted,
    onPublished,
}) {
    const [description, setDescription] = useState('');
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState(null);

    // Confirm modals
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const canEdit = useMemo(() => {
        const norm = normalizeStatus(status);
        return norm === 'pending' || norm === 'pedding' || norm === 'draft';
    }, [status]);

    const statusLabel = status ?? '—';

    const fetchJobAdDetails = useCallback(async () => {
        if (!selectedJobAdId) return;
        setLoading(true);
        setError('');
        const detailsUrl = `${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`;
        const skillUrlsInPriority = [
            `${baseUrl}/jobAds/${selectedJobAdId}/interview-skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`,
        ];

        try {
            const r = await fetch(detailsUrl, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            if (!r.ok) throw new Error();
            const d = await r.json();
            setDescription(d?.description ?? '');
            setStatus(d?.status ?? null);

            let found = false;
            for (const url of skillUrlsInPriority) {
                try {
                    const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
                    if (!res.ok) continue;
                    const arr = await res.json();
                    if (Array.isArray(arr) && arr.length > 0) {
                        const titles = arr
                            .map((x) => (typeof x === 'string' ? x : x?.title ?? x?.name ?? ''))
                            .filter(Boolean);
                        if (titles.length > 0) {
                            setRequiredSkills(titles);
                            found = true;
                            break;
                        }
                    }
                } catch {
                    /* next */
                }
            }
            if (!found) setRequiredSkills([]);
        } catch {
            setError('Δεν ήταν δυνατή η φόρτωση των δεδομένων.');
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
        setError('');
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, skills: requiredSkills }),
            });
            if (!r.ok) throw new Error();
            await reloadSidebar?.();
        } catch {
            setError('Αποτυχία ενημέρωσης.');
        } finally {
            setSaving(false);
        }
    };

    // === Publish with confirm ===
    const openPublishConfirm = () => {
        setConfirmPublishOpen(true);
    };

    const handlePublishConfirmed = async () => {
        if (!selectedJobAdId) return;
        setPublishing(true);
        setError('');
        try {
            // σώζουμε πρώτα τυχόν αλλαγές
            await handleUpdate();

            // έπειτα publish
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/publish`, { method: 'POST' });
            if (!r.ok) throw new Error();

            await fetchJobAdDetails();
            await reloadSidebar?.();
            onPublished?.();
            window.dispatchEvent(
                new CustomEvent('hf:jobad-updated', { detail: { id: selectedJobAdId, status: 'Published' } })
            );
            setConfirmPublishOpen(false);
        } catch {
            setError('Αποτυχία δημοσίευσης.');
        } finally {
            setPublishing(false);
        }
    };

    // === Delete with confirm (όπως το είχες) ===
    const openDeleteConfirm = () => setConfirmDeleteOpen(true);

    const handleDeleteConfirmed = async () => {
        if (!selectedJobAdId) return;
        setDeleting(true);
        setError('');
        try {
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}`, { method: 'DELETE' });
            if (!r.ok) throw new Error();
            setDescription('');
            setRequiredSkills([]);
            setStatus(null);
            await reloadSidebar?.();
            onDeleted?.();
            setConfirmDeleteOpen(false);
        } catch {
            setError('Αποτυχία διαγραφής.');
        } finally {
            setDeleting(false);
        }
    };

    if (!selectedJobAdId) return <p style={{ padding: '1rem' }}>Επέλεξε ένα Job Ad για να δεις το Description.</p>;
    if (loading) return <p style={{ padding: '1rem' }}>Φόρτωση…</p>;

    return (
        <>
            <Row
                className="g-3"
                style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}
            >
                {/* Left: Description */}
                <Col md="6" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <Description
                            name="Description"
                            description={description}
                            onDescriptionChange={setDescription}
                            readOnly={!canEdit}
                            disabled={!canEdit}
                        />
                    </div>
                </Col>

                {/* Right: Skills + Buttons */}
                <Col md="6" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <SkillSelectorReadOnly requiredskills={requiredSkills} />
                    </div>

                    <div>
                        {canEdit ? (
                            <DescriptionButtons
                                onUpdate={handleUpdate}
                                onPublish={openPublishConfirm}   // <-- ανοίγουμε confirm ΜΟΝΟ για Publish
                                onDelete={openDeleteConfirm}
                                saving={saving}
                            />
                        ) : (
                            <Row className="mt-3">
                                <Col>
                                    <div
                                        style={{
                                            padding: '8px 8px',
                                            borderRadius: 12,
                                            background: '#E5E7EB',
                                            border: '1px solid #bbbbbb',
                                            color: '#374151',
                                            display: 'flex',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            gap: 8,
                                            minHeight: 60,
                                            fontSize: 12,
                                            fontWeight: 500,
                                        }}
                                    >
                                        <div>🔒 Το συγκεκριμένο Job Ad είναι σε κατάσταση</div>
                                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }}>{statusLabel}</div>
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
                    </div>
                </Col>
            </Row>

            {/* Confirm για Publish */}
            <ConfirmModal
                isOpen={confirmPublishOpen}
                title="Δημοσίευση Job Ad"
                message={
                    <div>
                        Θέλεις να δημοσιεύσεις αυτό το Job Ad; Θα αποθηκευτούν πρώτα οι αλλαγές σου.
                    </div>
                }
                confirmText="Publish"
                cancelText="Άκυρο"
                confirmColor="primary"
                loading={publishing}
                onConfirm={handlePublishConfirmed}
                onCancel={() => setConfirmPublishOpen(false)}
            />

            {/* Confirm για Delete (όπως πριν) */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Διαγραφή Job Ad"
                message={
                    <div>
                        Είσαι σίγουρος/η ότι θέλεις να διαγράψεις αυτό το Job Ad;
                        <br />
                        Η ενέργεια δεν είναι αναστρέψιμη.
                    </div>
                }
                confirmText="Διαγραφή"
                cancelText="Άκυρο"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </>
    );
}
