import React, { useEffect, useState } from 'react';
import SkillSelector from './SkillSelector';

function JobAdSkillLoader({ jobAdId, allskills }) {
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!jobAdId) return;

        fetch(`http://localhost:8087/jobAds/${jobAdId}/skills`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch skills");
                return res.json();
            })
            .then(data => {
                const skillNames = data.map(skill => skill.name);
                setRequiredSkills(skillNames);
            })
            .catch(err => {
                console.error(err);
                setError("Could not load available skills");
            });
    }, [jobAdId]);

    if (!jobAdId) {
        return <p style={{ padding: '1rem' }}>Select a job ad to view skills.</p>;
    }

    if (error) {
        return <p style={{ padding: '1rem', color: 'red' }}>{error}</p>;
    }

    return (
        <SkillSelector
            allskills={allskills}
            requiredskills={requiredSkills}
            setRequiredskills={setRequiredSkills}
        />
    );
}

export default JobAdSkillLoader;
