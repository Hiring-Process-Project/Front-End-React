import React, { useState } from 'react';
import { Row, Col, Card, CardBody, Button, Input } from 'reactstrap';
import CandidateDropdown from '../Candidates/CandidateDropDown';
import candidatesData from '../../data/candidates.json';
import questionsData from '../../data/questions.json';
import CandidateQuestionsDropDown from '../Candidates/CandidateQuestionsDropDown';
import StepSkills from '../Candidates/StepSkills';

// ---- Helpers για score ανά question ----
const getQuestionSkillIds = (q) =>
    (q.steps ?? []).flatMap(s => (s.skills ?? []).map(k => k.id));

const computeQuestionScore = (question, ratings) => {
    const ids = getQuestionSkillIds(question);
    const total = ids.length;
    if (!total) return { complete: false, score: null, ratedCount: 0, total: 0 };

    const vals = ids.map(id => ratings[id]?.value).filter(v => typeof v === 'number');
    const ratedCount = vals.length;

    if (ratedCount !== total) {
        return { complete: false, score: null, ratedCount, total };
    }
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / total);
    return { complete: true, score: avg, ratedCount: total, total };
};

export default function Result() {
    const [selectedStep, setSelectedStep] = useState(null);
    const [generalComment, setGeneralComment] = useState('');
    // ratings: { [skillId]: { value: number 0..100, comment?: string } }
    const [ratings, setRatings] = useState({});

    // Δέχεται payload από StepSkills: { skill, rating, comment }
    const handleRateSkill = ({ skill, rating, comment }) => {
        // βρες / φτιάξε id (αν τα skills σου είναι strings, φτιάξε προσωρινό)
        const skillId =
            skill?.id ??
            `${selectedStep?.name || 'step'}::${skill?.name || String(skill)}`; // fallback id

        setRatings((prev) => ({
            ...prev,
            [skillId]: { value: Number(rating), comment: comment || '' },
        }));
    };

    return (
        <Row>
            {/* Αριστερά: Candidate list */}
            <Col md="4">
                <Card
                    className="shadow-sm"
                    style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '410px' }}
                >
                    <CardBody>
                        <Row style={{ borderBottom: '1px solid rgb(183, 186, 188)' }}>
                            <Col md="4"><label className="active-label">Candidate No:</label></Col>
                            <Col md="4"><label className="active-label">Name:</label></Col>
                            <Col md="4"><label className="active-label">Status:</label></Col>
                        </Row>

                        <CandidateDropdown candidates={candidatesData} />
                    </CardBody>
                </Card>
            </Col>

            {/* Μέση στήλη: Questions (με score) + overall comments */}
            <Col md="4">
                <label className="description-labels">Questions:</label>
                <Card
                    className="shadow-sm"
                    style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '200 px' }}
                >
                    <CardBody style={{ overflowY: 'auto', height: '220px' }}>
                        <CandidateQuestionsDropDown
                            questions={questionsData}
                            onSelectStep={setSelectedStep}
                            showScore
                            getQuestionScore={(q) => computeQuestionScore(q, ratings)}
                        />
                    </CardBody>
                </Card>

                <Card
                    className="shadow-sm mt-3"
                    style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: "140px" }}
                >
                    <CardBody>
                        <Input
                            id="result-general-comment"
                            type="textarea"
                            rows={2}
                            placeholder="Write overall comments for this candidate…"
                            value={generalComment}
                            onChange={(e) => setGeneralComment(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </CardBody>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
                        <Button color="success" style={{ width: '60px' }}>
                            Save
                        </Button>
                    </div>
                </Card>
            </Col>

            {/* Δεξιά: Step skills details + HIRE */}
            <Col md="4">
                <label className="description-labels">Step skills details:</label>
                <Card
                    className="shadow-sm"
                    style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '280px' }}
                >
                    <CardBody>
                        <StepSkills step={selectedStep} mode="view" ratings={ratings} />
                    </CardBody>
                </Card>

                <div className="d-flex justify-content-center mt-4">
                    <Button color="success" style={{ width: "60px" }}>
                        HIRE
                    </Button>
                </div>
            </Col>
        </Row>
    );
}

// import React, { useEffect, useState } from 'react';
// import { Row, Col, Card, CardBody, Button, Input } from 'reactstrap';
// import CandidateDropdown from '../Candidates/CandidateDropDown';
// import questionsData from '../../data/questions.json';
// import CandidateQuestionsDropDown from '../Candidates/CandidateQuestionsDropDown';
// import StepSkills from '../Candidates/StepSkills';

// // ---- Helpers για score ανά question ----
// const getQuestionSkillIds = (q) =>
//     (q.steps ?? []).flatMap(s => (s.skills ?? []).map(k => k.id));

// const computeQuestionScore = (question, ratings) => {
//     const ids = getQuestionSkillIds(question);
//     const total = ids.length;
//     if (!total) return { complete: false, score: null, ratedCount: 0, total: 0 };

//     const vals = ids.map(id => ratings[id]?.value).filter(v => typeof v === 'number');
//     const ratedCount = vals.length;

//     if (ratedCount !== total) {
//         return { complete: false, score: null, ratedCount, total };
//     }
//     const avg = Math.round(vals.reduce((a, b) => a + b, 0) / total);
//     return { complete: true, score: avg, ratedCount: total, total };
// };

// export default function Result() {
//     const [selectedStep, setSelectedStep] = useState(null);
//     const [generalComment, setGeneralComment] = useState('');
//     // ratings: { [skillId]: { value: number 0..100, comment?: string } }
//     const [ratings, setRatings] = useState({});

//     // Candidates από backend
//     const [candidates, setCandidates] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [err, setErr] = useState(null);

//     useEffect(() => {
//         let mounted = true;
//         (async () => {
//             try {
//                 setLoading(true);
//                 const res = await fetch('/api/candidates'); // <-- προσαρμόζεις το endpoint σου
//                 if (!res.ok) throw new Error(`HTTP ${res.status}`);
//                 const data = await res.json();
//                 if (mounted) setCandidates(Array.isArray(data) ? data : []);
//             } catch (e) {
//                 if (mounted) setErr(e.message || 'Failed to load candidates');
//             } finally {
//                 if (mounted) setLoading(false);
//             }
//         })();
//         return () => { mounted = false; };
//     }, []);

//     // Μόνο approved
//     const approvedCandidates = candidates.filter(
//         c => (c.status || '').toLowerCase() === 'approved'
//     );

//     // Δέχεται payload από StepSkills: { skill, rating, comment }
//     const handleRateSkill = ({ skill, rating, comment }) => {
//         const skillId =
//             skill?.id ??
//             `${selectedStep?.name || 'step'}::${skill?.name || String(skill)}`;

//         setRatings(prev => ({
//             ...prev,
//             [skillId]: { value: Number(rating), comment: comment || '' },
//         }));
//     };

//     return (
//         <Row>
//             {/* Αριστερά: Candidate list (μόνο approved) */}
//             <Col md="4">
//                 <Card
//                     className="shadow-sm"
//                     style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '410px' }}
//                 >
//                     <CardBody>
//                         <Row style={{ borderBottom: '1px solid rgb(183, 186, 188)' }}>
//                             <Col md="4"><label className="active-label">Candidate No:</label></Col>
//                             <Col md="4"><label className="active-label">Name:</label></Col>
//                             <Col md="4"><label className="active-label">Status:</label></Col>
//                         </Row>

//                         {loading && <div className="mt-2">Loading…</div>}
//                         {err && <div className="mt-2 text-danger">Error: {err}</div>}
//                         {!loading && !err && (
//                             <CandidateDropdown candidates={approvedCandidates} />
//                         )}
//                     </CardBody>
//                 </Card>
//             </Col>

//             {/* Μέση στήλη: Questions (με score) + overall comments */}
//             <Col md="4">
//                 <label className="description-labels">Questions:</label>
//                 <Card
//                     className="shadow-sm"
//                     style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '200px' }}
//                 >
//                     <CardBody style={{ overflowY: 'auto', height: '220px' }}>
//                         <CandidateQuestionsDropDown
//                             questions={questionsData}
//                             onSelectStep={setSelectedStep}
//                             showScore
//                             getQuestionScore={(q) => computeQuestionScore(q, ratings)}
//                         />
//                     </CardBody>
//                 </Card>

//                 <Card
//                     className="shadow-sm mt-3"
//                     style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '140px' }}
//                 >
//                     <CardBody>
//                         <Input
//                             id="result-general-comment"
//                             type="textarea"
//                             rows={2}
//                             placeholder="Write overall comments for this candidate…"
//                             value={generalComment}
//                             onChange={(e) => setGeneralComment(e.target.value)}
//                             style={{ resize: 'vertical' }}
//                         />
//                     </CardBody>
//                     <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
//                         <Button color="success" style={{ width: '60px' }}>
//                             Save
//                         </Button>
//                     </div>
//                 </Card>
//             </Col>

//             {/* Δεξιά: Step skills details + HIRE */}
//             <Col md="4">
//                 <label className="description-labels">Step skills details:</label>
//                 <Card
//                     className="shadow-sm"
//                     style={{ overflowY: 'auto', backgroundColor: '#E5E7EB', borderRadius: '12px', height: '280px' }}
//                 >
//                     <CardBody>
//                         <StepSkills step={selectedStep} mode="view" ratings={ratings} onRate={handleRateSkill} />
//                     </CardBody>
//                 </Card>

//                 <div className="d-flex justify-content-center mt-4">
//                     <Button color="success" style={{ width: '60px' }}>
//                         HIRE
//                     </Button>
//                 </div>
//             </Col>
//         </Row>
//     );
// }
