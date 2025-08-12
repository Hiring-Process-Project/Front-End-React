import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './CandidateDropDown.css';

function CandidateDropdown({ candidates }) {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="candidate-container">
            {candidates.map((candidate, index) => (
                <div key={index} >
                    <Button
                        onClick={() => handleToggle(index)}
                        className={`candidate-btn ${openIndex === index ? 'active' : ''}`}
                        block
                    >
                        <div className="candidate-header">
                            <span className="candidate-index">{index + 1}</span>
                            <span className="candidate-name">{candidate.name}</span>
                            <span className={`candidate-status ${candidate.status?.toLowerCase?.() || 'unknown'}`}>{candidate.status}</span>
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
