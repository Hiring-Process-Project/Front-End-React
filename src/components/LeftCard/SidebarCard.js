import React, { useEffect, useState } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";

const SidebarCard = ({
    onJobAdSelect,
    selectedJobAdId,
    baseUrl = "http://localhost:8087",
    reloadKey = 0,             // <-- ΝΕΟ: trigger για refresh από parent
}) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleCreate = () => setIsCreateOpen(v => !v);

    const loadDepartments = async () => {
        try {
            const res = await fetch(`${baseUrl}/jobAds`);
            if (!res.ok) throw new Error("Failed to fetch job ads");
            const data = await res.json();

            // Ομαδοποίηση: προφύλαξη σε null department/occupation
            const grouped = data.reduce((acc, item) => {
                const { departmentName, occupationName, jobTitle, id, status } = item;
                const dept = departmentName || "Unassigned";
                const occ = occupationName || "Other";

                if (!acc[dept]) acc[dept] = {};
                if (!acc[dept][occ]) acc[dept][occ] = [];
                acc[dept][occ].push({ id, title: jobTitle, status });
                return acc;
            }, {});

            const final = Object.entries(grouped).map(([department, occs]) => ({
                department,
                occupations: Object.entries(occs).map(([name, jobTitles]) => ({ name, jobTitles })),
            }));

            setDepartments(final);
            setError(null);
        } catch (err) {
            console.error(err);
            setDepartments([]);
            setError(err);
        }
    };

    // αρχικό load + κάθε φορά που αλλάζει το reloadKey
    useEffect(() => {
        loadDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, baseUrl]);

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
                            <div className="text-center" style={{ width: "100%" }}>
                                <p>Σφάλμα φόρτωσης.</p>
                                <Button size="sm" color="secondary" onClick={loadDepartments}>Retry</Button>
                            </div>
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
