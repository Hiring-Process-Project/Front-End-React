import React, { useState, useEffect } from 'react';
import { Collapse, Button } from 'reactstrap';
import OccupationDropdown from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown() {
    const [departments, setDepartments] = useState([]);
    const [openDepartmentIndex, setOpenDepartmentIndex] = useState(null);

    const toggleDepartment = (index) => {
        setOpenDepartmentIndex(openDepartmentIndex === index ? null : index);
    };
    useEffect(() => {
        fetch('http://localhost:8087/summaries') // <-- ΝΕΟ endpoint
            .then(res => res.json())
            .then(data => {
                // Ομαδοποίηση κατά department → occupation → jobTitles
                const grouped = data.reduce((acc, item) => {
                    const { departmentName, occupationName, jobTitle } = item;

                    // Βρες ή φτιάξε department
                    if (!acc[departmentName]) {
                        acc[departmentName] = {};
                    }

                    // Βρες ή φτιάξε occupation
                    if (!acc[departmentName][occupationName]) {
                        acc[departmentName][occupationName] = [];
                    }

                    // Πρόσθεσε jobTitle
                    acc[departmentName][occupationName].push({
                        title: jobTitle,
                        status: "Published" // Ή "Pending", ή ό,τι έχεις
                    });

                    return acc;
                }, {});

                // Μετατροπή του grouped σε array κατάλληλο για το UI σου
                const final = Object.entries(grouped).map(([department, occs]) => ({
                    department,
                    occupations: Object.entries(occs).map(([name, jobTitles]) => ({
                        name,
                        jobTitles
                    }))
                }));

                setDepartments(final);
            })
            .catch(err => console.error("Failed to fetch department data:", err));
    }, []);

    return (
        <div className="occupation-container">
            {departments.map((dept, index) => {
                const total = (dept.occupations || []).reduce(
                    (acc, occ) => acc + occ.jobTitles.length,
                    0
                );
                const published = (dept.occupations || []).reduce(
                    (acc, occ) =>
                        acc + occ.jobTitles.filter((j) => j.status === 'Published').length,
                    0
                );

                return (
                    <div key={index} className="occupation-box">
                        <Button
                            onClick={() => toggleDepartment(index)}
                            className="department-btn"
                            block
                        >
                            <div className="department-header">
                                <span>{dept.department}</span>
                            </div>
                        </Button>

                        <Collapse isOpen={openDepartmentIndex === index}>
                            <OccupationDropdown occupations={dept.occupations} />
                        </Collapse>
                    </div>
                );
            })}
        </div>
    );
}

export default DepartmentDropdown;
