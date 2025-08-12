// import React, { useState } from 'react';
// import { Collapse, Button, Badge, Row, Col } from 'reactstrap';
// import questionsData from '../../data/questions.json';
// import "./CandidateDropDown.css";

// function CandidateQuestionsDropDown({ questions, onSelectStep }) {
//     const [openIndex, setOpenIndex] = useState(null);

//     const handleToggle = (index) => {
//         setOpenIndex(openIndex === index ? null : index);
//     };

//     return (
//         <div>
//             <div className="candidate-container">
//                 {/* Λίστα με τα questions */}
//                 {questionsData.map((item, index) => (
//                     <div key={index} className="question-box">
//                         <Button
//                             onClick={() => handleToggle(index)}
//                             className={`question-btn ${openIndex === index ? 'active' : ''}`}
//                             block
//                         >
//                             <div className="question-header">
//                                 <span className="question-text">{item.question}</span>
//                                 <Badge pill className="steps-badge">
//                                     {`${item.steps.length} step${item.steps.length !== 1 ? 's' : ''}`}
//                                 </Badge>
//                             </div>

//                             <Collapse isOpen={openIndex === index}>
//                                 <div className="steps-wrapper">
//                                     {item.steps.map((step, i) => {
//                                         const name = typeof step === "string" ? step : step.name;
//                                         return (
//                                             <button
//                                                 key={i}
//                                                 type="button"
//                                                 className="step-btn"
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     if (onSelectStep) onSelectStep(step);
//                                                 }}
//                                             >
//                                                 {name}
//                                             </button>
//                                         );
//                                     })}
//                                 </div>
//                             </Collapse>
//                         </Button>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// export default CandidateQuestionsDropDown;

import React, { useState } from 'react';
import { Collapse, Button, Badge } from 'reactstrap';
import "./CandidateDropDown.css";

function CandidateQuestionsDropDown({
    questions = [],
    onSelectStep,
    showScore = false,
    getQuestionScore,
}) {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <div className="candidate-container">
            {questions.map((item, index) => {
                const res = showScore && getQuestionScore ? getQuestionScore(item) : null;
                const complete = res?.complete;
                const score = res?.score;
                const rated = res?.ratedCount ?? 0;
                const total = res?.total ?? item.steps.length;
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
                                {/* Κείμενο ερώτησης — τυλίγεται, δεν κόβεται */}
                                <span className="question-text">{item.question}</span>

                                {/* Badges δεξιά */}
                                <div className="badge-group">
                                    <Badge pill className="steps-badge">
                                        {item.steps.length} steps
                                    </Badge>

                                    {showScore && (
                                        complete ? (
                                            <Badge pill className="score-badge">
                                                {score}%
                                            </Badge>
                                        ) : (
                                            <Badge pill className="rated-badge">
                                                {rated}/{total} rated
                                            </Badge>
                                        )
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
                                    {item.steps.map((step, i) => {
                                        const name = typeof step === "string" ? step : step.name;
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
