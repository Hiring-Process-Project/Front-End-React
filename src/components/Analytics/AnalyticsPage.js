import React, { useState } from 'react';
import Analytics from '../components/Analytics';
import DepartmentsSidebar from '../components/DepartmentsSidebar';

export default function AnalyticsPage({
    apiBase = 'http://localhost:8087/api',
    orgId = 3,
    // Αν έχεις ήδη τα departments αλλού, πέρασέ τα από τον γονέα.
    // Αλλιώς, χρησιμοποιούμε fallback από τα seed ids/names σου.
    departments = [
        { id: 4, name: 'Engineering' },
        { id: 5, name: 'HR' },
        { id: 6, name: 'Data Science' },
    ],
}) {
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedOccupation, setSelectedOccupation] = useState(null);
    const [selectedJobAd, setSelectedJobAd] = useState(null);

    const handleSelectDepartment = (dept) => {
        setSelectedDepartment(dept);   // { id, name }
        setSelectedOccupation(null);   // reset κατώτερα επίπεδα
        setSelectedJobAd(null);
    };

    const clearToOrganization = () => {
        setSelectedDepartment(null);
        setSelectedOccupation(null);
        setSelectedJobAd(null);
    };

    return (
        <div className="row">
            <div className="col-4">
                <DepartmentsSidebar
                    departments={departments}
                    selectedDepartmentId={selectedDepartment?.id ?? null}
                    onSelectDepartment={handleSelectDepartment}
                    onClearOrganization={clearToOrganization}
                />
            </div>

            <div className="col-8">
                <Analytics
                    orgId={orgId}
                    apiBase={apiBase}
                    departmentData={selectedDepartment}  // <<— αυτό κάνει το scope = "department"
                    occupationData={selectedOccupation}
                    jobAdData={selectedJobAd}
                />
            </div>
        </div>
    );
}
