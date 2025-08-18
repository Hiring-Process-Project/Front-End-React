import React, { useState, useMemo } from 'react';
import { Badge, Input, Row, Col } from 'reactstrap';
import './SkillSelector.css';

function SkillSelectorReadOnly({ requiredskills = [] }) {
    const [searchText, setSearchText] = useState('');

    const filteredSkills = useMemo(() => {
        const lower = searchText.trim().toLowerCase();
        if (!lower) return requiredskills;
        return requiredskills.filter((skill) =>
            (skill || '').toLowerCase().includes(lower)
        );
    }, [searchText, requiredskills]);

    return (
        <Row>
            <Col>
                <Row className="mb-2" style={{ paddingLeft: '10px' }}>
                    <Col>
                        <label className="description-labels">Skills:</label>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <div
                            className="boxStyle"
                            style={{
                                minHeight: '280px',
                                overflow: 'hidden',
                                padding: '10px',
                            }}
                        >
                            <Input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search within required skills..."
                            />

                            <div className="selected-skills-container mt-3">
                                {filteredSkills.length > 0 ? (
                                    filteredSkills.map((skill, index) => (
                                        <Badge key={index} color="info" pill className="skill-badge">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="description-labels">No skills match.</span>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default SkillSelectorReadOnly;
