import React, { useState } from 'react';
import { Row, Col, Card, CardBody, Button, Badge, Collapse } from 'reactstrap';
import CandidateDropdown from './CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import StepSkills from './StepSkills';
import StepsAccordion from './StepsDropDown';
import './Candidates.css';

function Candidates() {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // αν δεν έχεις ratings εδώ, άσε το κενό αντικείμενο
    const [ratings] = useState({});

    // ΝΕΟ FORMAT: Steps → Questions → Skills
    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    const rightPaneStepObj =
        selectedStep && selectedQuestion
            ? { name: `${selectedStep.name} — ${selectedQuestion.question}`, skills: selectedQuestion.skills || [] }
            : null;

    return (
        <Row>
            {/* ΑΡΙΣΤΕΡΑ: Candidates */}
            <Col md="4">
                <Card className="panel">
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
                            }}
                        />
                    </CardBody>
                </Card>
            </Col>

            {/* ΜΕΣΗ: ΕΝΙΑΙΟ StepsAccordion (όπως στην 1η εικόνα) */}
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

            {/* ΔΕΞΙΑ: Skills της επιλεγμένης ερώτησης */}
            <Col md="4">
                <label className="description-labels">Skills for this question:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <StepSkills step={rightPaneStepObj} onRate={() => { }} />
                        ) : (
                            <div style={{ opacity: 0.6 }}>Select a candidate to see skills…</div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Candidates;
