import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import OccupationDropdown from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown({
    departments = [],
    onJobAdSelect,
    selectedJobAdId,

    // Department scope
    onDepartmentSelect, // (dept) => void
    selectedDepartmentId = null,

    // Occupation scope
    onOccupationSelect, // (occ) => void
    selectedOccupationId = null,
}) {
    const [openDepartmentIndex, setOpenDepartmentIndex] = useState(null);

    const isActiveDept = (dept) => {
        if (selectedDepartmentId != null && dept.departmentId != null) {
            return Number(selectedDepartmentId) === Number(dept.departmentId);
        }
        return false;
    };

    const handleDepartmentClick = (dept, index) => {
        if (typeof onDepartmentSelect === 'function') {
            onDepartmentSelect({
                id: dept.departmentId ?? null,
                name: dept.department,
            });
        }
        setOpenDepartmentIndex(openDepartmentIndex === index ? null : index);
    };

    return (
        <div className="occupation-container">
            <div className="scroll-wrapper">
                {departments.map((dept, index) => (
                    <div key={`${dept.department}-${dept.departmentId ?? index}`} className="occupation-box">
                        <Button
                            onClick={() => handleDepartmentClick(dept, index)}
                            className={`department-btn ${isActiveDept(dept) ? 'active' : ''}`}
                            block
                            title="Select department"
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
                                // Occupation forwards (+ parent dept id for convenience)
                                parentDepartmentId={dept.departmentId ?? selectedDepartmentId ?? null}
                                onOccupationSelect={onOccupationSelect}
                                selectedOccupationId={selectedOccupationId}
                            />
                        </Collapse>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DepartmentDropdown;
