import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Row, Button } from 'reactstrap';
import OccupationSelector from './OccupationSelector';

const SidebarCard = () => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8087/summaries')
            .then(res => res.json())
            .then(data => {
                const grouped = data.reduce((acc, item) => {
                    const { departmentName, occupationName, jobTitle, status } = item;
                    if (!acc[departmentName]) {
                        acc[departmentName] = {};
                    }
                    if (!acc[departmentName][occupationName]) {
                        acc[departmentName][occupationName] = [];
                    }

                    acc[departmentName][occupationName].push({ title: jobTitle, status });
                    return acc;
                }, {});

                const final = Object.entries(grouped).map(([department, occs]) => ({
                    department,
                    occupations: Object.entries(occs).map(([name, jobTitles]) => ({
                        name,
                        jobTitles
                    }))
                }));

                setDepartments(final);
            })
            .catch(err => {
                console.error("Failed to fetch departments:", err);
                setError(err);
            });
    }, []);

    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', height: '450px' }}>
                <CardBody>
                    <Row>
                        {error ? (
                            <p>Error loading departments...</p>
                        ) : (
                            <OccupationSelector Name="Departments" departments={departments} />
                        )}
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
