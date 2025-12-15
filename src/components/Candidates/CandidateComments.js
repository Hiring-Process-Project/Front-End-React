import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Input, Button, Card, CardBody } from "reactstrap";

// Toast notification
function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(onHide, 2000);
        return () => clearTimeout(t);
    }, [show, onHide]);

    if (!show) return null;

    // Pick CSS class based on toast type
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

const CandidateComments = ({
    selectedCandidate,
    candComment,
    setCandComment,
    isCommentLocked,
    saveCandidateComment,
    onMeasureOnce,
    frozenHeight,
}) => {

    const [toast, setToast] = useState({ show: false, text: "", type: "info" });
    const [originalComment, setOriginalComment] = useState("");
    const [originalForCandidateId, setOriginalForCandidateId] = useState(null);
    const [userEdited, setUserEdited] = useState(false);
    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    useEffect(() => {
        if (!selectedCandidate) {
            setOriginalForCandidateId(null);
            setOriginalComment("");
            setUserEdited(false);
            return;
        }

        setOriginalForCandidateId(selectedCandidate.id);
        setOriginalComment(candComment ?? "");
        setUserEdited(false);
    }, [selectedCandidate?.id]);

    useEffect(() => {
        if (!selectedCandidate) return;
        if (originalForCandidateId !== selectedCandidate.id) return;
        if (userEdited) return;

        if ((candComment ?? "") !== (originalComment ?? "")) {
            setOriginalComment(candComment ?? "");
        }
    }, [candComment, selectedCandidate, originalForCandidateId, userEdited, originalComment]);

    const hasChanges = (candComment ?? "").trim() !== (originalComment ?? "").trim();

    const isSaveDisabled =
        !selectedCandidate || !userEdited || !hasChanges || !!isCommentLocked;

    const handleSaveComment = async () => {
        try {
            await Promise.resolve(saveCandidateComment?.());
            setOriginalComment(candComment ?? "");
            setUserEdited(false);
            showToast("Saved", "success");
        } catch {
            showToast("Save failed", "error");
        }
    };

    const ghostWrapRef = useRef(null);
    const measuredOnceRef = useRef(false);

    useLayoutEffect(() => {
        if (measuredOnceRef.current) return;
        const el = ghostWrapRef.current;
        if (!el) return;

        const BUFFER = 16;
        const h = Math.ceil(el.offsetHeight + BUFFER);

        onMeasureOnce?.(h);
        measuredOnceRef.current = true;
    }, [onMeasureOnce]);

    return (
        <>
            {/* Hidden layout used only for measuring consistent height */}
            <div
                ref={ghostWrapRef}
                style={{
                    position: "absolute",
                    left: -99999,
                    top: -99999,
                    visibility: "hidden",
                    pointerEvents: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                <div className="box">
                    <div className="box__content-min50 text-default">Sample</div>
                </div>

                <div className="lock-banner" role="note" aria-live="polite">
                    <div className="lock-banner__title">
                        <span style={{ fontSize: 13 }} aria-hidden>
                            🔒
                        </span>
                        <span>Candidate Status</span>
                    </div>
                    <div className="lock-banner__status">APPROVED</div>
                    <div className="lock-banner__desc">
                        Comments are locked and cannot be edited.
                    </div>
                </div>
            </div>

            {/* Main comments panel */}
            <Card
                className="panel panel--short d-flex flex-column"
                style={{
                    flex: 1,
                    margin: 0,
                    height: frozenHeight ?? "auto",
                    overflow: "hidden",
                }}
            >
                <CardBody
                    style={{
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        height: "100%",
                    }}
                >
                    {!selectedCandidate && (
                        <div className="text-muted">Select a candidate to write comments…</div>
                    )}

                    {selectedCandidate &&
                        (isCommentLocked ? (
                            // Read-only view when comments are locked
                            <>
                                <div className="box">
                                    <div
                                        className={
                                            "box__content-min50 " +
                                            (candComment?.trim() ? "text-default" : "text-muted")
                                        }
                                    >
                                        {candComment?.trim() ? candComment : <span>No comments.</span>}
                                    </div>
                                </div>

                                <div className="lock-banner" role="note" aria-live="polite">
                                    <div className="lock-banner__title">
                                        <span style={{ fontSize: 13 }} aria-hidden>
                                            🔒
                                        </span>
                                        <span>Candidate Status</span>
                                    </div>
                                    <div className="lock-banner__status">
                                        {(selectedCandidate?.status || "").toUpperCase()}
                                    </div>
                                    <div className="lock-banner__desc">
                                        Comments are locked and cannot be edited.
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Editable textarea + Save button
                            <>
                                <Input
                                    type="textarea"
                                    rows={3}
                                    placeholder="Write comments about the candidate..."
                                    value={candComment}
                                    onChange={(e) => {
                                        setUserEdited(true);
                                        setCandComment(e.target.value);
                                    }}
                                    className="textarea-sm flex-grow-1"
                                />
                                <div className="d-flex justify-content-end mt-8">
                                    <Button
                                        color="success"
                                        onClick={handleSaveComment}
                                        disabled={isSaveDisabled}
                                        className="btn-sm-fixed"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        ))}
                </CardBody>
            </Card>

            {/* Toast notifications */}
            <TinyToast
                show={toast.show}
                text={toast.text}
                type={toast.type}
                onHide={hideToast}
            />
        </>
    );
};

export default CandidateComments;
