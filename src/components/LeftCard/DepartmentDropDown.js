import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import OccupationDropdown from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown({ departments, onJobAdSelect, selectedJobAdId }) {
    const [openDepartmentIndex, setOpenDepartmentIndex] = useState(null);

    const toggleDepartment = (index) => {
        setOpenDepartmentIndex(openDepartmentIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            <div className="scroll-wrapper">
                {departments.map((dept, index) => (
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
                            <OccupationDropdown
                                occupations={dept.occupations}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}
                            />

                        </Collapse>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DepartmentDropdown;
