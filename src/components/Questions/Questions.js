import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';
import './questions.css';

const API = 'http://localhost:8087';

const normalizeStatus = (s) =>
    String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase().replace(/\s+/g, '');
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === 'pending' || n === 'pedding' || n === 'draft';
};

// πόσο χώρο θες να μείνει κάτω από τη λίστα (π.χ. για κουμπιά)
const RESERVE_LEFT = 80;

export default function Questions({ selectedJobAdId }) {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);

    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

    // ---- load all skills ----
    React.useEffect(() => {
        fetch(`${API}/skills`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setAllSkills((data || []).map((s) => s?.title).filter(Boolean)))
            .catch(() => setAllSkills([]));
    }, []);

    // ---- selected question details ----
    React.useEffect(() => {
        if (!selectedQuestionId) {
            setQuestionDesc('');
            setRequiredSkills([]);
            return;
        }
        fetch(`${API}/api/v1/question/${selectedQuestionId}/details`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => {
                setQuestionDesc(d?.description || '');
                setRequiredSkills(((d?.skills) || []).map((s) => s?.title).filter(Boolean));
            })
            .catch(() => {
                setQuestionDesc('');
                setRequiredSkills([]);
            });
    }, [selectedQuestionId]);

    // ---- status lock ----
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
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: questionDesc || '',
                    skillNames: requiredSkills || [],
                }),
            });
            if (!resp.ok) throw new Error();
        } catch {
            alert('Αποτυχία ενημέρωσης.');
        }
    };

    /* ========= ΜΟΝΑΔΙΚΟΣ SCROLLER ΣΤΗ ΜΕΣΑΙΑ ΣΤΗΛΗ ========= */
    const stepsScrollRef = React.useRef(null);
    React.useLayoutEffect(() => {
        const fit = () => {
            const el = stepsScrollRef.current;
            if (!el) return;

            // αν υπάρχουν κουμπιά κάτω, αφαίρεσε το πραγματικό ύψος τους
            const actions = el.parentElement?.parentElement?.querySelector('.q-actions');
            const actionsH = actions ? actions.getBoundingClientRect().height : 0;

            const top = el.getBoundingClientRect().top;
            const h = window.innerHeight - top - Math.max(RESERVE_LEFT, actionsH);
            el.style.height = `${Math.max(160, h)}px`;
            el.style.overflowY = 'auto';
            el.style.overflowX = 'hidden';
        };

        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [selectedJobAdId]);

    if (!selectedJobAdId) {
        return <p style={{ padding: '1rem' }}>Επέλεξε ένα Job Ad για να δεις τα Questions.</p>;
    }

    return (
        <Row className="g-3 q-fill" style={{ height: '100%' }}>
            {/* LEFT: Steps/Questions list (γεμίζει μέχρι κάτω) */}
            <Col md="5" className="q-col-flex">
                <Row className="mb-2">
                    <Col>
                        <label className="description-labels">Choose a Step...</label>
                    </Col>
                </Row>

                <div className="q-steps-card">
                    {/* ✅ ΜΟΝΑΔΙΚΟΣ scroller */}
                    <div ref={stepsScrollRef} className="q-steps-scroll q-no-x">
                        <StepsTree
                            selectedJobAdId={selectedJobAdId}
                            canEdit={canEdit}
                            selectedQuestionId={selectedQuestionId}
                            onSelectQuestion={setSelectedQuestionId}
                        />
                    </div>
                </div>

                {canEdit && (
                    <div className="q-actions">
                        <Button color="secondary" style={{ minWidth: 110, height: 36 }}>
                            Create New
                        </Button>
                        <Button
                            color="danger"
                            style={{ minWidth: 110, height: 36 }}
                            disabled={!selectedQuestionId}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </Col>

            {/* RIGHT: Description + Skills */}
            <Col md="7" className="q-col-flex">
                <Row className="g-3 q-fill">
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
}
