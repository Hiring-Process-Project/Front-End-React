// SearchSkills.jsx
import { useState, useMemo } from 'react';
import { Col, Row } from 'reactstrap';
import SearchBar from '../SearchBar';
import Skills from './Skills';

function SearchSkills({ allskills, onSkillClick }) {
    const [searchText, setSearchText] = useState('');

    const filteredSkills = useMemo(() => {
        if (!searchText) return allskills;
        const lowerSearch = searchText.toLowerCase();
        const startsWith = allskills.filter((skill) => skill.toLowerCase().startsWith(lowerSearch));
        const includes = allskills.filter(
            (skill) => !skill.toLowerCase().startsWith(lowerSearch) && skill.toLowerCase().includes(lowerSearch)
        );
        return [...startsWith, ...includes];
    }, [searchText, allskills]);

    return (
        <Col md="6">
            <Row className="mb-2" style={{ paddingLeft: '20px' }}>
                <Col>
                    <label className="description-labels">Search:</label>
                </Col>
            </Row>

            <Row>
                <Col>
                    <div className="boxStyle" style={{ minHeight: '300px', padding: '12px', overflow: 'hidden' }}>
                        <Col style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                            <Row>
                                <Col xs="3">
                                    <label className="search-label">Skills:</label>
                                </Col>
                                <Col xs="9">
                                    <SearchBar value={searchText} onChange={setSearchText} />
                                </Col>
                            </Row>

                            <Row style={{ flex: 1, minHeight: 0 }}>
                                <Col style={{ alignItems: 'center', height: '100%', minHeight: 0, overflowY: 'auto' }}>
                                    <Skills requiredskills={filteredSkills} onSkillClick={onSkillClick} />
                                </Col>
                            </Row>
                        </Col>
                    </div>
                </Col>
            </Row>
        </Col>
    );
}

export default SearchSkills;
