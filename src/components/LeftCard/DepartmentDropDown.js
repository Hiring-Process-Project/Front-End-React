import React, { useState } from 'react';
import { Collapse, Button } from 'reactstrap';
import OccupationDropdown from './OccupationDropDown';
import './DepartmentDropdown.css';

function DepartmentDropdown({
    departments = [],
    onJobAdSelect,
    selectedJobAdId,
    onDepartmentSelect,
    selectedDepartmentId = null,
    onOccupationSelect,
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
        const isClosing = openDepartmentIndex === index;

        onDepartmentSelect?.({ id: dept.departmentId ?? null, name: dept.department });

        // toggle
        setOpenDepartmentIndex(isClosing ? null : index);

        // καθάρισε selections όταν κλείνει ή αλλάζει department
        onOccupationSelect?.(null);
        onJobAdSelect?.(null);
    };

    return (
        <div className="dept-root">
            {departments.map((dept, index) => {
                const isOpen = openDepartmentIndex === index;

                return (
                    <div key={`${dept.department}-${dept.departmentId ?? index}`} className="occupation-box">
                        <Button
                            onClick={() => handleDepartmentClick(dept, index)}
                            className={`department-btn ${isActiveDept(dept) ? 'active' : ''}`}
                            block
                            title="Select department"
                        >
                            <div className="department-header">
                                <span className="truncate-1">{dept.department}</span>
                            </div>
                        </Button>

                        <Collapse isOpen={isOpen}>
                            {/* 👇 ΚΡΙΣΙΜΟ: αλλάζουμε key όταν ανοίγει/κλείνει για remount */}
                            <OccupationDropdown
                                key={`${dept.departmentId ?? index}-${isOpen ? 'open' : 'closed'}`}
                                occupations={dept.occupations}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}
                                parentDepartmentId={dept.departmentId ?? selectedDepartmentId ?? null}
                                onOccupationSelect={onOccupationSelect}
                                selectedOccupationId={selectedOccupationId}
                            />
                        </Collapse>
                    </div>
                );
            })}
        </div>
    );
}

export default DepartmentDropdown;
