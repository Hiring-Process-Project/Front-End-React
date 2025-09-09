// src/components/Candidates/CandidateListPanel.jsx
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
    onCreated, // callback για refresh
}) => {
    const [showAdd, setShowAdd] = useState(false);

    return (
        <Col md="4" className="d-flex flex-column justify-content-between">
            {/* ΠΑΝΩ: τίτλος + panel με λίστα */}
            <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                <label className="description-labels">Candidates:</label>

                <Card className="panel flex-grow-1 d-flex flex-column">
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                        {/* Scrollable σώμα λίστας */}
                        <div className="panel__body" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                            <Row className="panel__header-row">
                                <Col md="4"><label className="active-label">Candidate No:</label></Col>
                                <Col md="4"><label className="active-label">Name:</label></Col>
                                <Col md="4"><label className="active-label">Status:</label></Col>
                            </Row>

                            {loadingCandidates ? (
                                <div>Loading candidates…</div>
                            ) : errCandidates ? (
                                <div style={{ color: "crimson" }}>Error: {errCandidates}</div>
                            ) : (
                                <CandidateDropdown
                                    candidates={candidates}
                                    onSelect={(cand) => setSelectedCandidate(cand)}
                                />
                            )}
                        </div>

                        {/* Add Candidate */}
                        <div className="mt-3 d-flex justify-content-center">
                            <Button color="secondary" onClick={() => setShowAdd(true)}>
                                Add Candidate
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* ΚΑΤΩ: Approve / Reject — κολλημένα στο κάτω μέρος του εξωτερικού container */}
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
