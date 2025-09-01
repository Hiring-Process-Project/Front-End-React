import { Card, CardBody, Row, Col, Button } from "reactstrap";
import './Candidates.css';
import CandidateDropdown from "./CandidateDropDown"; // Εξασφαλίζεις ότι το έχετε σωστά εισαχθεί

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
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 16,
            }}
        >
            <Button
                color="success"
                style={{ minWidth: 120, height: 40 }}
                disabled={!selectedCandidate || isLocked}
                onClick={() => openConfirm("APPROVED")} // <-- αλλαγή
            >
                Approve
            </Button>
            <Button
                color="danger"
                style={{ minWidth: 120, height: 40 }}
                disabled={!selectedCandidate || isLocked}
                onClick={() => openConfirm("REJECTED")} // <-- αλλαγή
            >
                Reject
            </Button>
        </div>
    </Col>
);

export default CandidateListPanel;
