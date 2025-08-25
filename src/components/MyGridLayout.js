import React from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';
import SidebarCard from './LeftCard/SidebarCard';
import Header from './Header/Header';
import Candidates from './Candidates/Candidates';
import Result from './Result/Result';
import Questions from './Questions/Questions';
import Interview from './Interview/Interview';
import DescriptionCard from './Description/DescriptionCard';
import Hire from './Hire/Hire';
import Statistics from './Statistics/Statistics';

export default function MyGridLayout() {
    const [allskills, setAllSkills] = React.useState(["JavaScript", "CSS", "React"]);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [selectedJobAdId, setSelectedJobAdId] = React.useState(null);
    const [reloadKey, setReloadKey] = React.useState(0);

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
            .catch(console.error);
    }, []);

    // Optional log για debug
    React.useEffect(() => {
        console.log('[PARENT] selectedJobAdId:', selectedJobAdId);
    }, [selectedJobAdId]);

    // Όταν διαγραφεί ένα Job Ad, καθαρίζουμε την επιλογή
    const handleJobAdDeleted = () => {
        setSelectedJobAdId(null);   // δείχνει "Επέλεξε ένα Job Ad…"
        setReloadKey(k => k + 1);   // φρεσκάρει το sidebar
    };

    return (
        <div>
            <Header setSelectedTab={setSelectedTab} />
            <div style={{ padding: '2rem', paddingTop: "20px" }}>
                <Row>
                    <SidebarCard
                        onJobAdSelect={setSelectedJobAdId}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                    />

                    <Col md="8">
                        <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', minHeight: '450px' }}>
                            <CardBody>
                                {selectedTab === 'description' && (
                                    <DescriptionCard
                                        selectedJobAdId={selectedJobAdId}
                                        allskills={allskills}
                                        onDeleted={handleJobAdDeleted}
                                    />
                                )}

                                {selectedTab === 'questions' && (
                                    <Questions selectedJobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'interview' && (
                                    <Interview selectedJobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'candidates' && (
                                    <Candidates key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'statistics' && <Statistics />}

                                {selectedTab === 'hire' && (
                                    <Hire key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
