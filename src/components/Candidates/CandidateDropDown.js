import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './Candidates.css';

function CandidateDropdown({ candidates, onSelect }) {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index, cand) => {
        const next = openIndex === index ? null : index;
        setOpenIndex(next);
        onSelect?.(next === null ? null : cand);
    };

    return (
        <div className="candidate-container">
            {candidates.map((candidate, index) => (
                <div key={index}>
                    <Button
                        onClick={() => handleToggle(index, candidate)}
                        className={`candidate-btn ${openIndex === index ? 'active' : ''}`}
                        block
                    >
                        <div className="candidate-header">
                            <span className="candidate-index">{index + 1}</span>
                            <span className="candidate-name">{candidate.name}</span>
                            <span className={`candidate-status ${candidate.status?.toLowerCase?.() || 'unknown'}`}>
                                {candidate.status}
                            </span>
                        </div>
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div className="candidate-details">
                            <p><strong>Name:</strong> {candidate.name}</p>
                            <p><strong>Email:</strong> {candidate.email}</p>
                            <p><strong>CV:</strong> {candidate.cv}</p>
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
}

export default CandidateDropdown;
