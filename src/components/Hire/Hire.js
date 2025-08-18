import React, { useMemo, useState } from 'react';
import { Row, Col, Card, CardBody, Button, Input } from 'reactstrap';
import CandidateDropdown from '../Candidates/CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import StepSkills from '../Candidates/StepSkills';
import StepsAccordion from '../Candidates/StepsDropDown';
import '../Candidates/Candidates.css';

function Hire() {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // comments per candidate (local state)
    const [comments, setComments] = useState({});
    const [draftComment, setDraftComment] = useState('');

    // placeholder for ratings if/when you hook backend
    const [ratings] = useState({});

    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    // μόνο Approved candidates
    const approvedCandidates = useMemo(() => {
        const norm = (s) => String(s || '').toLowerCase();
        return (Array.isArray(candidatesData) ? candidatesData : []).filter(
            (c) => norm(c.status) === 'approved'
        );
    }, []);

    const getCandKey = (cand) =>
        cand?.id ??
        cand?.email ??
        `${cand?.name || ''}#${cand?.number || cand?.CandidateNo || ''}`;

    const rightPaneStepObj =
        selectedStep && selectedQuestion
            ? {
                name: `${selectedStep.name} — ${selectedQuestion.question}`,
                skills: selectedQuestion.skills || [],
            }
            : null;

    const handleSelectCandidate = (cand) => {
        setSelectedCandidate(cand);
        setSelectedStep(null);
        setSelectedQuestion(null);
        // load existing comment (if any)
        const key = getCandKey(cand);
        setDraftComment(comments[key] || '');
    };

    const handleSaveComment = () => {
        if (!selectedCandidate) return;
        const key = getCandKey(selectedCandidate);
        setComments((prev) => ({ ...prev, [key]: draftComment }));
    };

    const handleHire = () => {
        if (!selectedCandidate) return;
        // εδώ βάλε το πραγματικό action (API call κ.λπ.)
        alert(`Hired: ${selectedCandidate?.name || 'candidate'}`);
    };

    return (
        <div>
            {/* Επάνω σειρά: Candidates / Steps / Skills */}
            <Row>
                {/* ΑΡΙΣΤΕΡΑ: μόνο Approved candidates */}
                <Col md="4">
                    <label className="description-labels">Approved Candidates:</label>
                    <Card className="panel panel--short">
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

                            <CandidateDropdown
                                candidates={approvedCandidates}
                                onSelect={handleSelectCandidate}
                            />
                        </CardBody>
                    </Card>
                </Col>

                {/* ΜΕΣΗ: Steps */}
                <Col md="4">
                    <label className="description-labels">Interview Steps:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            {selectedCandidate ? (
                                <StepsAccordion
                                    steps={stepsData}
                                    ratings={ratings}
                                    onSelect={(step, q) => {
                                        setSelectedStep(step);
                                        setSelectedQuestion(q);
                                    }}
                                    showScore={true}
                                />
                            ) : (
                                <div style={{ opacity: 0.6 }}>Select a candidate to see steps…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {/* ΔΕΞΙΑ: Skills */}
                <Col md="4">
                    <label className="description-labels">Skills for this question:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            {selectedCandidate ? (
                                <StepSkills step={rightPaneStepObj} mode="view" />
                            ) : (
                                <div style={{ opacity: 0.6 }}>Select a candidate to see skills…</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Κάτω σειρά: HIRE + Comments */}
            <Row style={{ marginTop: 16, alignItems: 'flex-start' }}>
                {/* HIRE button */}

                {/* Comments για τον επιλεγμένο υποψήφιο */}
                <Col md="8">
                    <Card
                        className="shadow-sm"
                        style={{
                            backgroundColor: '#E5E7EB',
                            borderRadius: 12,
                            minHeight: 140,
                        }}
                    >
                        <CardBody>
                            <Input
                                type="textarea"
                                rows={2}
                                placeholder="No comments available"
                                value={draftComment}
                                readOnly
                                style={{
                                    resize: 'none',
                                    backgroundColor: '#f3f4f6', // γκρι φόντο για να φαίνεται μη-επεξεργάσιμο
                                    cursor: 'default'
                                }}
                            />

                        </CardBody>
                    </Card>
                </Col>
                <Col md="4" className="d-flex justify-content-center">
                    <Button
                        color="success"
                        onClick={handleHire}
                        disabled={!selectedCandidate}
                        style={{ minWidth: 160, height: 44, fontWeight: 600 }}
                    >
                        HIRE
                    </Button>
                </Col>

            </Row>
        </div>
    );
}

export default Hire;