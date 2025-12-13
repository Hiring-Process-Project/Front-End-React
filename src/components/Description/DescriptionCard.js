import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
    useLayoutEffect,
} from "react";
import { Row, Col } from "reactstrap";
import Description from "./Description";
import DescriptionButtons from "./DescriptionButtons";
import SkillSelectorReadOnly from "./SkillSelectorReadOnly";
import ConfirmModal from "../Hire/ConfirmModal";
import RecommendedSkillsPanel from "./RecommendedSkillsPanel";
import "./description-card.css";

const baseUrl = process.env.REACT_APP_BASE_URL;

const SKILLS_BOTTOM_GAP = 7;
const Y_GUTTER = 16;
const PANEL_INNER = 12;
const SAFETY_BUFFER = 20;

const normalizeStatus = (s) =>
    String(s ?? "")
        .replace(/\u00A0/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

export default function DescriptionCard({
    selectedJobAdId,
    reloadSidebar,
    onDeleted,
    onPublished,
}) {
    const [description, setDescription] = useState("");
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState(null);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const canEdit = useMemo(() => {
        const n = normalizeStatus(status);
        return n === "pending" || n === "pedding" || n === "draft";
    }, [status]);

    const statusLabel = status ?? "—";

    const fetchJobAdDetails = useCallback(async () => {
        if (!selectedJobAdId) return;
        setLoading(true);
        setError("");

        const detailsUrl = `${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`;
        const skillUrlsInPriority = [
            `${baseUrl}/jobAds/${selectedJobAdId}/interview-skills`,
            // `${baseUrl}/jobAds/${selectedJobAdId}/skills`, //TODO failed request
            // `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`, //TODO failed request
        ];

        try {
            const r = await fetch(detailsUrl, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" },
            });
            if (!r.ok) throw new Error();
            const d = await r.json();
            setDescription(d?.description ?? "");
            setStatus(d?.status ?? null);

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
                } catch { }
            }
            if (!found) setRequiredSkills([]);
        } catch {
            setError("Failed to load data.");
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
                body: JSON.stringify({ description, skills: requiredSkills }),
            });
            if (!r.ok) throw new Error();
            await reloadSidebar?.();
            window.hfToast?.("Description updated", "success");
        } catch {
            setError("Update failed.");
            window.hfToast?.("Update failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const openPublishConfirm = () => setConfirmPublishOpen(true);

    const handlePublishConfirmed = async () => {
        if (!selectedJobAdId) return;
        setPublishing(true);
        setError("");
        try {
            await handleUpdate();
            const r = await fetch(`${baseUrl}/jobAds/${selectedJobAdId}/publish`, {
                method: "POST",
            });
            if (!r.ok) throw new Error();

            await fetchJobAdDetails();
            await reloadSidebar?.();
            onPublished?.();
            window.dispatchEvent(
                new CustomEvent("hf:jobad-updated", {
                    detail: { id: selectedJobAdId, status: "Published" },
                })
            );
            setConfirmPublishOpen(false);
            window.hfToast?.("Job Ad published", "success");
        } catch {
            setError("Publish failed.");
            window.hfToast?.("Publish failed", "error");
        } finally {
            setPublishing(false);
        }
    };

    const openDeleteConfirm = () => setConfirmDeleteOpen(true);

    const handleDeleteConfirmed = async () => {
        if (!selectedJobAdId) return;
        setDeleting(true);
        setError("");
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
            setConfirmDeleteOpen(false);
            window.hfToast?.("Job Ad deleted", "success");
        } catch {
            setError("Delete failed.");
            window.hfToast?.("Delete failed", "error");
        } finally {
            setDeleting(false);
        }
    };

    const rightColRef = useRef(null);
    const buttonsRef = useRef(null);
    const leftPanelRef = useRef(null);
    const separatorRef = useRef(null);

    const [skillsPanelHeight, setSkillsPanelHeight] = useState(360);
    const [measured, setMeasured] = useState(false);

    const recalcHeights = useCallback(() => {
        const col = rightColRef.current;
        const btn = buttonsRef.current;
        const leftWrap = leftPanelRef.current;
        const sep = separatorRef.current;
        if (!col || !btn) return;

        const colH = col.clientHeight;

        const csBtn = getComputedStyle(btn);
        const btnH = btn.offsetHeight || 0;
        const btnMt = parseFloat(csBtn.marginTop || "0");
        const btnMb = parseFloat(csBtn.marginBottom || "0");
        const buttonsTotal = btnH + btnMt + btnMb;

        let sepTotal = 0;
        if (sep) {
            const csSep = getComputedStyle(sep);
            const sepH = sep.offsetHeight || 0;
            const sepMt = parseFloat(csSep.marginTop || "0");
            const sepMb = parseFloat(csSep.marginBottom || "0");
            sepTotal = sepH + sepMt + sepMb;
        }

        let available = Math.floor(
            colH - buttonsTotal - sepTotal - SKILLS_BOTTOM_GAP - SAFETY_BUFFER - Y_GUTTER
        );
        available = Math.max(140, available);

        if (leftWrap) {
            const leftH = leftWrap.clientHeight;
            if (leftH > 0) available = Math.min(available, leftH);
        }

        const adjusted = available - PANEL_INNER;
        setSkillsPanelHeight(Math.max(120, adjusted));
    }, []);

    useLayoutEffect(() => {
        recalcHeights();
        setMeasured(true);

        let raf = 0;
        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(recalcHeights);
        };
        window.addEventListener("resize", onResize);
        const t = setTimeout(recalcHeights, 0);

        return () => {
            window.removeEventListener("resize", onResize);
            cancelAnimationFrame(raf);
            clearTimeout(t);
        };
    }, [recalcHeights, requiredSkills.length]);

    if (!selectedJobAdId)
        return <p className="dc-pad">Select a Job Ad to view the Description.</p>;
    if (loading) return <p className="dc-pad">Loading…</p>;

    return (
        <>
            <Row className="g-3 dc-root-row">
                <Col md="6" className="dc-left-col" ref={leftPanelRef}>
                    <Description
                        name="Description"
                        description={description}
                        onDescriptionChange={setDescription}
                        readOnly={!canEdit}
                        disabled={!canEdit}
                    />
                </Col>

                <Col
                    md="6"
                    ref={rightColRef}
                    className={`dc-right-col ${measured ? "is-visible" : "is-hidden"}`}
                >
                    <div
                        className="dc-skills-wrap"
                        style={{ height: skillsPanelHeight, marginBottom: SKILLS_BOTTOM_GAP }}
                    >
                        <Row className="g-3 dc-skills-row">
                            <Col md="6">
                                <RecommendedSkillsPanel
                                    label="Recommended skills"
                                    panelHeight={skillsPanelHeight}
                                    baseUrl={baseUrl}
                                    jobAdId={selectedJobAdId}
                                    description={description}
                                    requiredSkills={requiredSkills}
                                />
                            </Col>
                            <Col md="6">
                                <SkillSelectorReadOnly
                                    label="Required skills"
                                    requiredskills={requiredSkills}
                                    panelHeight={skillsPanelHeight}
                                    searchPlaceholder="Search within required..."
                                />
                            </Col>
                        </Row>
                    </div>

                    <div ref={separatorRef} className="dc-separator" />

                    <div ref={buttonsRef} className="dc-buttons">
                        {canEdit ? (
                            <DescriptionButtons
                                onUpdate={handleUpdate}
                                onPublish={openPublishConfirm}
                                onDelete={openDeleteConfirm}
                                saving={saving}
                            />
                        ) : (
                            <Row className="mt-1">
                                <Col>
                                    <div className="dc-status-box">
                                        <div>🔒 This Job Ad is currently in</div>
                                        <div className="dc-status-strong">{statusLabel}</div>
                                        <div>and cannot be edited.</div>
                                    </div>
                                </Col>
                            </Row>
                        )}
                        {error && <div className="dc-error">{error}</div>}
                    </div>
                </Col>
            </Row>

            <ConfirmModal
                isOpen={confirmPublishOpen}
                title="Publish Job Ad"
                message={<div>Do you want to publish this Job Ad? Your changes will be saved first.</div>}
                confirmText="Publish"
                cancelText="Cancel"
                confirmColor="primary"
                loading={publishing}
                onConfirm={handlePublishConfirmed}
                onCancel={() => setConfirmPublishOpen(false)}
            />
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Delete Job Ad"
                message={
                    <div>
                        Are you sure you want to delete this Job Ad?
                        <br />
                        This action cannot be undone.
                    </div>
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </>
    );
}
