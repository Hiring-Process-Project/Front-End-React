// src/components/Candidates/Candidates.jsx
import React, { useEffect, useState } from "react";
import { Row, Col, Card, CardBody } from "reactstrap";
import CandidateDropdown from "./CandidateDropDown";
import StepsAccordion from "./StepsDropDown";
import StepSkills from "./StepSkills";
import questionsData from "../../data/questions.json";
import "./Candidates.css";

// Βάση API για το backend
// Προσπαθεί πρώτα από .env (Vite/CRA), αλλιώς πέφτει στο 8087.
const API_BASE =
    import.meta?.env?.VITE_API_BASE ||
    process.env.REACT_APP_API_BASE ||
    "http://localhost:8087";

function Candidates({ jobAdId }) {
    // Επιλογές UI
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Δεδομένα & κατάσταση φόρτωσης
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    // Αν έχεις ratings/σκοράρισμα
    const [ratings] = useState({});

    // Τα steps/ερωτήσεις από το JSON σου
    const stepsData = Array.isArray(questionsData) ? questionsData : [];

    // Κάθε φορά που αλλάζει αγγελία → καθάρισε επιλογές
    useEffect(() => {
        setSelectedCandidate(null);
        setSelectedStep(null);
        setSelectedQuestion(null);
    }, [jobAdId]);

    // Φόρτωση υποψηφίων για συγκεκριμένο jobAdId
    useEffect(() => {
        if (!jobAdId) {
            setCandidates([]);
            return;
        }

        const ac = new AbortController();
        setLoading(true);
        setErr(null);

        (async () => {
            try {
                const url = `${API_BASE}/api/v1/candidates/jobad/${jobAdId}`;
                const res = await fetch(url, { signal: ac.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const mapped = (Array.isArray(data) ? data : []).map((c) => ({
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`.trim(),
                    email: c.email,
                    status: c.status,
                    cv: c.cvPath,
                }));

                setCandidates(mapped);
            } catch (e) {
                if (e.name !== "AbortError") setErr(e.message || "Load error");
            } finally {
                setLoading(false);
            }
        })();

        return () => ac.abort();
    }, [jobAdId]);

    // Δεξί pane: αντικείμενο για skills της επιλεγμένης ερώτησης
    const rightPaneStepObj =
        selectedStep && selectedQuestion
            ? {
                name: `${selectedStep.name} — ${selectedQuestion.question}`,
                skills: selectedQuestion.skills || [],
            }
            : null;

    useEffect(() => console.log("Candidates got jobAdId:", jobAdId), [jobAdId]);


    return (
        <Row>
            {/* ΑΡΙΣΤΕΡΑ: Λίστα υποψηφίων */}
            <Col md="4">
                <Card className="panel">
                    <CardBody>
                        <Row className="panel__header-row">
                            <Col md="4">
                                <label className="active-label">Candidate No:</label>
                            </Col>
                            <Col md="4">
                                <label className="active-label">Name:</label>
                            </Col>
                            <Col md="4">
                                <label className="active-label">Status:</label>
                            </Col>
                        </Row>

                        {!jobAdId ? (
                            <div style={{ opacity: 0.7 }}>
                                Επίλεξε μία αγγελία για να δεις υποψηφίους.
                            </div>
                        ) : loading ? (
                            <div>Φόρτωση...</div>
                        ) : err ? (
                            <div style={{ color: "crimson" }}>Σφάλμα: {err}</div>
                        ) : (
                            <CandidateDropdown
                                candidates={candidates}
                                onSelect={(cand) => {
                                    setSelectedCandidate(cand);
                                    setSelectedStep(null);
                                    setSelectedQuestion(null);
                                }}
                            />
                        )}
                    </CardBody>
                </Card>
            </Col>

            {/* ΜΕΣΗ ΣΤΗΛΗ: Βήματα & Ερωτήσεις */}
            <Col md="4">
                <label className="description-labels">Interview Steps:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <StepsAccordion
                                steps={stepsData}
                                ratings={ratings}
                                onSelect={(step, q) => {
                                    setSelectedStep(step);
                                    setSelectedQuestion(q);
                                }}
                                showScore={true}
                            />
                        ) : (
                            <div style={{ opacity: 0.6 }}>
                                Select a candidate to see steps…
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>

            {/* ΔΕΞΙΑ ΣΤΗΛΗ: Skills της ερώτησης */}
            <Col md="4">
                <label className="description-labels">Skills for this question:</label>
                <Card className="panel panel--short">
                    <CardBody>
                        {selectedCandidate ? (
                            <StepSkills step={rightPaneStepObj} onRate={() => { }} />
                        ) : (
                            <div style={{ opacity: 0.6 }}>
                                Select a candidate to see skills…
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default Candidates;
