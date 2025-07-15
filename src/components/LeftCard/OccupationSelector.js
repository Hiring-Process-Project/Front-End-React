import React, { useState, useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import SearchBar from '../SearchBar';
import OccupationDropdown from './OccupationDropDown';

function OccupationSelector({ occupations }) {
    const [searchText, setSearchText] = useState('');


    const filteredOccupations = useMemo(() => {
        return occupations.filter((occ) =>
            occ.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [occupations, searchText]);

    return (
        <Col
            xs="8"
            className="boxStyle"
            style={{
                height: '350px',
                paddingRight: '0.5rem',
                paddingLeft: '0.5rem',
                marginRight: '16px',
                marginLeft: '8px',
                overflow: 'hidden'
            }}
        >
            <Row style={{ borderBottom: '1px solid #B7BABC' }}>
                <Col md="4">
                    <label className="search-label">Occupation:</label>
                </Col>
                <Col md="8">
                    <SearchBar value={searchText} onChange={setSearchText} />
                </Col>
            </Row>

            <OccupationDropdown occupations={filteredOccupations} />
        </Col>
    );
}

export default OccupationSelector;
