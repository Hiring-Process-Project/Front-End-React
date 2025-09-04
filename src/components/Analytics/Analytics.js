import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TabContent, TabPane, UncontrolledTooltip } from 'reactstrap';
import OverviewTab from './OverviewTab';
import CandidatesTab from './CandidatesTab';
import StepsTab from './StepsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import AnalyticsTabsHeader from './AnalyticsTabsHeader';

const stateKey = (level, { deptId, occId, jobAdId, orgId = 3 }) => {
    // v2: σταθερό κλειδί ανά scope id (χωρίς ανάμιξη άλλων ids)
    switch (level) {
        case 'jobAd': return `hf:analytics:v2:jobAd:${jobAdId ?? 'na'}`;
        case 'occupation': return `hf:analytics:v2:occupation:${occId ?? 'na'}`;
        case 'department': return `hf:analytics:v2:department:${deptId ?? 'na'}`;
        default: return `hf:analytics:v2:organization:${orgId ?? 'na'}`;
    }
};

const getId = (obj, keys) => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj === 'string') return obj.trim() ? Number(obj) : null;
    if (typeof obj === 'object') {
        for (const k of keys) {
            const v = obj[k];
            if (v !== undefined && v !== null && v !== '') {
                return typeof v === 'string' ? Number(v) : v;
            }
        }
    }
    return null;
};

// normalize helper
const toInt = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

export default function Analytics({
    orgId = 3,
    apiBase = 'http://localhost:8087/api',
    departmentData,
    occupationData,
    jobAdData,
    onGoToOrganization,
}) {
    const deptId = getId(departmentData || {}, ['id', 'departmentId']);
    const occId = getId(occupationData || {}, ['id', 'occupationId']);
    const jobId = getId(jobAdData || {}, ['id', 'jobAdId']);

    const initialLastChanged = () => {
        if (jobId != null) return 'jobAd';
        if (occId != null) return 'occupation';
        if (deptId != null) return 'department';
        return 'organization';
    };

    const initialLevel = initialLastChanged();
    const [lastChanged, setLastChanged] = useState(initialLastChanged);
    const [forcedLevel, setForcedLevel] = useState(null);

    const prevDeptId = useRef(deptId);
    const prevOccId = useRef(occId);
    const prevJobId = useRef(jobId);

    useEffect(() => {
        if (jobId !== prevJobId.current) {
            prevJobId.current = jobId;
            if (jobId != null) {
                setForcedLevel(null);
                setLastChanged('jobAd');
            } else if (lastChanged === 'jobAd') {
                setLastChanged(occId != null ? 'occupation' : (deptId != null ? 'department' : 'organization'));
            }
        }
    }, [jobId, occId, deptId, lastChanged]);

    useEffect(() => {
        if (occId !== prevOccId.current) {
            prevOccId.current = occId;
            if (occId != null) {
                setForcedLevel(null);
                setLastChanged('occupation');
            } else if (lastChanged === 'occupation') {
                setLastChanged(jobId != null ? 'jobAd' : (deptId != null ? 'department' : 'organization'));
            }
        }
    }, [occId, jobId, deptId, lastChanged]);

    useEffect(() => {
        if (deptId !== prevDeptId.current) {
            prevDeptId.current = deptId;
            if (deptId != null) {
                setForcedLevel(null);
                setLastChanged('department');
            } else if (lastChanged === 'department') {
                setLastChanged(jobId != null ? 'jobAd' : (occId != null ? 'occupation' : 'organization'));
            }
        }
    }, [deptId, jobId, occId, lastChanged]);

    const level = forcedLevel ?? lastChanged ?? 'organization';
    const jobAdId = useMemo(() => (level === 'jobAd' ? jobId : null), [level, jobId]);

    const scope = useMemo(() => {
        switch (level) {
            case 'jobAd': return jobAdData;
            case 'occupation': return occupationData;
            case 'department': return departmentData;
            default: return { orgId };
        }
    }, [level, orgId, jobAdData, occupationData, departmentData]);

    // === Κατάσταση tabs & selections (επιμένει ανά scope id) ===
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    const handleSelectStep = (id) => {
        setSelectedStepId(toInt(id));           // ensure number
        setSelectedQuestionId(null);
    };
    const handleSelectQuestion = (id) => {
        setSelectedQuestionId(toInt(id));       // ensure number
    };

    const scopeLabel =
        ({ organization: 'Organization', department: 'Department', occupation: 'Occupation', jobAd: 'Job Ad' }[level]);

    const gotoOrganization = () => {
        // δεν σβήνουμε selections
        setForcedLevel('organization');
        onGoToOrganization && onGoToOrganization();
    };

    const overviewKey = useMemo(() => {
        const id =
            level === 'jobAd' ? (jobAdId ?? 'na') :
                level === 'occupation' ? (occId ?? 'na') :
                    level === 'department' ? (deptId ?? 'na') : 'org';
        return `ov-${level}-${id}`;
    }, [level, jobAdId, occId, deptId]);

    // Restore όταν αλλάζει scope/jobAd (ή αρχικά)
    useEffect(() => {
        const key = stateKey(level, { deptId, occId, jobAdId, orgId });
        try {
            const raw = sessionStorage.getItem(key);
            if (raw) {
                const saved = JSON.parse(raw);
                setActiveTab(saved.activeTab || 'overview');
                setSelectedStepId(toInt(saved.selectedStepId));
                setSelectedQuestionId(toInt(saved.selectedQuestionId));
            } else {
                setActiveTab('overview');
                setSelectedStepId(null);
                setSelectedQuestionId(null);
            }
        } catch {
            setActiveTab('overview');
            setSelectedStepId(null);
            setSelectedQuestionId(null);
        }
    }, [level, jobAdId, deptId, occId, orgId]);

    // Persist μόνο σε sessionStorage (όχι URL)
    useEffect(() => {
        const key = stateKey(level, { deptId, occId, jobAdId, orgId });
        const payload = {
            activeTab,
            selectedStepId: toInt(selectedStepId),
            selectedQuestionId: toInt(selectedQuestionId),
        };
        try { sessionStorage.setItem(key, JSON.stringify(payload)); } catch { }
    }, [activeTab, selectedStepId, selectedQuestionId, level, jobAdId, deptId, occId, orgId]);

    return (
        <>
            <AnalyticsTabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'overview' && (
                <div className="d-flex align-items-center mb-2" style={{ marginTop: 8 }}>
                    <div className="d-flex align-items-center" style={{ fontWeight: 600, gap: 8 }}>
                        <span>Scope: {scopeLabel}</span>
                        <span id="org-scope-reset" className="d-inline-flex">
                            <button
                                type="button"
                                onClick={gotoOrganization}
                                disabled={level === 'organization'}
                                aria-label="Return to Organization scope"
                                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                    width: 22, height: 22, lineHeight: '22px', borderRadius: '50%',
                                    opacity: level === 'organization' ? 0.5 : 1,
                                    cursor: level === 'organization' ? 'not-allowed' : 'pointer',
                                }}
                            >
                                ×
                            </button>
                        </span>
                        <UncontrolledTooltip placement="top" target="org-scope-reset">
                            {level === 'organization'
                                ? "You're already in Organization scope"
                                : 'Return to Organization scope'}
                        </UncontrolledTooltip>
                    </div>
                </div>
            )}

            <TabContent activeTab={activeTab} className="pt-3">
                <TabPane tabId="overview">
                    <OverviewTab key={overviewKey} level={level} data={scope} base={apiBase} />
                </TabPane>

                <TabPane tabId="candidates">
                    {level === 'jobAd'
                        ? <CandidatesTab apiBase={apiBase} jobAd={jobAdData} jobAdId={jobAdId} />
                        : <div className="text-muted">Pick a Job Ad to view candidates analytics.</div>}
                </TabPane>

                <TabPane tabId="steps">
                    {level === 'jobAd' ? (
                        <StepsTab
                            apiBase={apiBase}
                            jobAdId={jobAdId}
                            selectedStepId={toInt(selectedStepId)}   // ΠΑΝΤΑ number
                            onSelectStep={handleSelectStep}
                        />
                    ) : (
                        <div className="text-muted">Select a Job Ad to view steps and step analytics.</div>
                    )}
                </TabPane>

                <TabPane tabId="questions">
                    {level === 'jobAd' ? (
                        toInt(selectedStepId) ? (
                            <QuestionsTab
                                apiBase={apiBase}
                                jobAdId={jobAdId}
                                stepId={toInt(selectedStepId)}         // ΠΑΝΤΑ number
                                selectedQuestionId={toInt(selectedQuestionId)}
                                onSelectQuestion={handleSelectQuestion}
                            />
                        ) : (
                            <div className="text-muted">Pick a step to see its questions.</div>
                        )
                    ) : (
                        <div className="text-muted">Select a Job Ad to view questions.</div>
                    )}
                </TabPane>

                <TabPane tabId="skills">
                    {level === 'jobAd' ? (
                        toInt(selectedQuestionId) ? (
                            <SkillsTab apiBase={apiBase} questionId={toInt(selectedQuestionId)} />
                        ) : (
                            <div className="text-muted">Pick a question to see its skills.</div>
                        )
                    ) : (
                        <div className="text-muted">Select a Job Ad to view skills.</div>
                    )}
                </TabPane>
            </TabContent>
        </>
    );
}
