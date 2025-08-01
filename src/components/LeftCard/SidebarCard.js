import React, { useState } from 'react';
import { Card, CardBody, Col, Row, Button } from 'reactstrap';
import OccupationSelector from './OccupationSelector';
import OccupationDropdown from './OccupationDropDown';
import occupationsData from '../../data/occupations.json';
import activeadsdata from '../../data/activeads.json';

const SidebarCard = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleSelectItem = (occupationIndex, itemIndex) => {
        setSelectedItemIndex({ occupationIndex, itemIndex });
    };

    const handleHoverItem = (occupationIndex, itemIndex) => {
        setHoveredItemIndex({ occupationIndex, itemIndex });
    };

    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', height: '450px' }}>
                <CardBody>
                    <Row>
                        <OccupationSelector
                            occupations={occupationsData}
                            openIndex={openIndex}
                            onToggle={setOpenIndex}
                            selectedItemIndex={selectedItemIndex}
                            onSelectItem={setSelectedItemIndex}
                            hoveredItemIndex={hoveredItemIndex}
                            onHoverItem={setHoveredItemIndex}
                        />
                        <Col xs="4" className="boxStyle" style={{ height: '350px', padding: '0 0.5rem', overflow: 'hidden' }}>
                            <Row style={{ borderBottom: '1px solid #B7BABC', paddingTop: '7px', paddingBottom: '9px' }}>
                                <label className="active-label">ActiveAd:</label>
                            </Row>
                            <OccupationDropdown
                                occupations={activeadsdata}
                                openIndex={openIndex}
                                onToggle={setOpenIndex}
                                selectedItemIndex={selectedItemIndex}
                                onSelectItem={setSelectedItemIndex}
                                hoveredItemIndex={hoveredItemIndex}
                                onHoverItem={setHoveredItemIndex}
                            />
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col className="text-center">
                            <Button color="secondary">Create New</Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        </Col>
    );
};

export default SidebarCard;
