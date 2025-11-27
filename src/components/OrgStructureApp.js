import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import OrganizationsSidebar from "./OrganizationsSidebar";
import OrgHeader from "./OrgHeader";

const BASE_URL = "http://localhost:8087/api/v1/organisations";

const OrgStructureApp = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔥 Fetch organizations from backend
    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const res = await fetch(BASE_URL, { cache: "no-store" });

            if (!res.ok) throw new Error("Failed to fetch organisations");

            const data = await res.json();
            setOrganizations(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load organisations.");
        } finally {
            setLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        loadOrganizations();
    }, []);

    return (
        <Container fluid className="mt-4">
            <Row>
                <OrgHeader />

                {/* LEFT PANEL */}
                <OrganizationsSidebar
                    organizations={organizations}
                    selectedOrganizationId={selectedOrg?.id}
                    onOrganizationSelect={setSelectedOrg}
                    onCreateNew={() => alert("Create new organization")}
                />

                {/* RIGHT PANEL */}
                <Col md="8" className="p-4">
                    {loading ? (
                        <h4>Loading organizations...</h4>
                    ) : error ? (
                        <div>
                            <h4 style={{ color: "red" }}>{error}</h4>
                            <button onClick={loadOrganizations}>Retry</button>
                        </div>
                    ) : !selectedOrg ? (
                        <h4>Select an Organization</h4>
                    ) : (
                        <div>
                            <h3>{selectedOrg.name}</h3>
                            <p>Here you will see departments, structure, options, etc.</p>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default OrgStructureApp;
