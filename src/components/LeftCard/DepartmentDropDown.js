import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import OccupationDropdown from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown({ departments }) {
    const [openDepartmentIndex, setOpenDepartmentIndex] = useState(null);

    const toggleDepartment = (index) => {
        setOpenDepartmentIndex(openDepartmentIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            {departments.map((dept, index) => {
                const total = dept.occupations.reduce(
                    (acc, occ) => acc + occ.jobTitles.length,
                    0
                );
                const published = dept.occupations.reduce(
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
