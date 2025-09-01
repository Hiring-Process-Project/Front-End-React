import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';
import './questions.css';

const API = "http://localhost:8087";

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

    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

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

    const handleSave = async () => {
        if (!selectedQuestionId) return;
        try {
            const resp = await fetch(`${API}/api/v1/question/${selectedQuestionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: questionDesc || "",
                    skillNames: requiredSkills || []
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
        <Row className="g-3 q-fill" style={{ height: '100%' }}>
            {/* Left: Steps tree */}
            <Col md="5" className="q-col-flex">
                <Row className="mb-2 q-section-label">
                    <Col><label className="description-labels">Choose a Step...</label></Col>
                </Row>

                <div className="q-fill q-no-overflow-x">
                    <StepsTree
                        selectedJobAdId={selectedJobAdId}
                        onSelectQuestion={setSelectedQuestionId}
                        canEdit={canEdit}
                    />
                </div>
            </Col>

            {/* Right: Description + Skills */}
            <Col md="7" className="q-col-flex">
                <Row className="g-3 q-fill">
                    {/* Description */}
                    <Col md="7" className="q-col-flex">
                        <div className="q-fill">
                            <Description
                                name="Question Description"
                                description={questionDesc}
                                onDescriptionChange={setQuestionDesc}
                                readOnly={!canEdit}
                            />
                        </div>
                    </Col>

                    {/* Skills picker (editable) */}
                    <Col md="5" className="q-col-flex">
                        <div className="q-right-scroll">
                            <SkillSelector
                                allskills={allSkills}
                                requiredskills={requiredSkills}
                                setRequiredskills={setRequiredSkills}
                            />
                        </div>

                        {canEdit && (
                            <div className="d-flex justify-content-center q-mt-16">
                                <Button
                                    color="secondary"
                                    className="delete-btn-req"
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
