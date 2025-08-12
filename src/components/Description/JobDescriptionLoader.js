import React, { useEffect, useState } from 'react';
import Description from './Description';

function JobDescriptionLoader({ jobAdId }) {
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!jobAdId) return;

        fetch(`http://localhost:8087/jobAds/details?jobAdId=${jobAdId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch job description");
                return res.json();
            })
            .then(data => {
                setDescription(data.description || "");
            })
            .catch(err => {
                console.error(err);
                setError("Could not load description");
            });
    }, [jobAdId]);

    const handleDescriptionChange = (newValue) => {
        setDescription(newValue);
    };

    if (!jobAdId) {
        return <p style={{ padding: '1rem' }}>Select a job ad to view description.</p>;
    }

    if (error) {
        return <p style={{ padding: '1rem', color: 'red' }}>{error}</p>;
    }

    return (
        <Description
            name="Description"
            description={description}
            onDescriptionChange={handleDescriptionChange}
        />
    );
}

export default JobDescriptionLoader;
