import React from 'react';
import { Card, CardBody, Col, Row, Button } from 'reactstrap';
import OccupationSelector from './OccupationSelector';
import ActiveAd from './ActiveAd';

const SidebarCard = ({ occupations }) => {
    const [activeads] = React.useState(["1", "3", "1", "2"]);
    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', height: '450px' }}>
                <CardBody>
                    <Row>
                        <OccupationSelector occupations={occupations} />
                        <ActiveAd activeads={activeads} />
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
