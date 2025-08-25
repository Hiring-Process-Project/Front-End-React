import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({ occupations = [], onJobAdSelect, selectedJobAdId }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [activeJobId, setActiveJobId] = useState(() => selectedJobAdId ?? null);

    // Αν έρθει έγκυρο selectedJobAdId από τον parent, συγχρόνισέ το (δεν καθαρίζουμε ποτέ σε null)
    useEffect(() => {
        if (selectedJobAdId != null && selectedJobAdId !== activeJobId) {
            setActiveJobId(selectedJobAdId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    // Άνοιξε αυτόματα το occupation που περιέχει το επιλεγμένο Job
    const selectedOccIndex = useMemo(() => {
        if (activeJobId == null) return null;
        const idx = occupations.findIndex(occ =>
            (occ?.jobTitles ?? []).some(j => j?.id === activeJobId)
        );
        return idx >= 0 ? idx : null;
    }, [occupations, activeJobId]);

    useEffect(() => {
        if (selectedOccIndex != null) setOpenIndex(selectedOccIndex);
    }, [selectedOccIndex]);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            {occupations.map((occupation, index) => (
                <div key={occupation?.id ?? index} className="job-title-box">
                    <Button onClick={() => handleToggle(index)} className="occupation-btn" block>
                        <div className="occupation-header">
                            <span style={{ color: 'black' }}>{occupation.name}</span>
                            <span className="badge">
                                {`${(occupation.jobTitles || []).filter(j => j.status === 'Published').length}/${(occupation.jobTitles || []).length}`}
                            </span>
                        </div>
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div>
                            {(occupation.jobTitles || []).map((job, i) => {
                                const isSelected = job?.id === activeJobId;
                                return (
                                    <Button
                                        key={job?.id ?? i}
                                        className={`job-title-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (!job?.id) return;
                                            setActiveJobId(job.id);        // Μένει γκρι μέχρι να πατήσεις άλλο
                                            onJobAdSelect?.(job.id);       // Ενημέρωσε parent
                                        }}
                                        aria-pressed={isSelected}
                                    >
                                        <span className="job-title-name">{job.title}</span>
                                        <span className={`status-label ${job.status?.toLowerCase?.() || 'unknown'}`}>
                                            {job.status}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
}

export default OccupationDropdown;
