import React from 'react';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import SidebarCard from './LeftCard/SidebarCard';
import Description from './Description/Description';
import RequiredSkills from './Description/RequiredSkills';
import SearchSkills from './Description/SearchSkills';
import DescriptionButtons from './Description/DescriptionButtons';
import Header from './Header/Header';
import InterviewSteps from './InterviewSteps'
import SkillSelector from './Description/SkillSelector';




export default function MyGridLayout() {
    const [occupations] = React.useState([
        "Back-End Developer:", "Web Developer:", "Mobile Developer:", "Android Developer:"
    ]);

    const [requiredSkills, setRequiredSkills] = React.useState([]);

    const [allskills, setAllSkills] = React.useState(["JavaScript", "CSS", "React"]);
    // const [requiredskills, setRequiredSkills] = React.useState(["Java", "Python", "SQL"]);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [interviewdescription] = React.useState(["Interview Description"]);
    const [allstepskills, setAllstepSkills] = React.useState(["HTML", "CSS"]);
    const [requiredstepskills, setRequiredstepSkills] = React.useState(["Git"]);
    const [interviewsteps] = React.useState(["Step 1", "Step 2", "Step 3", "Step4"]);
    const [category] = React.useState(["Introduction", "Skill Assesment", "Team Leader"]);


    const moveSkill = (skill, fromList, toList, setFromList, setToList) => {
        if (!toList.includes(skill)) {
            setToList([...toList, skill]);
            setFromList(fromList.filter(s => s !== skill));
        }
    };



    // const addSkillToRequired = (skill) =>
    //     moveSkill(skill, allskills, requiredskills, setAllSkills, setRequiredSkills);

    // const removeSkillFromRequired = (skill) =>
    //     moveSkill(skill, requiredskills, allskills, setRequiredSkills, setAllSkills);


    const addstepSkillToRequired = (skill) => {
        moveSkill(skill, allstepskills, requiredstepskills, setAllstepSkills, setRequiredstepSkills);
    };
    const removestepSkillFromRequired = (skill) => {
        moveSkill(skill, requiredstepskills, allstepskills, setRequiredstepSkills, setAllstepSkills);
    };




    return (
        <div>
            <Header setSelectedTab={setSelectedTab} />
            <div style={{ padding: '2rem', paddingTop: "20px" }}>
                <Row>
                    <SidebarCard occupations={occupations} />

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
                                                <Col md="6">
                                                    <SkillSelector
                                                        allskills={allskills}
                                                        requiredskills={requiredSkills}
                                                        setRequiredskills={setRequiredSkills}
                                                    />
                                                </Col>

                                                <Col md="6"> </Col>
                                            </Row>
                                            <Row>
                                                <DescriptionButtons />
                                            </Row>

                                        </Col>
                                    </Row>
                                )}



                                {selectedTab === 'interview' && (
                                    <Row className="g-3">
                                        <Col md="4">
                                            <label className="description-labels" style={{ paddingLeft: '10px', marginBottom: '14px' }}>{"Interview Steps"}</label>
                                            <div className="boxStyle" style={{ minHeight: '370px', overflow: 'hidden' }}>
                                                <InterviewSteps interviewsteps={interviewsteps} category={category} />
                                            </div>
                                        </Col>
                                        <Col md="8">
                                            <Row className="g-3">
                                                <Col md="4">
                                                    <Description description={interviewdescription} />
                                                </Col>
                                                <Col md="8">
                                                    <Row className="g-3" >
                                                        <RequiredSkills requiredskills={requiredstepskills} onSkillRemove={removestepSkillFromRequired} />
                                                        <SearchSkills allskills={allstepskills} onSkillClick={addstepSkillToRequired} />

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
                                    <Row>
                                        <Col>
                                            <h5>Candidates Section</h5>
                                            <div className="boxStyle">List of candidates here...</div>
                                        </Col>
                                    </Row>
                                )}

                                {selectedTab === 'assessment' && (
                                    <Row>
                                        <Col>
                                            <h5>Assessment Section</h5>
                                            <div className="boxStyle">Assessment content here...</div>
                                        </Col>
                                    </Row>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

