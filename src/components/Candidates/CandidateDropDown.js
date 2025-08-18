import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import { FaDownload } from 'react-icons/fa'; // εικονίδιο download
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Candidates.css';

function CandidateDropdown({ candidates, onSelect }) {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index, cand) => {
        const next = openIndex === index ? null : index;
        setOpenIndex(next);
        onSelect?.(next === null ? null : cand);
    };

    const handleDownload = (cvFileName) => {
        // Εδώ βάζεις την πραγματική διαδρομή του CV
        const fileUrl = `/cv/${cvFileName}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = cvFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Το αρχείο ${cvFileName} κατέβηκε με επιτυχία!`);
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
                            <p>
                                <strong>CV:</strong> {candidate.cv}
                                <Button
                                    color="link"
                                    style={{ padding: '0 5px' }}
                                    onClick={() => handleDownload(candidate.cv)}
                                >
                                    <FaDownload size={16} />
                                </Button>
                            </p>
                        </div>
                    </Collapse>
                </div>
            ))}

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
}

export default CandidateDropdown;
