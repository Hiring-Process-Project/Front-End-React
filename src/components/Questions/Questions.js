import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';
import AddQuestionModal from "./AddQuestionModal";
import ConfirmModal from "../Hire/ConfirmModal";
import './questions.css';

const API = "http://localhost:8087";

const normalizeStatus = (s) =>
    String(s ?? "").replace(/\u00A0/g, " ").trim().toLowerCase().replace(/\s+/g, "");
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === "pending" || n === "pedding" || n === "draft";
};

export default function Questions({ selectedJobAdId }) {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);
    const [selectedQuestionStepId, setSelectedQuestionStepId] = React.useState(null);

    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

    const [stepsForModal, setStepsForModal] = React.useState([]);
    const [openStepId, setOpenStepId] = React.useState(null);
    const [reloadKey, setReloadKey] = React.useState(0);

    const [showAdd, setShowAdd] = React.useState(false);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    React.useEffect(() => {
        fetch(`${API}/skills`)
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => setAllSkills((d || []).map(s => s?.title).filter(Boolean)))
            .catch(() => setAllSkills([]));
    }, []);

    React.useEffect(() => {
        if (!selectedQuestionId) { setQuestionDesc(''); setRequiredSkills([]); return; }
        fetch(`${API}/api/v1/question/${selectedQuestionId}/details`)
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => {
                setQuestionDesc(d?.description || '');
                setRequiredSkills(((d?.skills) || []).map(s => s?.title).filter(Boolean));
            })
            .catch(() => { setQuestionDesc(''); setRequiredSkills([]); });
    }, [selectedQuestionId]);

    React.useEffect(() => {
        if (!selectedJobAdId) { setStatus(null); return; }
        fetch(`${API}/jobAds/details?jobAdId=${selectedJobAdId}`)
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => setStatus(d?.status ?? null))
            .catch(() => setStatus(null));
    }, [selectedJobAdId]);

    const handleSave = async () => {
        if (!selectedQuestionId) return;
        try {
            const resp = await fetch(`${API}/api/v1/question/${selectedQuestionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: questionDesc || "", skillNames: requiredSkills || [] })
            });
            if (!resp.ok) throw new Error();
        } catch { alert("Αποτυχία ενημέρωσης."); }
    };

    const handleSelectQuestion = (qid, stepId) => {
        setSelectedQuestionId(qid);
        setSelectedQuestionStepId(stepId ?? null);
    };

    const handleCreated = ({ stepId, question }) => {
        setOpenStepId(stepId);
        setSelectedQuestionId(question?.id ?? null);
        setSelectedQuestionStepId(stepId ?? null);
        setShowAdd(false);
        setReloadKey(k => k + 1);
    };

    const doDelete = async () => {
        const qid = selectedQuestionId;
        if (!qid) return;
        setDeleting(true);
        try {
            const r = await fetch(`${API}/api/v1/question/${qid}`, { method: "DELETE" });
            if (!r.ok) throw new Error();
            setSelectedQuestionId(null);
            setSelectedQuestionStepId(null);
            setConfirmOpen(false);
            setReloadKey(k => k + 1);
        } finally { setDeleting(false); }
    };

    if (!selectedJobAdId) {
        return <p style={{ padding: "1rem" }}>Επέλεξε ένα Job Ad για να δεις τα Questions.</p>;
    }

    return (
        <Row className="g-3 q-fill" style={{ height: '100%' }}>
            {/* LEFT (sidebar) ήδη παίζει, δεν το πειράζουμε */}

            {/* CENTER: Choose a Step…  -> γεμίζει μέχρι κάτω */}
            <Col md="5" className="q-col-flex">
                <div className="q-center-col q-fill">
                    <Row className="mb-2">
                        <Col><label className="description-labels">Choose a Step...</label></Col>
                    </Row>

                    <div className="q-steps-card q-fill">
                        <div className="q-steps-scroll q-no-x">
                            <StepsTree
                                selectedJobAdId={selectedJobAdId}
                                canEdit={canEdit}
                                selectedQuestionId={selectedQuestionId}
                                onSelectQuestion={handleSelectQuestion}
                                openStepIdProp={openStepId}
                                reloadKey={reloadKey}
                                onStepsChange={setStepsForModal}
                            />
                        </div>
                    </div>

                    {canEdit && (
                        <div className="q-actions">
                            <Button color="secondary" onClick={() => setShowAdd(true)} style={{ minWidth: 110, height: 36 }}>Create New</Button>
                            <Button color="danger" onClick={() => setConfirmOpen(true)} disabled={!selectedQuestionId} style={{ minWidth: 110, height: 36 }}>Delete</Button>
                        </div>
                    )}
                </div>
            </Col>

            {/* RIGHT: Description + Skills (όπως πριν) */}
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
                                <Button color="secondary" className="delete-btn-req" onClick={handleSave} disabled={!selectedQuestionId}>
                                    Update
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>
            </Col>

            {/* Modals */}
            <AddQuestionModal
                isOpen={showAdd}
                toggle={() => setShowAdd(v => !v)}
                steps={stepsForModal}
                defaultStepId={openStepId || stepsForModal[0]?.id}
                onCreated={handleCreated}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                title="Διαγραφή ερώτησης"
                message={<>Θέλεις σίγουρα να διαγράψεις αυτή την ερώτηση;<br />Η ενέργεια δεν είναι αναστρέψιμη.</>}
                confirmText="Διαγραφή"
                cancelText="Άκυρο"
                confirmColor="danger"
                loading={deleting}
                onConfirm={doDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </Row>
    );
}
