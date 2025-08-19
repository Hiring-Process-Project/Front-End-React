import React, { useState, useMemo } from 'react';
import { Badge, Button, Input, Row, Col } from 'reactstrap';
import './SkillSelector.css';

function SkillSelector({ allskills, requiredskills, setRequiredskills }) {
    const [searchText, setSearchText] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const filteredSkills = useMemo(() => {
        const lower = (searchText ?? "").toLowerCase();
        return allskills.filter(skill => {
            const skillName = typeof skill === "string" ? skill : skill?.title ?? "";
            return (
                skillName.toLowerCase().includes(lower) &&
                !requiredskills.some(s => {
                    const reqName = typeof s === "string" ? s : s?.title ?? "";
                    return reqName === skillName;
                })
            );
        });
    }, [searchText, allskills, requiredskills]);

    const handleSelect = (skill) => {
        setRequiredskills([...requiredskills, skill]);
        setSearchText('');
        setDropdownVisible(false);
    };

    const handleRemove = (skill) => {
        setRequiredskills(requiredskills.filter(s => {
            const nameS = typeof s === "string" ? s : s?.title ?? "";
            const nameSkill = typeof skill === "string" ? skill : skill?.title ?? "";
            return nameS !== nameSkill;
        }));
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
                        <div
                            className="boxStyle"
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
                                onFocus={() => setDropdownVisible(true)}
                                placeholder="Search and add skills..."
                                onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
                            />

                            {dropdownVisible && (
                                <div className="dropdown-suggestions">
                                    {filteredSkills.length > 0 ? (
                                        filteredSkills.map((skill, index) => {
                                            const skillName =
                                                typeof skill === "string" ? skill : skill?.title ?? "";
                                            return (
                                                <div
                                                    key={index}
                                                    className="dropdown-item-skill"
                                                    onClick={() => handleSelect(skill)}
                                                >
                                                    {skillName}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="dropdown-item-skill no-match">
                                            No match
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="selected-skills-container mt-3">
                                {requiredskills.map((skill, index) => {
                                    const skillName =
                                        typeof skill === "string" ? skill : skill?.title ?? "";
                                    return (
                                        <Badge
                                            key={index}
                                            color="info"
                                            pill
                                            className="skill-badge"
                                        >
                                            {skillName}
                                            <Button
                                                close
                                                className="badge-close"
                                                onClick={() => handleRemove(skill)}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default SkillSelector;
