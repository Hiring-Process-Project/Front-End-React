import React, { useState } from 'react';
import { Collapse, Button, Badge } from 'reactstrap';
import "./Candidates.css";

function CandidateQuestionsDropDown({
    questions = [],
    onSelectStep,
    showScore = false,
    getQuestionScore,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const safeQuestions = Array.isArray(questions) ? questions : [];

    return (
        <div className="candidate-container">
            {safeQuestions.map((item, index) => {
                const steps = Array.isArray(item?.steps) ? item.steps : [];
                const res = showScore && getQuestionScore ? getQuestionScore(item) : null;

                const complete = res?.complete;
                const score = res?.score;
                const rated = res?.ratedCount ?? 0;
                const total = res?.total ?? steps.length;
                const pct = total ? Math.round((rated / total) * 100) : 0;

                return (
                    <div key={index} className="question-box">
                        <Button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className={`question-btn ${openIndex === index ? 'active' : ''}`}
                            block
                            style={{ textAlign: 'left' }}
                        >
                            <div className="question-header">
                                <span className="question-text">{item?.question ?? '—'}</span>
                                <div className="badge-group">
                                    <Badge pill className="steps-badge">{steps.length} steps</Badge>
                                    {showScore && (
                                        complete
                                            ? <Badge pill className="score-badge">{score}%</Badge>
                                            : <Badge pill className="rated-badge">{rated}/{total} rated</Badge>
                                    )}
                                </div>
                            </div>

                            <Collapse isOpen={openIndex === index}>
                                {!complete && showScore && (
                                    <div className="tiny-progress">
                                        <div className="tiny-progress__bar" style={{ width: `${pct}%` }} />
                                    </div>
                                )}

                                <div className="steps-wrapper">
                                    {steps.map((step, i) => {
                                        const name = typeof step === 'string' ? step : (step?.name ?? '—');
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                className="step-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectStep?.(step);
                                                }}
                                            >
                                                {name}
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
    );
}

export default CandidateQuestionsDropDown;