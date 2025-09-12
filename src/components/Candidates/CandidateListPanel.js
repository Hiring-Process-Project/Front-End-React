import React, { useState } from "react";
import { Card, CardBody, Row, Col, Button } from "reactstrap";
import "./Candidates.css";
import CandidateDropdown from "./CandidateDropDown";
import AddCandidateModal from "./AddCandidateModal";

const CandidateListPanel = ({
    loadingCandidates,
    errCandidates,
    candidates,
    setSelectedCandidate,
    openConfirm,
    selectedCandidate,
    isLocked,
    jobAdId,
    onCreated,
}) => {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <Col md="4" className="d-flex flex-column" style={{ minHeight: 0, height: '100%' }}>
            {/* τίτλος + panel που τεντώνει */}
            <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                <label className="description-labels">Candidates:</label>
                <Card className="candidate-panel panel panel--flex" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex' }}>
                    <CardBody
                        style={{
                            minHeight: 0,
                            height: '100%',
                            display: 'grid',
                            gridTemplateRows: 'auto 1fr auto', // header / scroll / buttons
                            gap: 8
                        }}
                    >
                        {/* Header (εκτός scroll) */}
                        <Row className="panel__header-row">
                            <Col md="4"><label className="active-label">Candidate No:</label></Col>
                            <Col md="4"><label className="active-label">Name:</label></Col>
                            <Col md="4"><label className="active-label">Status:</label></Col>
                        </Row>

                        {/* ΜΟΝΟ εδώ κάνει scroll */}
                        <div className="clp-scroll" style={{ minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            {loadingCandidates ? (
                                <div>Loading candidates…</div>
                            ) : errCandidates ? (
                                <div style={{ color: "crimson" }}>Error: {errCandidates}</div>
                            ) : (
                                <CandidateDropdown
                                    key={selectedCandidate ? "hasSel" : "noSel"}          // προαιρετικό hack
                                    candidates={candidates}
                                    selectedId={selectedCandidate?.id ?? null}
                                    expandedId={selectedCandidate?.id ?? null}            // <<-- NEW: ελέγχουμε αν είναι ανοιχτό
                                    onSelect={(cand) => {
                                        setSelectedCandidate(prev => (prev?.id === cand?.id ? null : cand));
                                    }}
                                />


                            )}
                        </div>

                        {/* Buttons (εκτός scroll) */}
                        <div className="mt-3 d-flex justify-content-center">
                            <Button color="secondary" onClick={() => setShowAdd(true)}>Add Candidate</Button>
                        </div>
                    </CardBody>
                </Card>

            </div>

            {/* Approve / Reject — σταθερά κάτω */}
            <div className="d-flex justify-content-center gap-2 mt-3 pb-2">
                <Button
                    color="success"
                    className="btn-lg-fixed"
                    disabled={!selectedCandidate || isLocked}
                    onClick={() => openConfirm("APPROVED")}
                >
                    Approve
                </Button>
                <Button
                    color="danger"
                    className="btn-lg-fixed"
                    disabled={!selectedCandidate || isLocked}
                    onClick={() => openConfirm("REJECTED")}
                >
                    Reject
                </Button>
            </div>

            <AddCandidateModal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                jobAdId={jobAdId}
                onCreated={onCreated}
            />
        </Col>
    );
};

export default CandidateListPanel;
