import React, { useState, useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import DepartmentDropdown from './DepartmentDropDown';

function OccupationSelector({
    Name,
    departments = [],
    onJobAdSelect,
    selectedJobAdId,

    // Department scope
    onDepartmentSelect,
    selectedDepartmentId = null,

    // Occupation scope
    onOccupationSelect,
    selectedOccupationId = null,
}) {
    const [searchText, setSearchText] = useState('');

    const filteredDepartments = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return departments;
        return departments
            .map((dept) => ({
                ...dept,
                occupations: (dept.occupations || []).filter((occ) => String(occ.name || '').toLowerCase().includes(q)),
            }))
            .filter((dept) => (dept.occupations || []).length > 0);
    }, [departments, searchText]);

    return (
        <Col
            style={{
                height: '350px',
                paddingRight: '0.5rem',
                paddingLeft: '0.5rem',
                marginRight: '16px',
                marginLeft: '8px',
                overflow: 'hidden',
                paddingTop: '5px',
            }}
        >
            <Row style={{ borderBottom: '1px solid #B7BABC' }}>
                <Col md="4">
                    <label className="search-label">{Name}</label>
                </Col>
                <Col md="8">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
            </Row>

            <DepartmentDropdown
                departments={filteredDepartments}
                onJobAdSelect={onJobAdSelect}
                selectedJobAdId={selectedJobAdId}
                // Department forwards
                onDepartmentSelect={onDepartmentSelect}
                selectedDepartmentId={selectedDepartmentId}
                // Occupation forwards
                onOccupationSelect={onOccupationSelect}
                selectedOccupationId={selectedOccupationId}
            />
        </Col>
    );
}

export default OccupationSelector;
