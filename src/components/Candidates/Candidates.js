import CandidateDropdown from './CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import { Row, Col, Card, CardBody, Button, Badge, Collapse } from 'reactstrap';
import { useState } from 'react';
import StepSkills from './StepSkills';
import './Candidates.css';

function Candidates() {
    const [ratings, setRatings] = useState({});
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [openIndex, setOpenIndex] = useState(null); // accordion για τα steps

    // ΝΕΟ FORMAT: τα data είναι **ήδη** Steps → Questions → Skills
    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    const handleRateSkill = ({ skill, rating, comment }) => {
        const skillId =
            skill?.id ??
            `${selectedStep?.name || 'step'}::${selectedQuestion?.question || 'question'}::${skill?.name || String(skill)}`;

        setRatings(prev => ({
            ...prev,
            [skillId]: { value: Number(rating), comment: comment || '' },
        }));
    };

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
                                setOpenIndex(null);
                            }}
                        />
                    </CardBody>
                </Card>
            </Col>

            {/* ΜΕΣΗ: Steps → Questions (inline accordion) */}
            <Col md="4">
                <label className="description-labels">Interview Steps:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <div className="candidate-container">
                                {stepsData.map((step, idx) => {
                                    const isOpen = openIndex === idx;
                                    return (
                                        <div key={step.name || idx} className="question-box">
                                            <Button
                                                onClick={() => {
                                                    const next = isOpen ? null : idx;
                                                    setOpenIndex(next);
                                                    setSelectedStep(isOpen ? null : step);
                                                    setSelectedQuestion(null);
                                                }}
                                                className={`question-btn ${isOpen ? 'active' : ''}`}
                                                block
                                                style={{ textAlign: 'left' }}
                                            >
                                                <div className="question-header">
                                                    <span className="question-text">{step.name}</span>
                                                    <div className="badge-group" style={{ display: 'flex', gap: 6 }}>
                                                        <Badge pill className="steps-badge">
                                                            {step.questions?.length ?? 0} questions
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <Collapse isOpen={isOpen}>
                                                    <div className="steps-wrapper">
                                                        {(step.questions ?? []).map((q, i) => (
                                                            <button
                                                                key={q.id ?? `${step.name}::${i}`}
                                                                type="button"
                                                                className="step-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedStep(step);
                                                                    setSelectedQuestion(q);
                                                                }}
                                                            >
                                                                {q.question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Collapse>
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ opacity: 0.6 }}>Select a candidate to see steps…</div>
                        )}
                    </CardBody>
                </Card>

                <Row className="mt-5">
                    <Col className="d-flex justify-content-center">
                        <Button color="success" style={{ minWidth: 120 }} disabled={!selectedCandidate}>
                            Approve
                        </Button>
                    </Col>
                </Row>
            </Col>

            {/* ΔΕΞΙΑ: Skills της επιλεγμένης ερώτησης (edit mode) */}
            <Col md="4">
                <label className="description-labels">Skills for this question:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <StepSkills step={rightPaneStepObj} onRate={handleRateSkill} />
                        ) : (
                            <div style={{ opacity: 0.6 }}>Select a candidate to see skills…</div>
                        )}
                    </CardBody>
                </Card>

                <Row className="mt-5">
                    <Col className="d-flex justify-content-center">
                        <Button color="danger" style={{ minWidth: 120 }} disabled={!selectedCandidate}>
                            Reject
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default Candidates;
