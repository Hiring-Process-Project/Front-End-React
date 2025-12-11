import React, { useState } from "react";
import { Collapse, Button } from "reactstrap";
import { FaDownload } from "react-icons/fa";

const API_BASE = process.env.REACT_APP_API_BASE;

/** Μικρό toast χωρίς libs */
function TinyToast({ show, text, type = "info", onHide }) {
    React.useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const cls =
        type === "success"
            ? "tiny-toast tiny-toast--success"
            : type === "warning"
                ? "tiny-toast tiny-toast--warning"
                : type === "error"
                    ? "tiny-toast tiny-toast--error"
                    : "tiny-toast tiny-toast--info";

    return (
        <div className={cls} role="status" aria-live="polite">
            {text}
        </div>
    );
}

/**
 * Props:
 * - candidates: [{ id, name, email, status, cv }, ...]
 * - onSelect:  (candidate|null) => void
 * - renderLeft?: (candidate, index) => ReactNode
 * - selectedId?: number | null   <-- όταν ΔΟΘΕΙ, το component είναι controlled
 */
function CandidateDropdown({
    candidates = [],
    onSelect,
    renderLeft,
    selectedId, // <<-- ΔΕΝ έχει default πλέον
}) {
    // Uncontrolled fallback: κρατάμε index μόνο αν ΔΕΝ μας δίνουν selectedId
    const [openIndex, setOpenIndex] = useState(null);

    // <<-- ΕΛΑΧΙΣΤΗ αλλαγή: θεωρούμε controlled αν το prop υπάρχει, ακόμα κι αν είναι null
    const isControlled = selectedId !== undefined;

    const [toast, setToast] = useState({ show: false, text: "", type: "success" });
    const showToast = (text, type = "success") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    const handleToggle = (index, cand) => {
        if (isControlled) {
            const nextId = cand?.id ?? null;
            onSelect?.(selectedId === nextId ? null : cand);
            return;
        }
        const next = openIndex === index ? null : index;
        setOpenIndex(next);
        onSelect?.(next === null ? null : cand);
    };

    const handleDownload = (cand) => {
        if (!cand?.id) return;
        const fileUrl = `${API_BASE}/api/v1/candidates/${cand.id}/cv`;
        window.open(fileUrl, "_blank", "noopener,noreferrer");
        showToast("CV download started!", "success");
    };

    function getCvName(cvPath, fallback = "SampleCV.pdf") {
        if (!cvPath) return fallback;
        let s = String(cvPath);
        if (s.startsWith("classpath:")) s = s.slice("classpath:".length);
        const last = s.split(/[\\/]/).pop();
        return last || fallback;
    }

    // <<-- ΕΛΑΧΙΣΤΗ αλλαγή: όταν είναι controlled, το openId προκύπτει μόνο από selectedId (ακόμα κι αν είναι null)
    const openId = isControlled
        ? selectedId
        : openIndex !== null
            ? candidates[openIndex]?.id ?? null
            : null;

    if (!candidates.length) {
        return (
            <div className="candidate-container">
                <div className="text-muted" style={{ padding: 8 }}>
                    No candidates yet.
                </div>
                <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
            </div>
        );
    }

    return (
        <div className="candidate-container">
            {candidates.map((candidate, index) => {
                const isOpen = openId === candidate.id;
                return (
                    <div key={candidate.id ?? index}>
                        <Button
                            onClick={() => handleToggle(index, candidate)}
                            className={`candidate-btn ${isOpen ? "active" : ""} w-100`}
                        >
                            <div className="candidate-header">
                                <span className="candidate-index">
                                    {renderLeft ? renderLeft(candidate, index) : index + 1}
                                </span>
                                <span className="candidate-name">{candidate.name}</span>
                                <span className={`candidate-status ${candidate.status?.toLowerCase?.() || "unknown"}`}>
                                    {candidate.status}
                                </span>
                            </div>
                        </Button>

                        <Collapse isOpen={isOpen}>
                            <div className="candidate-details">
                                <p>
                                    <strong>Name:</strong> {candidate.name}
                                </p>
                                <p>
                                    <strong>Email:</strong> {candidate.email}
                                </p>
                                <p>
                                    <strong>CV:</strong>{" "}
                                    <span style={{ marginRight: 8 }}>
                                        {candidate.cvName || getCvName(candidate.cv, "SampleCV.pdf")}
                                    </span>
                                    <Button
                                        color="link"
                                        style={{ padding: "0 5px" }}
                                        onClick={() => handleDownload(candidate)}
                                        title="Download CV"
                                    >
                                        <FaDownload size={16} />
                                    </Button>
                                </p>
                            </div>
                        </Collapse>
                    </div>
                );
            })}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}

export default CandidateDropdown;
