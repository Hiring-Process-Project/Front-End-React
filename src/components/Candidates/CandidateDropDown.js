import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import { FaDownload } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8087';

/** Μικρό toast χωρίς libs */
function TinyToast({ show, text, type = "info", onHide }) {
    React.useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;
    const cls =
        type === "success" ? "tiny-toast tiny-toast--success" :
            type === "warning" ? "tiny-toast tiny-toast--warning" :
                type === "error" ? "tiny-toast tiny-toast--error" : "tiny-toast tiny-toast--info";

    return (
        <div className={cls} role="status" aria-live="polite">
            {text}
        </div>
    );
}

function CandidateDropdown({ candidates, onSelect, renderLeft }) {
    const [openIndex, setOpenIndex] = useState(null);

    const [toast, setToast] = useState({ show: false, text: "", type: "success" });
    const showToast = (text, type = "success") => setToast({ show: true, text, type });
    const hideToast = () => setToast(t => ({ ...t, show: false }));

    const handleToggle = (index, cand) => {
        const next = openIndex === index ? null : index;
        setOpenIndex(next);
        onSelect?.(next === null ? null : cand);
    };

    const handleDownload = (cand) => {
        if (!cand?.id) return;
        const fileUrl = `${API_BASE}/api/v1/candidates/${cand.id}/cv`;
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        showToast('CV download started!', 'success');
    };

    function getCvName(cvPath, fallback = "SampleCV.pdf") {
        if (!cvPath) return fallback;
        let s = String(cvPath);
        if (s.startsWith("classpath:")) s = s.slice("classpath:".length);
        const last = s.split(/[\\/]/).pop();
        return last || fallback;
    }

    return (
        <div className="candidate-container">
            {candidates.map((candidate, index) => (
                <div key={index}>
                    <Button
                        onClick={() => handleToggle(index, candidate)}
                        className={`candidate-btn ${openIndex === index ? 'active' : ''}`}
                        block
                    >
                        <div className="candidate-header">
                            <span className="candidate-index">
                                {renderLeft ? renderLeft(candidate, index) : (index + 1)}
                            </span>
                            <span className="candidate-name">{candidate.name}</span>
                            <span className={`candidate-status ${candidate.status?.toLowerCase?.() || 'unknown'}`}>
                                {candidate.status}
                            </span>
                        </div>
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div className="candidate-details">
                            <p><strong>Name:</strong> {candidate.name}</p>
                            <p><strong>Email:</strong> {candidate.email}</p>
                            <p>
                                <strong>CV:</strong>{' '}
                                <span style={{ marginRight: 8 }}>
                                    {getCvName(candidate.cv, "SampleCV.pdf")}
                                </span>
                                <Button
                                    color="link"
                                    style={{ padding: '0 5px' }}
                                    onClick={() => handleDownload(candidate)}
                                    title="Download CV"
                                >
                                    <FaDownload size={16} />
                                </Button>
                            </p>
                        </div>
                    </Collapse>
                </div>
            ))}

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </div>
    );
}

export default CandidateDropdown;
