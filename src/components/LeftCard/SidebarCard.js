import React, { useEffect, useState } from "react";
import { Card, CardBody, Col, Row, Button } from "reactstrap";
import OccupationSelector from "./OccupationSelector";
import CreateJobAd from "./CreateJobAd";

const noop = () => { };

// Fallbacks για τα seed data σου (αν λείπουν endpoints /departments και /occupations)
const FALLBACK_DEPT_NAME_TO_ID = new Map([
    ["Engineering", 4],
    ["HR", 5],
    ["Data Science", 6],
]);

const FALLBACK_OCC_NAME_TO_ID = new Map([
    ["Software Engineer", 6],
    ["HR Specialist", 7],
    ["Data Analyst", 8],
    ["Frontend Developer", 9],
    ["Recruiter", 10],
    ["Data Engineer", 11],
    ["DevOps Engineer", 12],
    ["Training Coordinator", 13],
    ["Machine Learning Engineer", 14],
]);

const SidebarCard = ({
    onJobAdSelect,
    selectedJobAdId,
    baseUrl = "http://localhost:8087",
    reloadKey = 0,

    // Department scope
    onDepartmentSelect = noop,
    onClearOrganization = noop,   // πλέον δεν χρησιμοποιείται στο header
    selectedDepartmentId = null,

    // Occupation scope
    onOccupationSelect = noop,
    selectedOccupationId = null,
}) => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const toggleCreate = () => setIsCreateOpen((v) => !v);

    const loadDepartments = async () => {
        try {
            // 1) Φέρε ΟΛΑ τα job ads (κύρια πηγή για να γεμίσει το sidebar)
            const jobsRes = await fetch(`${baseUrl}/jobAds`);
            if (!jobsRes.ok) throw new Error("Failed to fetch job ads");
            const jobs = await jobsRes.json();

            // 2) Προσπάθησε να φέρεις departments & occupations για mapping name -> id
            let deptNameToId = new Map(FALLBACK_DEPT_NAME_TO_ID);
            let occNameToId = new Map(FALLBACK_OCC_NAME_TO_ID);

            try {
                const depRes = await fetch(`${baseUrl}/departments`);
                if (depRes.ok) {
                    const depList = await depRes.json(); // [{id, name}, ...]
                    deptNameToId = new Map(depList.map((d) => [d.name, d.id]));
                }
            } catch (ignored) { }

            try {
                const occRes = await fetch(`${baseUrl}/occupations`);
                if (occRes.ok) {
                    const occList = await occRes.json(); // [{id, title/name}, ...]
                    occNameToId = new Map(
                        occList.map((o) => [(o.title ?? o.name), o.id])
                    );
                }
            } catch (ignored) { }

            // 3) Ομαδοποίηση job ads σε Department -> Occupation -> JobTitles
            const grouped = jobs.reduce((acc, item) => {
                const deptName = item.departmentName || "Unassigned";
                const deptId =
                    item.departmentId ?? deptNameToId.get(deptName) ?? null;

                const occName = item.occupationName || "Other";
                const occId =
                    item.occupationId ?? occNameToId.get(occName) ?? null;

                if (!acc[deptName]) {
                    acc[deptName] = { id: deptId, occupations: {} };
                }
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

            // 4) Μετατροπή σε format για το UI
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
    };

    useEffect(() => {
        loadDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, baseUrl]);

    const handleCreated = async (created) => {
        await loadDepartments();
        if (created?.id) onJobAdSelect?.(created.id);
        setIsCreateOpen(false);
    };

    return (
        <Col md="4">
            <Card className="shadow-sm" style={{ backgroundColor: "#F6F6F6", height: "450px" }}>
                <CardBody>

                    {/* ΑΦΑΙΡΕΘΗΚΕ το header με Departments / All Org */}

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
                                Name="Departments"                 // εμφανίζεται σαν λεζάντα πάνω από το search (αν θες να φύγει, άλλαξέ το σε null/"" ή πείραξε το component)
                                departments={departments}
                                onJobAdSelect={onJobAdSelect}
                                selectedJobAdId={selectedJobAdId}
                                // Department forwards
                                onDepartmentSelect={onDepartmentSelect}
                                selectedDepartmentId={selectedDepartmentId}
                                // Occupation forwards
                                onOccupationSelect={onOccupationSelect}
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
