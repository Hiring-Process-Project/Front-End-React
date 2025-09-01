import React, { useState, useMemo } from 'react';
import { Badge, Input, Row, Col } from 'reactstrap';
import './description.css';
import './SkillSelector.css';

function SkillSelectorReadOnly({ requiredskills = [] }) {
    const [searchText, setSearchText] = useState('');
    const filteredSkills = useMemo(() => {
        const lower = searchText.trim().toLowerCase();
        return lower ? requiredskills.filter((s) => (s || '').toLowerCase().includes(lower)) : requiredskills;
    }, [searchText, requiredskills]);

    return (
        <Row style={{ height: '100%', minHeight: 0 }}>
            <Col className="desc-col">
                <Row className="mb-2 desc-label-row">
                    <Col><label className="description-labels">Skills:</label></Col>
                </Row>

                <Row style={{ height: 'calc(100% - 28px)', minHeight: 0 }}>
                    <Col className="desc-col">
                        <div className="boxStyle skills-box">
                            <Input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search within required skills..."
                            />
                            <div className="selected-skills-container mt-3 skills-scroll">
                                {filteredSkills.length ? (
                                    filteredSkills.map((skill, i) => (
                                        <Badge key={i} color="info" pill className="skill-badge">
                                            <span className="skill-badge-text" title={skill}>{skill}</span>
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
