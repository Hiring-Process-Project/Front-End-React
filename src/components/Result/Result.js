import React, { useState } from 'react';
import { Row, Col, Card, CardBody, Button, Input, Badge, Collapse } from 'reactstrap';
import CandidateDropdown from '../Candidates/CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import StepSkills from '../Candidates/StepSkills';
import '../Candidates/Candidates.css';

export default function Result() {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [generalComment, setGeneralComment] = useState('');
    const [openIndex, setOpenIndex] = useState(null);

    // Αν έχεις ratings από backend, φόρτωσέ τα εδώ
    const [ratings] = useState({});

    // ΝΕΟ FORMAT: Steps → Questions → Skills
    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    // ------- scoring (Result ONLY) -------
    const makeSkillKey = (stepName, skill) => {
        const sName = typeof skill === 'string' ? skill : (skill?.name || String(skill));
        return `${stepName}::${sName}`;
    };

    const computeQuestionScore = (question, step) => {
        const stepName = step?.name || 'step';
        const skills = Array.isArray(question?.skills) ? question.skills : [];
        const ids = skills.map(sk => makeSkillKey(stepName, sk));
        const total = ids.length;
        if (!total) return { complete: false, score: null, ratedCount: 0, total: 0 };

        const vals = ids.map(id => ratings[id]?.value).filter(v => Number.isFinite(v));
        const ratedCount = vals.length;
        if (ratedCount !== total) return { complete: false, score: null, ratedCount, total };

        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / total);
        return { complete: true, score: avg, ratedCount: total, total };
    };

    const computeStepScore = (step) => {
        const stepName = step?.name || 'step';
        const allSkills = (step?.questions || []).flatMap(q => Array.isArray(q?.skills) ? q.skills : []);
        const ids = allSkills.map(sk => makeSkillKey(stepName, sk));
        const total = ids.length;
        if (!total) return { complete: false, score: null, ratedCount: 0, total: 0 };

        const vals = ids.map(id => ratings[id]?.value).filter(v => Number.isFinite(v));
        const ratedCount = vals.length;
        if (!ratedCount) return { complete: false, score: null, ratedCount: 0, total };
        if (ratedCount !== total) return { complete: false, score: null, ratedCount, total };

        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / total);
        return { complete: true, score: avg, ratedCount: total, total };
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
                                setGeneralComment('');
                                setOpenIndex(null);
                            }}
                        />
                    </CardBody>
                </Card>
            </Col>

            {/* ΜΕΣΗ: Steps → Questions + Comments (inline) */}
            <Col md="4">
                <label className="description-labels">Interview Steps:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <div className="candidate-container">
                                {stepsData.map((step, idx) => {
                                    const isOpen = openIndex === idx;
                                    const stepScore = computeStepScore(step);

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
                                                        {stepScore.complete ? (
                                                            <Badge pill className="score-badge">{stepScore.score}%</Badge>
                                                        ) : (
                                                            <Badge pill className="rated-badge">
                                                                {stepScore.ratedCount}/{stepScore.total} rated
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <Collapse isOpen={isOpen}>
                                                    <div className="steps-wrapper">
                                                        {(step.questions ?? []).map((q, i) => {
                                                            const qScore = computeQuestionScore(q, step);
                                                            return (
                                                                <button
                                                                    key={q.id ?? `${step.name}::${i}`}
                                                                    type="button"
                                                                    className="step-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedStep(step);
                                                                        setSelectedQuestion(q);
                                                                    }}
                                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                                >
                                                                    <span style={{ paddingRight: 8 }}>{q.question}</span>
                                                                    {qScore.complete ? (
                                                                        <span className="badge score-badge" style={{ margin: 0 }}>{qScore.score}%</span>
                                                                    ) : (
                                                                        <span className="badge rated-badge" style={{ margin: 0 }}>
                                                                            {qScore.ratedCount}/{qScore.total}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
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

                {/* Comments box */}
                <Card
                    className="shadow-sm mt-3"
                    style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '140px' }}
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
                        <Button color="success" style={{ width: 60 }} disabled={!selectedCandidate}>
                            Save
                        </Button>
                    </div>
                </Card>
            </Col>

            {/* ΔΕΞΙΑ: Skills + HIRE */}
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

                <Row className="mt-5">
                    <Col className="d-flex justify-content-center">
                        <Button color="success" style={{ minWidth: 120 }} disabled={!selectedCandidate}>
                            HIRE
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}
