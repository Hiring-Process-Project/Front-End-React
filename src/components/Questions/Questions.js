import React from 'react';
import { Card, CardBody, Col, Row, Button } from 'reactstrap';
import OccupationSelector from '../LeftCard/OccupationSelector';
import occupationsData from '../../data/occupations.json';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';



const Questions = () => {
    const [allstepskills, setAllstepSkills] = React.useState(["HTML", "CSS"]);
    const [requiredstepskills, setRequiredstepSkills] = React.useState(["Git"]);
    return (
        <Row>
            <Col md="5">
                <Card className="shadow-sm" style={{ backgroundColor: '#E5E7EB', height: '430px' }}>
                    <CardBody>

                        <Row className="mt-6">
                            <OccupationSelector Name="Steps" departments={[]} />
                        </Row>

                        <Row className="mt-3">
                            <Col className="text-center">
                                <Button color="secondary">Create New</Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
            <Col md="7">
                <Row className="g-3">
                    <Col md="7">
                        <Description description={["Question Description"]} />
                    </Col>
                    <Col md="5">
                        <Row className="g-3" >
                            <Col >
                                <SkillSelector
                                    allskills={allstepskills}
                                    requiredskills={requiredstepskills}
                                    setRequiredskills={setRequiredstepSkills}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <div className="d-flex justify-content-center">
                                <Button
                                    color="secondary" className='delete-btn-req' style={{ marginTop: '30px' }}>
                                    Update
                                </Button>
                            </div>
                        </Row>
                    </Col>

                </Row>
            </Col>
        </Row>
    )

}
export default Questions;