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

import "./description-card.css"; // ⬅️ import CSS classes

const baseUrl = "http://localhost:8087";

// spacing constants
const SKILLS_BOTTOM_GAP = 7; // κενό ανάμεσα στα skills και τα κουμπιά
const Y_GUTTER = 16;          // περίπου g-3 κάθετο gutter (Bootstrap)
const PANEL_INNER = 12;       // padding + border “σκελετός” κάθε panel (top+bottom)
const SAFETY_BUFFER = 20;     // extra για να μη “γλείφει” το κάτω μέρος

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

    const [toastMsg, setToastMsg] = useState("");
    const showToast = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 3000);
    }, []);

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
            `${baseUrl}/jobAds/${selectedJobAdId}/skills`,
            `${baseUrl}/jobAds/${selectedJobAdId}/required-skills`,
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
        } catch {
            setError("Update failed.");
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
        } catch {
            setError("Publish failed.");
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
        } catch {
            setError("Delete failed.");
        } finally {
            setDeleting(false);
        }
    };

    /* ================= Heights & refs ================= */
    const rightColRef = useRef(null);
    const buttonsRef = useRef(null);
    const leftPanelRef = useRef(null);
    const separatorRef = useRef(null);

    // safe default + measured flag
    const [skillsPanelHeight, setSkillsPanelHeight] = useState(360);
    const [measured, setMeasured] = useState(false);

    const recalcHeights = useCallback(() => {
        const col = rightColRef.current;
        const btn = buttonsRef.current;
        const leftWrap = leftPanelRef.current;
        const sep = separatorRef.current;
        if (!col || !btn) return;

        const colH = col.clientHeight;

        // buttons block height + margins
        const csBtn = getComputedStyle(btn);
        const btnH = btn.offsetHeight || 0;
        const btnMt = parseFloat(csBtn.marginTop || "0");
        const btnMb = parseFloat(csBtn.marginBottom || "0");
        const buttonsTotal = btnH + btnMt + btnMb;

        // separator height + margins
        let sepTotal = 0;
        if (sep) {
            const csSep = getComputedStyle(sep);
            const sepH = sep.offsetHeight || 0;
            const sepMt = parseFloat(csSep.marginTop || "0");
            const sepMb = parseFloat(csSep.marginBottom || "0");
            sepTotal = sepH + sepMt + sepMb;
        }

        // διαθέσιμο ύψος
        let available = Math.floor(
            colH - buttonsTotal - sepTotal - SKILLS_BOTTOM_GAP - SAFETY_BUFFER - Y_GUTTER
        );
        available = Math.max(140, available);

        // ευθυγράμμιση με αριστερό panel
        if (leftWrap) {
            const leftH = leftWrap.clientHeight;
            if (leftH > 0) available = Math.min(available, leftH);
        }

        // allowance για εσωτερικά paddings
        const perPanelAllowance = PANEL_INNER;
        const adjusted = available - perPanelAllowance;

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

    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => recalcHeights());
        if (rightColRef.current) ro.observe(rightColRef.current);
        if (buttonsRef.current) ro.observe(buttonsRef.current);
        if (leftPanelRef.current) ro.observe(leftPanelRef.current);
        return () => ro.disconnect();
    }, [recalcHeights]);

    // AI action
    const handleGetAIDescription = async () => {
        try {
            const url = `${baseUrl}/jobAds/${selectedJobAdId}/ai-description`;
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, requiredSkills }),
            });
            throw new Error("Not implemented");
        } catch {
            showToast("❌ Failed to fetch AI description!");
        }
    };

    if (!selectedJobAdId)
        return <p className="dc-pad">Select a Job Ad to view the Description.</p>;
    if (loading) return <p className="dc-pad">Loading…</p>;

    return (
        <>
            {toastMsg && <div className="dc-toast">{toastMsg}</div>}

            <Row className="g-3 dc-root-row">
                {/* Left */}
                <Col md="6" className="dc-left-col">
                    <div ref={leftPanelRef} className="dc-left-wrap">
                        <Description
                            name="Description"
                            description={description}
                            onDescriptionChange={setDescription}
                            readOnly={!canEdit}
                            disabled={!canEdit}
                        />
                        <div
                            onClick={handleGetAIDescription}
                            title="Get AI description"
                            className="dc-ai-link"
                        >
                            <span className="dc-ai-badge">AI</span>
                            <span>Get AI description</span>
                        </div>
                    </div>
                </Col>

                {/* Right */}
                <Col
                    md="6"
                    ref={rightColRef}
                    className={`dc-right-col ${measured ? "is-visible" : "is-hidden"}`}
                >
                    {/* Skills area */}
                    <div
                        className="dc-skills-wrap"
                        style={{ height: skillsPanelHeight, marginBottom: SKILLS_BOTTOM_GAP }}
                    >
                        <Row className="g-3 dc-skills-row">
                            <Col md="6" className="dc-col-flex">
                                <RecommendedSkillsPanel
                                    label="Recommended skills"
                                    panelHeight={skillsPanelHeight}
                                    baseUrl={baseUrl}
                                    jobAdId={selectedJobAdId}
                                    description={description}
                                    requiredSkills={requiredSkills}
                                />
                            </Col>
                            <Col md="6" className="dc-col-flex">
                                <SkillSelectorReadOnly
                                    label="Required skills"
                                    requiredskills={requiredSkills}
                                    panelHeight={skillsPanelHeight}
                                    searchPlaceholder="Search within required..."
                                />
                            </Col>
                        </Row>
                    </div>

                    {/* separator */}
                    <div ref={separatorRef} className="dc-separator" />

                    {/* Buttons */}
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

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmPublishOpen}
                title="Publish Job Ad"
                message={
                    <div>Do you want to publish this Job Ad? Your changes will be saved first.</div>
                }
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
