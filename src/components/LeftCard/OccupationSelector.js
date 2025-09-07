import React, { useState, useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import DepartmentDropdown from './DepartmentDropDown';
import "./sidebar.css";

function OccupationSelector({
    Name,
    departments = [],
    onJobAdSelect,
    selectedJobAdId,
    onDepartmentSelect,
    selectedDepartmentId = null,
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
                occupations: (dept.occupations || []).filter((occ) =>
                    String(occ.name || '').toLowerCase().includes(q)
                ),
            }))
            .filter((dept) => (dept.occupations || []).length > 0);
    }, [departments, searchText]);

    return (
        <Col className="d-flex flex-column occ-col" style={{ minHeight: 0 }}>
            <Row style={{ borderBottom: '1px solid #B7BABC' }} className="pb-2">
                <Col xs="12" md="6" className="mb-2 mb-md-0">
                    <label className="search-label">{Name}</label>
                </Col>
                <Col xs="12" md="6">
                    <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: '5rem' }}
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
            </Row>

            {/* εδώ ΜΗ scroll – το scroll είναι στον γονιό (.sidebar-scroll) */}
            <div style={{ flex: 1, minHeight: 0, paddingTop: 6 }}>
                <DepartmentDropdown
                    departments={filteredDepartments}
                    onJobAdSelect={onJobAdSelect}
                    selectedJobAdId={selectedJobAdId}
                    onDepartmentSelect={onDepartmentSelect}
                    selectedDepartmentId={selectedDepartmentId}
                    onOccupationSelect={onOccupationSelect}
                    selectedOccupationId={selectedOccupationId}
                />
            </div>
        </Col>
    );
}

export default OccupationSelector;
