import React from 'react';
import { Col, Row, Button } from 'reactstrap';
import StepsTree from './StepsTree';
import Description from '../Description/Description';
import SkillSelector from '../Description/SkillSelector';
import AddQuestionModal from './AddQuestionModal';
import ConfirmModal from '../Hire/ConfirmModal';
import './questions.css';

const API = 'http://localhost:8087';

const normalizeStatus = (s) =>
    String(s ?? '').replace(/\u00A0/g, ' ').trim().toLowerCase().replace(/\s+/g, '');
const isEditableStatus = (raw) => {
    const n = normalizeStatus(raw);
    return n === 'pending' || n === 'pedding' || n === 'draft';
};

const RESERVE_LEFT = 80;
const GAP_ABOVE_UPDATE = 12;

// safe toast helper
const toast = (msg, type = 'success', ttl = 2500) => {
    if (window.hfToast) window.hfToast(msg, type, ttl);
    else window.dispatchEvent(new CustomEvent('hf:toast', { detail: { message: msg, type, ttl } }));
};

export default function Questions({ selectedJobAdId }) {
    const [allSkills, setAllSkills] = React.useState([]);
    const [requiredSkills, setRequiredSkills] = React.useState([]);
    const [questionDesc, setQuestionDesc] = React.useState('');
    const [selectedQuestionId, setSelectedQuestionId] = React.useState(null);

    const [status, setStatus] = React.useState(null);
    const canEdit = React.useMemo(() => isEditableStatus(status), [status]);

    const [steps, setSteps] = React.useState([]);
    const [activeStepId, setActiveStepId] = React.useState(null);

    const [showAdd, setShowAdd] = React.useState(false);
    const openCreateModal = () => setShowAdd(true);
    const closeCreateModal = () => setShowAdd(false);

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    /* ===== Skills list (για το δεξί panel) ===== */
    React.useEffect(() => {
        fetch(`${API}/skills`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setAllSkills((data || []).map((s) => s?.title).filter(Boolean)))
            .catch(() => setAllSkills([]));
    }, []);

    /* ===== Φόρτωση περιγραφής/skills ανά question ===== */
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

    /* ===== Κατάσταση Job Ad ===== */
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

    /* ===== Αποθήκευση ===== */
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
            toast('Question updated', 'success');
        } catch {
            toast('Update failed', 'error');
        }
    };

    /* ===== Διαγραφή ===== */
    const askDelete = () => {
        if (!selectedQuestionId) return;
        setConfirmOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!selectedQuestionId) {
            setConfirmOpen(false);
            return;
        }
        setDeleting(true);
        try {
            const r = await fetch(`${API}/api/v1/question/${selectedQuestionId}`, { method: 'DELETE' });
            if (!r.ok) throw new Error('delete-failed');

            const deletedId = selectedQuestionId;
            setSelectedQuestionId(null);
            setQuestionDesc('');
            setRequiredSkills([]);

            window.dispatchEvent(
                new CustomEvent('question-deleted', {
                    detail: { questionId: deletedId, stepId: activeStepId || null },
                })
            );

            setConfirmOpen(false);
            toast('Question deleted', 'success');
        } catch (e) {
            setConfirmOpen(false);
            toast('Delete failed', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* ========= ΜΟΝΑΔΙΚΟΣ SCROLLER ΣΤΗ ΜΕΣΑΙΑ ΣΤΗΛΗ ========= */
    const stepsScrollRef = React.useRef(null);
    React.useLayoutEffect(() => {
        const fit = () => {
            const el = stepsScrollRef.current;
            if (!el) return;
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
    }, [selectedJobAdId, canEdit]);

    /* ========= ΚΑΘΑΡΟ ΥΨΟΣ ΓΙΑ ΤΟ ΔΕΞΙ SKILLS PANEL ========= */
    const rightDescWrapRef = React.useRef(null);
    const rightSkillsColRef = React.useRef(null);
    const updateBtnRef = React.useRef(null);
    const [skillsPanelHeight, setSkillsPanelHeight] = React.useState(null);

    const recalcHeights = React.useCallback(() => {
        const col = rightSkillsColRef.current;
        if (!col) return;

        const colH = col.clientHeight;

        let buttonsTotal = 0;
        if (updateBtnRef.current) {
            const cs = getComputedStyle(updateBtnRef.current);
            buttonsTotal =
                (updateBtnRef.current.offsetHeight || 0) +
                parseFloat(cs.marginTop || '0') +
                parseFloat(cs.marginBottom || '0');
        }

        const SKILLS_HEADER_H = 28;
        const buffer = 8;

        let available = Math.max(
            140,
            colH - buttonsTotal - SKILLS_HEADER_H - buffer - GAP_ABOVE_UPDATE
        );

        if (rightDescWrapRef.current) {
            const leftH = rightDescWrapRef.current.clientHeight;
            if (leftH > 0) available = Math.min(available, leftH);
        }

        setSkillsPanelHeight(available);
    }, []);

    const kickRecalc = React.useCallback(() => {
        recalcHeights();
        requestAnimationFrame(() => recalcHeights());
        setTimeout(recalcHeights, 0);
        setTimeout(recalcHeights, 120);
        if (document?.fonts?.ready) document.fonts.ready.then(() => recalcHeights());
    }, [recalcHeights]);

    React.useLayoutEffect(() => { kickRecalc(); }, [kickRecalc]);
    React.useEffect(() => {
        let raf = 0;
        const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(kickRecalc); };
        window.addEventListener('resize', onResize);
        const t = setTimeout(kickRecalc, 0);
        return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); clearTimeout(t); };
    }, [kickRecalc, requiredSkills.length]);

    if (!selectedJobAdId) {
        return <p style={{ padding: '1rem' }}>Select a Job Ad to view Questions.</p>;
    }

    const handleCreated = ({ stepId, question }) => {
        window.dispatchEvent(new CustomEvent('question-created', { detail: { stepId, question } }));
        toast('Question created', 'success');
    };

    return (
        <>
            <Row className="g-3 q-fill" style={{ height: '100%' }}>
                {/* LEFT: Steps/Questions list */}
                <Col md="5" className="q-col-flex">
                    <Row className="mb-2">
                        <Col>
                            <label className="description-labels">Choose a Step...</label>
                        </Col>
                    </Row>

                    <div className="q-steps-card">
                        <div ref={stepsScrollRef} className="q-steps-scroll q-no-x">
                            <StepsTree
                                selectedJobAdId={selectedJobAdId}
                                canEdit={canEdit}
                                selectedQuestionId={selectedQuestionId}
                                onSelectQuestion={setSelectedQuestionId}
                                onStepsChange={setSteps}
                                onSelectStep={setActiveStepId}
                            />
                        </div>
                    </div>

                    {canEdit && (
                        <div className="q-actions">
                            <Button color="secondary" style={{ minWidth: 110, height: 36 }} onClick={openCreateModal}>
                                Create New
                            </Button>
                            <Button color="danger" style={{ minWidth: 110, height: 36 }} disabled={!selectedQuestionId} onClick={askDelete}>
                                Delete
                            </Button>
                        </div>
                    )}
                </Col>

                {/* RIGHT: Description + Skills */}
                <Col md="7" className="q-col-flex">
                    <Row className="g-3 q-fill">
                        {/* Question Description */}
                        <Col md="7" className="q-col-flex">
                            <div className="q-fill" ref={rightDescWrapRef}>
                                <Description
                                    name="Question Description"
                                    description={questionDesc}
                                    onDescriptionChange={setQuestionDesc}
                                    readOnly={!canEdit}
                                />
                            </div>
                        </Col>

                        {/* Skills */}
                        <Col md="5" className="q-col-flex" ref={rightSkillsColRef}>
                            <div style={{ flex: '0 0 auto', minHeight: 0, height: skillsPanelHeight ?? 'auto' }}>
                                <SkillSelector
                                    allskills={allSkills}
                                    requiredskills={requiredSkills}
                                    setRequiredskills={setRequiredSkills}
                                    panelHeight={skillsPanelHeight}
                                />
                            </div>

                            {canEdit && (
                                <div
                                    ref={updateBtnRef}
                                    className="q-skills-update"
                                    style={{ marginTop: 55, display: 'flex', justifyContent: 'center', width: '100%' }}
                                >
                                    <Button
                                        color="secondary"
                                        className="q-update-btn"
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

            {/* Modal δημιουργίας */}
            <AddQuestionModal
                isOpen={showAdd}
                toggle={closeCreateModal}
                steps={steps}
                defaultStepId={activeStepId}
                onCreated={(payload) => {
                    handleCreated(payload);
                    closeCreateModal();
                }}
            />

            {/* Modal επιβεβαίωσης διαγραφής */}
            <ConfirmModal
                isOpen={confirmOpen}
                title="Delete Question"
                message={
                    <div>
                        Are you sure you want to delete this question?
                        <br />
                        This action cannot be undone.
                    </div>
                }
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}
