// RequiredSkills.jsx
import { Col, Row, Button } from 'reactstrap';
import Skills from './Skills';
import './skills.css';
import React, { useState } from 'react';

function RequiredSkills({ requiredskills, onSkillRemove }) {
    const [selectedSkill, setSelectedSkill] = useState(null);

    const handleSkillClick = (skill) => {
        setSelectedSkill(skill === selectedSkill ? null : skill);
    };

    const handleDelete = () => {
        if (selectedSkill) {
            onSkillRemove(selectedSkill);
            setSelectedSkill(null);
        }
    };

    return (
        <Col md="6">
            <Row className="mb-2" style={{ paddingLeft: '20px' }}>
                <Col>
                    <label className="description-labels">Required Skills:</label>
                </Col>
            </Row>

            <Row>
                <Col>
                    <div
                        className="boxStyle"
                        style={{
                            minHeight: '300px',
                            padding: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                            <Skills
                                requiredskills={requiredskills}
                                onSkillClick={handleSkillClick}
                                selectedSkill={selectedSkill}
                            />
                        </div>

                        <div className="d-flex justify-content-center" style={{ paddingTop: 12 }}>
                            <Button
                                color="secondary"
                                className="delete-btn-req"
                                onClick={handleDelete}
                                disabled={!selectedSkill}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>
        </Col>
    );
}

export default RequiredSkills;
