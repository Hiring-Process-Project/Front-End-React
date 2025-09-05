import { Card, CardBody, Row, Col, Button } from "reactstrap";
import './Candidates.css';
import CandidateDropdown from "./CandidateDropDown";

const CandidateListPanel = ({
    loadingCandidates,
    errCandidates,
    candidates,
    setSelectedCandidate,
    openConfirm,
    selectedCandidate,
    isLocked
}) => (
    <Col md="4" className="d-flex flex-column align-items-stretch">
        <label className="description-labels">Candidates:</label>
        <Card className="panel">
            <CardBody>
                <Row className="panel__header-row">
                    <Col md="4">
                        <label className="active-label">Candidate No:</label>
                    </Col>
                    <Col md="4">
                        <label className="active-label">Name:</label>
                    </Col>
                    <Col md="4">
                        <label className="active-label">Status:</label>
                    </Col>
                </Row>

                {loadingCandidates ? (
                    <div>Loading candidates…</div>
                ) : errCandidates ? (
                    <div style={{ color: "crimson" }}>Error: {errCandidates}</div>
                ) : (
                    <CandidateDropdown
                        candidates={candidates}
                        onSelect={(cand) => {
                            setSelectedCandidate(cand);
                        }}
                    />
                )}
            </CardBody>
        </Card>

        {/* Approve / Reject */}
        <div className="align-center mt-16">
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
    </Col>
);

export default CandidateListPanel;