import React, { useState, useEffect } from "react";
import { Input, Button, Card, CardBody } from "reactstrap";

/** Μικρό toast χωρίς libs */
function TinyToast({ show, text, type = "info", onHide }) {
    useEffect(() => {
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

    // ✅ baseline ανά candidate + flag αν ο χρήστης έχει επεξεργαστεί το πεδίο
    const [originalComment, setOriginalComment] = useState("");
    const [originalForCandidateId, setOriginalForCandidateId] = useState(null);
    const [userEdited, setUserEdited] = useState(false);

    const showToast = (text, type = "info") => setToast({ show: true, text, type });
    const hideToast = () => setToast((t) => ({ ...t, show: false }));

    // ✅ Όταν αλλάζει candidate: reset baseline & userEdited
    useEffect(() => {
        if (!selectedCandidate) {
            setOriginalForCandidateId(null);
            setOriginalComment("");
            setUserEdited(false);
            setCommentStatus(null);
            return;
        }
        setOriginalForCandidateId(selectedCandidate.id);
        setOriginalComment(candComment ?? ""); // baseline = ό,τι υπάρχει τώρα (ακόμη κι αν είναι κενό)
        setUserEdited(false);
        setCommentStatus("Saved");
    }, [selectedCandidate?.id]);

    // ✅ Αν φορτωθεί αργότερα το αρχικό σχόλιο από το backend,
    // και ΔΕΝ έχει γράψει ο χρήστης, ευθυγράμμισε το baseline ώστε το Save να μείνει κλειδωμένο.
    useEffect(() => {
        if (!selectedCandidate) return;
        if (originalForCandidateId !== selectedCandidate.id) return;
        if (userEdited) return; // μην πειράξεις το baseline αν ο χρήστης ήδη πληκτρολόγησε
        if ((candComment ?? "") !== (originalComment ?? "")) {
            setOriginalComment(candComment ?? "");
            setCommentStatus("Saved");
        }
    }, [candComment, selectedCandidate, originalForCandidateId, originalComment, userEdited]);

    // ✅ Το Save ενεργοποιείται ΜΟΝΟ όταν ο χρήστης έχει επεξεργαστεί (userEdited)
    // και υπάρχει πραγματική διαφορά από το baseline, και δεν υπάρχει lock.
    const hasChanges = (candComment ?? "").trim() !== (originalComment ?? "").trim();
    const isSaveDisabled = !selectedCandidate || !userEdited || !hasChanges || !!isCommentLocked;

    const handleSaveComment = async () => {
        try {
            await Promise.resolve(saveCandidateComment?.());

            // ➜ Αν πριν δεν υπήρχε αποθηκευμένο σχόλιο, αυτό είναι το πρώτο save
            const firstSave = ((originalComment ?? "").trim().length === 0);

            // Νέα “βάση” = ό,τι σώθηκε τώρα
            setOriginalComment(candComment ?? "");
            setUserEdited(false);

            setCommentStatus(firstSave ? "Saved" : "Modified");
            showToast(firstSave ? "Saved" : "Modified", firstSave ? "success" : "info");
        } catch {
            showToast("Save failed", "error");
        }
    };


    return (
        <Card className="panel panel--short">
            <CardBody>
                {!selectedCandidate && (
                    <div className="text-muted">Select a candidate to write comments…</div>
                )}

                {selectedCandidate && (
                    isCommentLocked ? (
                        <>
                            {/* Read-only σχόλια */}
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

                            {/* Banner κλειδώματος */}
                            {jobAdCompleteLocked ? (
                                <div className="lock-banner mt-10" role="note" aria-live="polite">
                                    <div className="lock-banner__title">
                                        <span style={{ fontSize: 13 }} aria-hidden>🔒</span>
                                        <span>Comments</span>
                                    </div>
                                    <div className="lock-banner__desc">
                                        The job ad is complete. Another candidate has been hired and
                                        comment editing is locked.
                                    </div>
                                </div>
                            ) : (
                                <div className="lock-banner mt-10" role="note" aria-live="polite">
                                    <div className="lock-banner__title">
                                        <span style={{ fontSize: 13 }} aria-hidden>🔒</span>
                                        <span>Candidate Status</span>
                                    </div>
                                    <div className="lock-banner__status">
                                        {(selectedCandidate?.status || "").toUpperCase()}
                                    </div>
                                    <div className="lock-banner__desc">
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
                                onChange={(e) => {
                                    setUserEdited(true);          // ✅ σημαδεύουμε ότι ο χρήστης επεξεργάστηκε
                                    setCandComment(e.target.value);
                                }}
                                className="textarea-sm"
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
                    )
                )}
            </CardBody>

            <TinyToast show={toast.show} text={toast.text} type={toast.type} onHide={hideToast} />
        </Card>
    );
};

export default CandidateComments;
