import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({
    occupations = [],
    onJobAdSelect,
    selectedJobAdId,

    // NEW for occupation scope
    onOccupationSelect, // (occ) => void
    selectedOccupationId = null,
    parentDepartmentId = null,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [activeJobId, setActiveJobId] = useState(() => selectedJobAdId ?? null);

    // Sync επιλεγμένο job
    useEffect(() => {
        if (selectedJobAdId != null && selectedJobAdId !== activeJobId) {
            setActiveJobId(selectedJobAdId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    // Άνοιξε αυτόματα το occupation που περιέχει το επιλεγμένο Job
    const selectedOccIndex = useMemo(() => {
        if (activeJobId == null) return null;
        const idx = occupations.findIndex((occ) => (occ?.jobTitles ?? []).some((j) => j?.id === activeJobId));
        return idx >= 0 ? idx : null;
    }, [occupations, activeJobId]);

    useEffect(() => {
        if (selectedOccIndex != null) setOpenIndex(selectedOccIndex);
    }, [selectedOccIndex]);

    const handleToggle = (index, occupation) => {
        const nextOpen = openIndex === index ? null : index;
        setOpenIndex(nextOpen);

        // ✨ Κάθε φορά που αλλάζεις/πατάς occupation, καθάρισε το selected job
        setActiveJobId(null);
        onJobAdSelect?.(null);

        // ενημέρωσε και το occupation scope προς τα πάνω
        onOccupationSelect?.({
            id: occupation?.id ?? null,
            name: occupation?.name,
            departmentId: parentDepartmentId ?? null,
        });
    };


    const isOccActive = (occ) => {
        if (selectedOccupationId == null || !occ?.id) return false;
        return Number(selectedOccupationId) === Number(occ.id);
    };

    return (
        <div className="occupation-container">
            {occupations.map((occupation, index) => (
                <div key={occupation?.id ?? occupation?.name ?? index} className="job-title-box">
                    <Button
                        onClick={() => handleToggle(index, occupation)}
                        className={`occupation-btn ${isOccActive(occupation) ? 'active' : ''}`}
                        block
                    >
                        <div className="occupation-header">
                            <span style={{ color: 'black' }}>{occupation.name}</span>
                            <span className="badge">
                                {`${(occupation.jobTitles || []).filter((j) => j.status === 'Published').length}/${(occupation.jobTitles || []).length
                                    }`}
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
                                            setActiveJobId(job.id);
                                            onJobAdSelect?.(job.id);
                                        }}
                                        aria-pressed={isSelected}
                                    >
                                        <span className="job-title-name">{job.title}</span>
                                        <span className={`status-label ${job.status?.toLowerCase?.() || 'unknown'}`}>{job.status}</span>
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
