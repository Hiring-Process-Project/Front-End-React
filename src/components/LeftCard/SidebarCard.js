import React, { useEffect, useState } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";

const SidebarCard = ({ onJobAdSelect, selectedJobAdId, baseUrl = "http://localhost:8087" }) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleCreate = () => setIsCreateOpen(v => !v);

    const loadDepartments = async () => {
        try {
            const res = await fetch(`${baseUrl}/jobAds`);
            const data = await res.json();
            const grouped = data.reduce((acc, item) => {
                const { departmentName, occupationName, jobTitle, id, status } = item;
                if (!acc[departmentName]) acc[departmentName] = {};
                if (!acc[departmentName][occupationName]) acc[departmentName][occupationName] = [];
                acc[departmentName][occupationName].push({ id, title: jobTitle, status });
                return acc;
            }, {});
            const final = Object.entries(grouped).map(([department, occs]) => ({
                department,
                occupations: Object.entries(occs).map(([name, jobTitles]) => ({ name, jobTitles })),
            }));
            setDepartments(final);
            setError(null);
        } catch (err) {
            setError(err);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleCreated = async (created) => {
        await loadDepartments();
        if (created?.id) onJobAdSelect(created.id);
        setIsCreateOpen(false);
    };

    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: "#F6F6F6", height: "450px" }}>
                <CardBody>
                    <Row>
                        {error ? (
                            <p>Error loading departments...</p>
                        ) : (
                            <OccupationSelector
                                Name="Departments"
                                departments={departments}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}
                            />
                        )}
                    </Row>
                    <Row className="mt-3">
                        <Col className="text-center">
                            <Button color="secondary" onClick={toggleCreate}>Create New</Button>
                        </Col>
                    </Row>
                    <CreateJobAd
                        isOpen={isCreateOpen}
                        toggle={toggleCreate}
                        baseUrl={baseUrl}
                        onCreated={handleCreated}
                    />
                </CardBody>
            </Card>
        </Col>
    );
};

export default SidebarCard;
