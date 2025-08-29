import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';

const API = "http://localhost:8087";

// helpers για status
const normalizeStatus = (s) =>
    String(s ?? "")
        .replace(/\u00A0/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

const isEditableStatus = (raw) => {
    const norm = normalizeStatus(raw);
    return norm === "pending" || norm === "pedding" || norm === "draft";
};

const Questions = ({ selectedJobAdId }) => {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);

    // status του job ad για lock στα actions
    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

    // --- όλα τα skills (για picker) ---
    React.useEffect(() => {
        fetch(`${API}/skills`)
            .then((r) => (r.ok ? r.json() : Promise.reject('Failed to fetch skills')))
            .then((data) =>
                setAllSkills((data || []).map((s) => s?.title).filter(Boolean))
            )
            .catch((e) => {
                console.error(e);
                setAllSkills([]);
            });
    }, []);

    // --- details για συγκεκριμένη ερώτηση ---
    React.useEffect(() => {
        if (!selectedQuestionId) {
            setQuestionDesc('');
            setRequiredSkills([]);
            return;
        }
        fetch(`${API}/api/v1/question/${selectedQuestionId}/details`)
            .then((r) => (r.ok ? r.json() : Promise.reject('Failed to fetch question details')))
            .then((d) => {
                setQuestionDesc(d?.description || '');
                setRequiredSkills(((d?.skills) || []).map((s) => s?.title).filter(Boolean));
            })
            .catch((e) => {
                console.error(e);
                setQuestionDesc('');
                setRequiredSkills([]);
            });
    }, [selectedQuestionId]);

    // --- jobAd status για lock κουμπιών ---
    React.useEffect(() => {
        if (!selectedJobAdId) {
            setStatus(null);
            return;
        }
        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    // --- save update ---
    const handleSave = async () => {
        if (!selectedQuestionId) return;

        try {
            const resp = await fetch(`${API}/api/v1/question/${selectedQuestionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: questionDesc || "",
                    skillNames: requiredSkills || []   // array από titles
                })
            });
            if (!resp.ok) throw new Error("update failed");
        } catch (e) {
            console.error(e);
            alert("Αποτυχία ενημέρωσης.");
        }
    };

    if (!selectedJobAdId) {
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις τα Questions.</p>;
    }

    return (
        <Row className="g-3 align-items-stretch">
            <Col md="5" className="d-flex flex-column">
                <Row className="mb-2" style={{ paddingLeft: '10px' }}>
                    <Col>
                        <label className="description-labels">Choose a Step...</label>
                    </Col>
                </Row>

                <div className="flex-grow-1 d-flex">
                    <StepsTree
                        selectedJobAdId={selectedJobAdId}
                        onSelectQuestion={setSelectedQuestionId}
                        canEdit={canEdit}         // 👈 περνάμε το lock στα actions του tree
                    />
                </div>
            </Col>

            <Col md="7" className="d-flex flex-column">
                <Row className="g-3 flex-grow-1">
                    <Col md="7" className="d-flex flex-column">
                        <Description
                            name={'Question Description'}
                            description={questionDesc}
                            onDescriptionChange={(val) => setQuestionDesc(val)}
                            readOnly={!canEdit}
                        />
                    </Col>

                    <Col md="5" className="d-flex flex-column">
                        <Row className="g-3 flex-grow-1">
                            <Col className="d-flex flex-column">
                                <SkillSelector
                                    allskills={allSkills}
                                    requiredskills={requiredSkills}
                                    setRequiredskills={setRequiredSkills}
                                />
                            </Col>
                        </Row>

                        {/* Κουμπί Update να φαίνεται ΜΟΝΟ όταν επιτρέπεται edit */}
                        {canEdit && (
                            <div className="mt-auto d-flex justify-content-center">
                                <Button
                                    color="secondary"
                                    className="delete-btn-req"
                                    style={{ marginTop: '30px' }}
                                    onClick={handleSave}
                                    disabled={!selectedQuestionId}
                                >
                                    Update
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default Questions;
