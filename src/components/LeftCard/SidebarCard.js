// SidebarCard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";

const DEFAULT_BASE = "http://localhost:8087";

const SidebarCard = ({
    onJobAdSelect,
    selectedJobAdId,
    baseUrl = DEFAULT_BASE,
    reloadKey = 0,

    // Department scope (προαιρετικά)
    onDepartmentSelect,
    selectedDepartmentId = null,

    // Occupation scope (προαιρετικά)
    onOccupationSelect,
    selectedOccupationId = null,
}) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleCreate = () => setIsCreateOpen((v) => !v);

    const loadDepartments = useCallback(async () => {
        try {
            // 1) Job Ads (summary)
            const jobsRes = await fetch(`${baseUrl}/jobAds`, { cache: "no-store" });
            if (!jobsRes.ok) throw new Error("Failed to fetch job ads");
            const jobs = await jobsRes.json(); // [{id, jobTitle, occupationName, status, departmentName}]

            // 2) Πάρε name→id για departments & occupations
            let deptNameToId = new Map();
            let occNameToId = new Map();

            // Departments (names)
            try {
                const depRes = await fetch(`${baseUrl}/api/v1/departments/names`, { cache: "no-store" });
                if (depRes.ok) {
                    const depList = await depRes.json(); // [{id,name}]
                    deptNameToId = new Map(depList.map((d) => [d.name, d.id]));
                }
            } catch { /* ignore, θα μείνουν null ids */ }

            // Occupations (names)
            try {
                const occRes = await fetch(`${baseUrl}/api/v1/occupations/names`, { cache: "no-store" });
                if (occRes.ok) {
                    const occList = await occRes.json(); // [{id,name}]
                    occNameToId = new Map(occList.map((o) => [o.name, o.id]));
                }
            } catch { /* ignore */ }

            // 3) Grouping σε Department → Occupation → JobTitles
            const grouped = jobs.reduce((acc, item) => {
                const deptName = item.departmentName || "Unassigned";
                const deptId = deptNameToId.get(deptName) ?? null;

                const occName = item.occupationName || "Other";
                const occId = occNameToId.get(occName) ?? null;

                if (!acc[deptName]) acc[deptName] = { id: deptId, occupations: {} };
                if (!acc[deptName].occupations[occName]) {
                    acc[deptName].occupations[occName] = { id: occId, jobTitles: [] };
                }
                acc[deptName].occupations[occName].jobTitles.push({
                    id: item.id,
                    title: item.jobTitle,
                    status: item.status,
                });
                return acc;
            }, {});

            // 4) Μετατροπή σε array για το UI
            const final = Object.entries(grouped).map(([deptName, v]) => ({
                department: deptName,
                departmentId: v.id,
                occupations: Object.entries(v.occupations).map(([name, info]) => ({
                    id: info.id,
                    name,
                    jobTitles: info.jobTitles,
                })),
            }));

            setDepartments(final);
            setError(null);
        } catch (err) {
            console.error(err);
            setDepartments([]);
            setError(err);
        }
    }, [baseUrl]);

    // Φόρτωση στην αρχή & σε reloadKey αλλαγές
    useEffect(() => {
        loadDepartments();
    }, [loadDepartments, reloadKey]);

    // Refresh όταν γίνει publish/αλλαγή job ad (π.χ. από Description)
    useEffect(() => {
        const onUpdated = () => loadDepartments();
        window.addEventListener("hf:jobad-updated", onUpdated);
        return () => window.removeEventListener("hf:jobad-updated", onUpdated);
    }, [loadDepartments]);

    const handleCreated = async (created) => {
        await loadDepartments();
        if (created?.id) onJobAdSelect?.(created.id);
        setIsCreateOpen(false);
    };

    // Όταν επιλέγεται occupation, καθάρισε το επιλεγμένο job
    const handleOccupationSelect = (occ) => {
        onOccupationSelect?.(occ);
        onJobAdSelect?.(null);
    };

    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: "#F6F6F6", height: "450px" }}>
                <CardBody>
                    <Row>
                        {error ? (
                            <div className="text-center" style={{ width: "100%" }}>
                                <p>Σφάλμα φόρτωσης.</p>
                                <Button size="sm" color="secondary" onClick={loadDepartments}>
                                    Retry
                                </Button>
                            </div>
                        ) : (
                            <OccupationSelector
                                Name="Departments"
                                departments={departments}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}

                                // Department scope
                                onDepartmentSelect={onDepartmentSelect}
                                selectedDepartmentId={selectedDepartmentId}

                                // Occupation scope
                                onOccupationSelect={handleOccupationSelect}
                                selectedOccupationId={selectedOccupationId}
                            />
                        )}
                    </Row>

                    <Row className="mt-3">
                        <Col className="text-center">
                            <Button color="secondary" onClick={toggleCreate}>
                                Create New
                            </Button>
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
