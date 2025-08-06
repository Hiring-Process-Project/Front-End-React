import React, { useState, useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import DepartmentDropdown from './DepartmentDropDown';

function OccupationSelector({ Name, departments }) {
    const [searchText, setSearchText] = useState('');

    const filteredDepartments = useMemo(() => {
        return departments
            .map(dept => ({
                ...dept,
                occupations: dept.occupations.filter(occ =>
                    occ.name.toLowerCase().includes(searchText.toLowerCase())
                )
            }))
            .filter(dept => dept.occupations.length > 0);
    }, [departments, searchText]);

    return (
        <Col style={{
            height: '350px',
            paddingRight: '0.5rem',
            paddingLeft: '0.5rem',
            marginRight: '16px',
            marginLeft: '8px',
            overflow: 'hidden',
            paddingTop: '5px'
        }}>
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

            <DepartmentDropdown departments={filteredDepartments} />
        </Col>
    );
}

export default OccupationSelector;
