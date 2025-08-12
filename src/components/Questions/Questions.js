import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';


const Questions = ({ selectedJobAdId }) => {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);

    React.useEffect(() => {
        fetch('http://localhost:8087/skills')
            .then((r) => (r.ok ? r.json() : Promise.reject('Failed to fetch skills')))
            .then((data) => setAllSkills((data || []).map((s) => s.name)))
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
        fetch(`http://localhost:8087/api/v1/question/${selectedQuestionId}/details`)
            .then((r) => (r.ok ? r.json() : Promise.reject('Failed to fetch question details')))
            .then((d) => {
                setQuestionDesc(d?.description || '');
                setRequiredSkills(((d?.skills) || []).map((s) => s.name).filter(Boolean));
            })
            .catch((e) => {
                console.error(e);
                setQuestionDesc('');
                setRequiredSkills([]);
            });
    }, [selectedQuestionId]);

    const handleSave = async () => {
        if (!selectedQuestionId) return;

        try {
            const resp = await fetch(`http://localhost:8087/api/v1/question/${selectedQuestionId}`, {
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
                    />
                </div>
            </Col>

            <Col md="7" className="d-flex flex-column">
                <Row className="g-3 flex-grow-1">
                    <Col md="7" className="d-flex flex-column">
                        <Description
                            name={['Question Description']}
                            description={[questionDesc]}
                            onDescriptionChange={(val) => setQuestionDesc(val)}
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
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default Questions;
