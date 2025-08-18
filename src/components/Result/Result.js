import React, { useState } from 'react';
import { Row, Col, Card, CardBody, Button, Input } from 'reactstrap';
import CandidateDropdown from '../Candidates/CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import StepSkills from '../Candidates/StepSkills';
import StepsAccordion from '../Candidates/StepsDropDown';
import '../Candidates/Candidates.css';

export default function Result() {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [generalComment, setGeneralComment] = useState('');

    const [ratings] = useState({}); // ratings από backend όταν συνδεθεί
    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    const rightPaneStepObj =
        selectedStep && selectedQuestion
            ? { name: `${selectedStep.name} — ${selectedQuestion.question}`, skills: selectedQuestion.skills || [] }
            : null;

    return (
        <div>
            {/* Επάνω σειρά: 3 panels */}
            <Row>
                {/* ΑΡΙΣΤΕΡΑ */}
                <Col md="4">
                    <label className="description-labels">Candidates:</label>
                    <Card className="panel panel--short">
                        <CardBody>
                            <Row className="panel__header-row">
                                <Col md="4"><label className="active-label">Candidate No:</label></Col>
                                <Col md="4"><label className="active-label">Name:</label></Col>
                                <Col md="4"><label className="active-label">Status:</label></Col>
                            </Row>
                            <CandidateDropdown
                                candidates={candidatesData}
                                onSelect={(cand) => {
                                    setSelectedCandidate(cand);
                                    setSelectedStep(null);
                                    setSelectedQuestion(null);
                                    setGeneralComment('');
                                }}
                            />
                        </CardBody>
                    </Card>
                </Col>

                {/* ΜΕΣΗ */}
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

                {/* ΔΕΞΙΑ */}
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

            {/* Κάτω σειρά: κουμπιά (κέντρο) + comments (8 στήλες) */}
            <Row className="bottom-controls" style={{ marginTop: 16, alignItems: 'flex-start' }}>
                {/* Buttons – κεντραρισμένα οριζόντια και normal ύψος */}
                <Col md="4" className="d-flex justify-content-center">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <Button color="success" style={{ minWidth: 120, height: 40 }} disabled={!selectedCandidate}>
                            Approve
                        </Button>
                        <Button color="danger" style={{ minWidth: 120, height: 40 }} disabled={!selectedCandidate}>
                            Reject
                        </Button>
                    </div>
                </Col>

                {/* Comments */}
                <Col md="8">
                    <Card
                        className="shadow-sm"
                        style={{
                            backgroundColor: '#E5E7EB',
                            borderRadius: '12px',
                            height: 140
                        }}
                    >
                        <CardBody>
                            <Input
                                type="textarea"
                                rows={2}
                                placeholder="Write comments about this candidate..."
                                value={generalComment}
                                onChange={(e) => setGeneralComment(e.target.value)}
                                style={{ resize: 'vertical' }}
                                disabled={!selectedCandidate}
                            />
                        </CardBody>
                        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
                            <Button color="success" style={{ width: 60, height: 36 }} disabled={!selectedCandidate}>
                                Save
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
