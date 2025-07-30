import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({ occupations = [] }) {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            {occupations.map((occupation, index) => (
                <div key={index} className="occupation-box">
                    <Button
                        onClick={() => toggle(index)}
                        className="occupation-btn"
                        block
                    >
                        {occupation.name}
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div className="job-title-box">
                            {(occupation.jobTitles || []).map((title, i) => (
                                <div key={i} className="job-title-item">
                                    {title}
                                </div>
                            ))}
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
}

export default OccupationDropdown;
