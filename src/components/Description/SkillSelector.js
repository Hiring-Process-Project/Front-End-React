import React, { useState, useMemo } from 'react';
import { Badge, Button, Input, Row, Col } from 'reactstrap';
import './SkillSelector.css';

function SkillSelector({ allskills, requiredskills, setRequiredskills, panelHeight }) {
    const [searchText, setSearchText] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const filteredSkills = useMemo(() => {
        const lower = (searchText ?? '').toLowerCase();
        return allskills.filter((skill) => {
            const skillName = typeof skill === 'string' ? skill : skill?.title ?? '';
            return (
                skillName.toLowerCase().includes(lower) &&
                !requiredskills.some((s) => {
                    const reqName = typeof s === 'string' ? s : s?.title ?? '';
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
        setRequiredskills(
            requiredskills.filter((s) => {
                const nameS = typeof s === 'string' ? s : s?.title ?? '';
                const nameSkill = typeof skill === 'string' ? skill : skill?.title ?? '';
                return nameS !== nameSkill;
            })
        );
    };

    return (
        <Row style={{ height: '100%', minHeight: 0 }}>
            <Col>
                <Row className="mb-2" style={{ paddingLeft: 10 }}>
                    <Col>
                        <label className="description-labels">Skills:</label>
                    </Col>
                </Row>

                <Row style={{ height: 'calc(100% - 28px)', minHeight: 0 }}>
                    <Col style={{ minHeight: 0 }}>
                        <div
                            className="boxStyle"
                            style={{
                                /* ΚΑΘΑΡΟ ύψος που έρχεται από τον γονέα */
                                height: panelHeight ?? '100%',
                                minHeight: 0,
                                overflow: 'hidden',
                                padding: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            {/* Search input (σταθερό ύψος) */}
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
                                style={{ flex: '0 0 38px', minHeight: 38 }}
                            />

                            {dropdownVisible && (
                                <div className="dropdown-suggestions">
                                    {filteredSkills.length > 0 ? (
                                        filteredSkills.map((skill, index) => {
                                            const skillName = typeof skill === 'string' ? skill : skill?.title ?? '';
                                            return (
                                                <div
                                                    key={index}
                                                    className="dropdown-item-skill"
                                                    onClick={() => handleSelect(skill)}
                                                    title={skillName}
                                                >
                                                    <span className="dropdown-item-skill-text">{skillName}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="dropdown-item-skill no-match">No match</div>
                                    )}
                                </div>
                            )}

                            {/* ΜΟΝΟΣ scroller */}
                            <div
                                className="selected-skills-container"
                                style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
                            >
                                {requiredskills.map((skill, index) => {
                                    const skillName = typeof skill === 'string' ? skill : skill?.title ?? '';
                                    return (
                                        <Badge key={index} color="info" pill className="skill-badge">
                                            <span className="skill-badge-text" title={skillName}>
                                                {skillName}
                                            </span>
                                            <Button close className="badge-close" onClick={() => handleRemove(skill)} />
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
