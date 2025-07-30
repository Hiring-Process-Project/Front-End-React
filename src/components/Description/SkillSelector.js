import React, { useState, useMemo } from 'react';
import { Badge, Button, Input, Row, Col } from 'reactstrap';
import './SkillSelector.css';

function SkillSelector({ allskills, requiredskills, setRequiredskills }) {
    const [searchText, setSearchText] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const filteredSkills = useMemo(() => {
        const lower = searchText.toLowerCase();
        return allskills.filter(skill =>
            skill.toLowerCase().includes(lower) && !requiredskills.includes(skill)
        );
    }, [searchText, allskills, requiredskills]);

    const handleSelect = (skill) => {
        setRequiredskills([...requiredskills, skill]);
        setSearchText('');
        setDropdownVisible(false);
    };

    const handleRemove = (skill) => {
        setRequiredskills(requiredskills.filter(s => s !== skill));
    };

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
                        <div className="boxStyle"
                            style={{
                                minHeight: '280px',
                                overflow: 'hidden',
                                padding: '10px'
                            }}
                        >
                            <Input
                                type="text"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    setDropdownVisible(true);
                                }}
                                placeholder="Search and add skills..."
                                onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
                            />

                            {dropdownVisible && searchText && (
                                <div className="dropdown-suggestions">
                                    {filteredSkills.length > 0 ? (
                                        filteredSkills.map((skill, index) => (
                                            <div
                                                key={index}
                                                className="dropdown-item-skill"
                                                onClick={() => handleSelect(skill)}
                                            >
                                                {skill}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="dropdown-item-skill no-match">No match</div>
                                    )}
                                </div>
                            )}

                            <div className="selected-skills-container mt-3">
                                {requiredskills.map((skill, index) => (
                                    <Badge key={index} color="info" pill className="skill-badge">
                                        {skill}
                                        <Button
                                            close
                                            className="badge-close"
                                            onClick={() => handleRemove(skill)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default SkillSelector;
