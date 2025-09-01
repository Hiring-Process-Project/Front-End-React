import React, { useState, useEffect } from "react";
import { Input, Button, Card, CardBody } from "reactstrap";

// Μικρό toast χωρίς libs
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
                position: "fixed",
                right: 16,
                bottom: 16,
                background: bg,
                color: "#fff",
                padding: "6px 8px",
                borderRadius: 8,
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                zIndex: 9999,
                fontWeight: 600,
                fontSize: 11,
            }}
            role="status"
            aria-live="polite"
        >
            {text}
        </div>
    );
}

const CandidateComments = ({
    selectedCandidate,
    candComment,
    setCandComment,
    isCommentLocked,
    saveCandidateComment,
    jobAdCompleteLocked = false,
}) => {
    const [commentStatus, setCommentStatus] = useState(null);
    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    // Προαιρετικό localStorage
    useEffect(() => {
        const savedComment = localStorage.getItem("savedComment");
        if (savedComment) {
            setCandComment(savedComment);
            setCommentStatus("Modified");
        }
    }, [setCandComment]);

    useEffect(() => {
        const savedComment = localStorage.getItem("savedComment");
        if (candComment !== savedComment) {
            setIsSaveDisabled(false);
            setCommentStatus("Modified");
        } else {
            setIsSaveDisabled(true);
            setCommentStatus("Saved");
        }
    }, [candComment]);

    const handleSaveComment = () => {
        saveCandidateComment();
        if (candComment) {
            localStorage.setItem("savedComment", candComment);
            if (commentStatus !== "Modified") {
                setCommentStatus("Saved");
                showToast("Saved", "success");
            } else {
                setCommentStatus("Modified");
                showToast("Modified", "info");
            }
            setIsSaveDisabled(true);
        }
    };

    return (
        <Card className="panel panel--short">
            <CardBody>
                {!selectedCandidate && (
                    <div style={{ opacity: 0.6 }}>Select a candidate to write comments…</div>
                )}

                {selectedCandidate && (
                    isCommentLocked ? (
                        <>
                            {/* 1) ΠΑΝΩ: τα σχόλια σε read-only */}
                            <div
                                style={{
                                    border: "1px solid #e5e7eb",
                                    background: "#F6F6F6",
                                    borderRadius: 12,
                                    padding: "10px 12px",
                                    fontSize: "11px",
                                }}
                            >
                                <div
                                    style={{
                                        minHeight: 50,
                                        whiteSpace: "pre-wrap",
                                        color: candComment?.trim() ? "#111827" : "#6B7280",
                                    }}
                                >
                                    {candComment?.trim() ? candComment : <span>No comments.</span>}
                                </div>
                            </div>

                            {/* 2) ΚΑΤΩ: το banner.
                    - Αν έχει κλείσει το job ad -> μήνυμα job-ad-complete
                    - Αλλιώς -> panel Candidate Status
               */}
                            {jobAdCompleteLocked ? (
                                <div
                                    style={{
                                        marginTop: 10,
                                        border: "1px solid #e5e7eb",
                                        background: "#F6F6F6",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        textAlign: "center",
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                                        fontSize: 11,
                                    }}
                                    role="note"
                                    aria-live="polite"
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                            color: "#334155",
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span style={{ fontSize: 13 }} aria-hidden>🔒</span>
                                        <span>Comments</span>
                                    </div>
                                    <div style={{ color: "#475569", lineHeight: 1.35 }}>
                                        The job ad is complete. Another candidate has been hired and
                                        comment editing is locked.
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        marginTop: 10,
                                        border: "1px solid #e5e7eb",
                                        background: "#F6F6F6",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        textAlign: "center",
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                                        fontSize: 11,
                                    }}
                                    role="note"
                                    aria-live="polite"
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                            color: "#334155",
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span style={{ fontSize: 13 }} aria-hidden>🔒</span>
                                        <span>Candidate Status</span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 12.5, color: "#111827" }}>
                                        {(selectedCandidate?.status || "").toUpperCase()}
                                    </div>
                                    <div style={{ marginTop: 4, color: "#475569", lineHeight: 1.35 }}>
                                        Comments are locked and cannot be edited.
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <Input
                                type="textarea"
                                rows={3}
                                placeholder="Write comments about the candidate..."
                                value={candComment}
                                onChange={(e) => setCandComment(e.target.value)}
                                style={{ resize: "vertical", fontSize: "11px" }}
                            />
                            <div className="d-flex justify-content-end" style={{ marginTop: 8 }}>
                                <Button
                                    style={{
                                        backgroundColor: "#4CAF50",
                                        color: "white",
                                        borderRadius: "12px",
                                        padding: "10px 20px",
                                        fontSize: "11px",
                                        textTransform: "none",
                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                        transition: "all 0.3s ease",
                                    }}
                                    onClick={handleSaveComment}
                                    disabled={isSaveDisabled}
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )
                )}
            </CardBody>

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </Card>
    );
};

export default CandidateComments;
