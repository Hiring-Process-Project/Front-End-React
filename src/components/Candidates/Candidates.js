import CandidateDropdown from './CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import { Row, Col, Card, CardBody, Button } from 'reactstrap';
import { useState } from "react";
import CandidateQuestionsDropDown from './CandidateQuestionsDropDown';
import StepSkills from './StepSkills';

function Candidates() {

    const [ratings, setRatings] = useState({});

    // Θα καλείται από το StepSkills όταν πατάς Save
    // payload = { skill, rating, comment }
    const handleRateSkill = ({ skill, rating, comment }) => {
        // Αν το skill δεν έχει id στα δεδομένα σου, φτιάχνουμε προσωρινό
        const skillId =
            skill?.id ??
            `${selectedStep?.name || 'step'}::${skill?.name || String(skill)}`;

        setRatings(prev => ({
            ...prev,
            [skillId]: { value: Number(rating), comment: comment || '' },
        }));

        console.log('Saved rating:', {
            skillId,
            step: selectedStep?.name,
            skillName: skill?.name || String(skill),
            rating: Number(rating),
            comment: comment || ''
        });
    };

    const [selectedStep, setSelectedStep] = useState(null);

    const handleReject = () => {
        console.log('Reject clicked');
        // TODO: βάλε εδώ το action σου (API call, state update, κ.λπ.)
    };

    const handleApprove = () => {
        console.log('Approve clicked');
        // TODO: βάλε εδώ το action σου
    };

    return (
        <Row>
            <Col md="4">
                <Card className="shadow-sm" style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '410px' }}>
                    <CardBody>
                        <Row style={{ borderBottom: "1px solid rgb(183, 186, 188)" }}>
                            <Col md='4'><label className="active-label">Candidate No:</label></Col>
                            <Col md='4'><label className="active-label">Name:</label></Col>
                            <Col md='4'><label className="active-label">Status:</label></Col>
                        </Row>

                        <CandidateDropdown candidates={candidatesData} />

                    </CardBody>
                </Card>
            </Col>

            <Col md="4">
                <label className="description-labels">Questions:</label>
                <Card className="shadow-sm" style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '280px' }}>
                    <CardBody>
                        <CandidateQuestionsDropDown
                            questions={questionsData}
                            onSelectStep={setSelectedStep}
                        />
                    </CardBody>
                </Card>

                <Row className="mt-5">
                    <Col className="d-flex justify-content-center">
                        <Button color="success" style={{ minWidth: '120px' }}>
                            Approve
                        </Button>
                    </Col>
                </Row>

            </Col>

            <Col md="4">
                <label className="description-labels">Step skills details:</label>
                <Card className="shadow-sm" style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '280px' }}>
                    <CardBody>
                        <StepSkills step={selectedStep} onRate={handleRateSkill} />
                    </CardBody>
                </Card>

                <Row className="mt-5">
                    <Col className="d-flex justify-content-center">
                        <Button color="danger" style={{ minWidth: '120px' }}>
                            Reject
                        </Button>
                    </Col>
                </Row>
            </Col>

            <Col
                md={{ size: 7, offset: 5 }}
                className="d-flex justify-content-between align-items-center mt-3"
            >
            </Col>
        </Row>
    );
}

export default Candidates;