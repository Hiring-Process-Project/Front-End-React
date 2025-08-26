// YGrid.jsx
import React from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';

import SidebarCard from './LeftCard/SidebarCard';
import Header from './Header/Header';
import Candidates from './Candidates/Candidates';
import Result from './Result/Result';            // αν δεν το χρησιμοποιείς, μπορείς να το αφαιρέσεις
import Questions from './Questions/Questions';   // top-level διαχείριση ερωτήσεων (όχι analytics)
import Interview from './Interview/Interview';
import DescriptionCard from './Description/DescriptionCard';
import Hire from './Hire/Hire';
import Analytics from './Analytics/Analytics';

export default function YGrid() {
    const [allskills, setAllSkills] = React.useState(['JavaScript', 'CSS', 'React']);
    const [selectedTab, setSelectedTab] = React.useState('description');

    const [selectedJobAdId, setSelectedJobAdId] = React.useState(null);

    // Department & Occupation scope
    const [selectedDepartment, setSelectedDepartment] = React.useState(null); // { id, name }
    const [selectedOccupation, setSelectedOccupation] = React.useState(null); // { id, name, departmentId }

    const [reloadKey, setReloadKey] = React.useState(0);

    React.useEffect(() => {
        fetch('http://localhost:8087/skills')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch all skills');
                return res.json();
            })
            .then((data) => {
                const skillNames = data.map((skill) => skill.name);
                setAllSkills(skillNames);
            })
            .catch(console.error);
    }, []);

    // Debug (optional)
    React.useEffect(() => {
        console.log('[YGRID] selectedJobAdId:', selectedJobAdId);
        console.log('[YGRID] selectedDepartment:', selectedDepartment);
        console.log('[YGRID] selectedOccupation:', selectedOccupation);
    }, [selectedJobAdId, selectedDepartment, selectedOccupation]);

    const handleJobAdDeleted = () => {
        setSelectedJobAdId(null);
        setReloadKey((k) => k + 1);
    };

    const handleDepartmentSelect = (dept) => {
        setSelectedDepartment(dept);
        setSelectedOccupation(null);
    };

    const handleOccupationSelect = (occ) => {
        setSelectedOccupation({
            ...occ,
            departmentId: occ.departmentId ?? selectedDepartment?.id ?? null,
        });
    };

    const handleBackToOrganization = () => {
        setSelectedDepartment(null);
        setSelectedOccupation(null);
    };

    // Props προς Analytics ώστε να λειτουργούν ΟΛΑ τα scopes
    const analyticsProps = {
        orgId: 3,
        apiBase: 'http://localhost:8087/api',
        departmentData: selectedDepartment,                      // { id, name }
        occupationData: selectedOccupation,                      // { id, name, departmentId }
        jobAdData: selectedJobAdId ? { id: selectedJobAdId } : null, // { id }
    };

    return (
        <div>
            <Header setSelectedTab={setSelectedTab} />
            <div style={{ padding: '2rem', paddingTop: '20px' }}>
                <Row>
                    <SidebarCard
                        onJobAdSelect={setSelectedJobAdId}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                        // Department scope
                        onDepartmentSelect={handleDepartmentSelect}
                        onClearOrganization={handleBackToOrganization}
                        selectedDepartmentId={selectedDepartment?.id ?? null}
                        // Occupation scope
                        onOccupationSelect={handleOccupationSelect}
                        selectedOccupationId={selectedOccupation?.id ?? null}
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

                                {/* Διαχείριση ερωτήσεων (όχι analytics). Τα analytics της ερώτησης είναι στο Analytics → Questions */}
                                {selectedTab === 'questions' && <Questions selectedJobAdId={selectedJobAdId} />}

                                {selectedTab === 'interview' && <Interview selectedJobAdId={selectedJobAdId} />}

                                {selectedTab === 'candidates' && (
                                    <Candidates key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'analytics' && (
                                    <Analytics {...analyticsProps} />
                                )}

                                {selectedTab === 'hire' && (
                                    <Hire key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                )}

                                {/* Αν χρησιμοποιείς Result κάπου, βάλ' το εδώ */}
                                {selectedTab === 'result' && <Result jobAdId={selectedJobAdId} />}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
