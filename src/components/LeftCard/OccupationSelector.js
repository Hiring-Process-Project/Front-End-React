import React from 'react';
import { Col, Row } from 'reactstrap';
import SearchBar from '../SearchBar';
import OccupationDropdown from './OccupationDropDown'



function OccupationSelector({ occupations }) {
    return (
        <Col
            xs="8" className="boxStyle"
            style={{
                height: '350px', paddingRight: '0.5rem', paddingLeft: '0.5rem', marginRight: '16px'
                , marginLeft: '8px', overflow: 'hidden'
            }}
        >
            <Row
                style={{ borderBottom: '1px solid #B7BABC' }}
            >
                <Col md="4">
                    <label className="search-label">Occupation:</label>
                </Col>
                <Col md="8">
                    <SearchBar />
                </Col>
            </Row>

            <OccupationDropdown occupations={occupations} />
        </Col>
    );
};

export default OccupationSelector;
