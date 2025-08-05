import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({ occupations }) {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            {occupations.map((occupation, index) => (
                <div key={index} className="job-title-box">
                    <Button
                        onClick={() => handleToggle(index)}
                        className="occupation-btn"
                        block
                    >
                        <div className="occupation-header">
                            <span style={{ color: "black" }}>{occupation.name}</span>
                            <span className="badge">
                                {
                                    `${occupation.jobTitles.filter(j => j.status === 'Published').length}/${occupation.jobTitles.length}`
                                }
                            </span>

                        </div>
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div >
                            {occupation.jobTitles.map((job, i) => (
                                <Button key={i} className="job-title-item">
                                    <span className="job-title-name">{job.title}</span>
                                    <span className={`status-label ${job.status?.toLowerCase?.() || 'unknown'}`}>

                                        {job.status}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
}

export default OccupationDropdown;
