import React from 'react';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import SidebarCard from './LeftCard/SidebarCard';
import Header from './Header/Header';
import Candidates from './Candidates/Candidates';
import Result from './Result/Result';
import Questions from './Questions/Questions';
import Interview from './Interview/Interview';
import DescriptionCard from './Description/DescriptionCard';

export default function MyGridLayout() {

    const [allskills, setAllSkills] = React.useState(["JavaScript", "CSS", "React"]);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [selectedJobAdId, setSelectedJobAdId] = React.useState(null);

    React.useEffect(() => {
        fetch('http://localhost:8087/skills')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch all skills");
                return res.json();
            })
            .then(data => {
                const skillNames = data.map(skill => skill.name);
                setAllSkills(skillNames);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <div>
            <Header setSelectedTab={setSelectedTab} />
            <div style={{ padding: '2rem', paddingTop: "20px" }}>
                <Row>
                    <SidebarCard
                        onJobAdSelect={setSelectedJobAdId}
                        selectedJobAdId={selectedJobAdId}
                    />

                    <Col md="8">
                        <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', minHeight: '450px' }}>
                            <CardBody>
                                {selectedTab === 'description' && (
                                    <DescriptionCard selectedJobAdId={selectedJobAdId} allskills={allskills} />
                                )}

                                {selectedTab === 'questions' && (
                                    <Questions selectedJobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'interview' && (
                                    <Interview selectedJobAdId={selectedJobAdId} />
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

