import { Col, Row } from 'reactstrap';
import SearchBar from '../SearchBar';
import Skills from './Skills';

function SearchSkills({ allskills, onSkillClick }) {
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
                        <Col>
                            <Row>
                                <Col xs="3" >
                                    <label className="search-label">Skills:</label>
                                </Col>
                                <Col xs="9" >
                                    <SearchBar />
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{ alignItems: 'center' }}>
                                    <Skills requiredskills={allskills} onSkillClick={onSkillClick} />
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
