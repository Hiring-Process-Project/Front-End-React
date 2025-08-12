import React from 'react';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import SidebarCard from './LeftCard/SidebarCard';
import Description from './Description/Description';
import DescriptionButtons from './Description/DescriptionButtons';
import Header from './Header/Header';
import InterviewSteps from './InterviewSteps'
import SkillSelector from './Description/SkillSelector';
<<<<<<< HEAD
import Candidates from './Candidates/Candidates';
import Result from './Result/Result';
=======
import Questions from './Questions/Questions';



>>>>>>> 20f39ce6f9af82d34795c1979c4d7e70d3f3c143

export default function MyGridLayout() {


    const [requiredSkills, setRequiredSkills] = React.useState([]);

    const [allskills, setAllSkills] = React.useState(["JavaScript", "CSS", "React"]);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [interviewdescription] = React.useState(["Interview Description"]);
    const [allstepskills, setAllstepSkills] = React.useState(["HTML", "CSS"]);
    const [requiredstepskills, setRequiredstepSkills] = React.useState(["Git"]);
    const [interviewsteps] = React.useState(["Step 1", "Step 2", "Step 3"]);
    const [category] = React.useState(["Introduction", "Skill Assesment", "Team Leader"]);




    return (
        <div>
            <Header setSelectedTab={setSelectedTab} />
            <div style={{ padding: '2rem', paddingTop: "20px" }}>
                <Row>
                    <SidebarCard />

                    <Col md="8">
                        <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', minHeight: '450px' }}>
                            <CardBody>
                                {selectedTab === 'description' && (
                                    <Row className="g-3">
                                        <Col md="6" >
                                            <Description description={["Job Description"]} />
                                        </Col>
                                        <Col md="6">
                                            <Row>
                                                <Col >
                                                    <SkillSelector
                                                        allskills={allskills}
                                                        requiredskills={requiredSkills}
                                                        setRequiredskills={setRequiredSkills}
                                                    />
                                                </Col>

                                            </Row>
                                            <Row>
                                                <DescriptionButtons />
                                            </Row>

                                        </Col>
                                    </Row>
                                )}

                                {selectedTab === 'questions' && (
                                    <Questions />
                                )}



                                {selectedTab === 'interview' && (
                                    <Row className="g-3">
                                        <Col md="5">
                                            <label className="description-labels" style={{ paddingLeft: '10px', marginBottom: '14px' }}>{"Interview Steps"}</label>
                                            <div className="boxStyle" style={{ minHeight: '370px', overflow: 'hidden' }}>
                                                <InterviewSteps interviewsteps={interviewsteps} category={category} />
                                            </div>
                                        </Col>
                                        <Col md="7">
                                            <Row className="g-3">
                                                <Col md="7">
                                                    <Description description={interviewdescription} />
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
                                )}

                                {selectedTab === 'candidates' && (
                                    <div>
                                        <Candidates />

                                    </div>
                                )}


                                {selectedTab === 'assessment' && (
                                    <Result />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

