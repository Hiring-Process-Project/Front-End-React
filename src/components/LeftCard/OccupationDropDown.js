import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({
    occupations = [],
    onJobAdSelect,
    selectedJobAdId,
    onOccupationSelect,
    selectedOccupationId = null,
    parentDepartmentId = null,
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const [activeJobId, setActiveJobId] = useState(() => selectedJobAdId ?? null);

    useEffect(() => {
        if (selectedJobAdId != null && selectedJobAdId !== activeJobId) {
            setActiveJobId(selectedJobAdId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedJobAdId]);

    const selectedOccIndex = useMemo(() => {
        if (activeJobId == null) return null;
        const idx = occupations.findIndex((occ) =>
            (occ?.jobTitles ?? []).some((j) => j?.id === activeJobId)
        );
        return idx >= 0 ? idx : null;
    }, [occupations, activeJobId]);

    useEffect(() => {
        if (selectedOccIndex != null) setOpenIndex(selectedOccIndex);
    }, [selectedOccIndex]);

    const handleToggle = (index, occupation) => {
        const nextOpen = openIndex === index ? null : index;
        setOpenIndex(nextOpen);
        setActiveJobId(null);
        onJobAdSelect?.(null);
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
                            <span className="truncate-1" style={{ color: 'black' }}>{occupation.name}</span>
                            <span className="badge">
                                {`${(occupation.jobTitles || []).filter((j) => j.status === 'Published').length}/${(occupation.jobTitles || []).length}`}
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
                                        title={job?.title ?? ''}
                                    >
                                        <span className="job-title-name truncate-1">{job.title}</span>
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
