// src/components/Analytics/Analytics.js
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TabContent, TabPane } from 'reactstrap';

import OverviewTab from './OverviewTab';
import CandidatesTab from './CandidatesTab';
import StepsTab from './StepsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import AnalyticsTabsHeader from './AnalyticsTabsHeader';

const getId = (obj, keys) =>
    obj && typeof obj === 'object'
        ? keys.map(k => obj[k]).find(v => v !== undefined && v !== null)
        : null;

export default function Analytics({
    orgId = 3,
    apiBase = 'http://localhost:8087/api',
    departmentData,
    occupationData,
    jobAdData,
    onGoToOrganization, // optional
}) {
    // Τρέχοντα ids από props
    const deptId = getId(departmentData || {}, ['id', 'departmentId']);
    const occId = getId(occupationData || {}, ['id', 'occupationId']);
    const jobId = getId(jobAdData || {}, ['id', 'jobAdId']);

    // --- Ποιο scope ήταν το "τελευταίο που άλλαξε" (last change wins) ---
    const initialLastChanged = () => {
        if (jobId != null) return 'jobAd';
        if (occId != null) return 'occupation';
        if (deptId != null) return 'department';
        return 'organization';
    };
    const [lastChanged, setLastChanged] = useState(initialLastChanged);

    // --- Χειροκίνητο force από το κουμπί Organization ---
    // όταν είναι 'organization', υπερισχύει των props
    const [forcedLevel, setForcedLevel] = useState(null); // 'organization' | null

    // Κράτα προηγούμενες τιμές για να ανιχνεύουμε αλλαγές
    const prevDeptId = useRef(deptId);
    const prevOccId = useRef(occId);
    const prevJobId = useRef(jobId);

    // jobId changed
    useEffect(() => {
        if (jobId !== prevJobId.current) {
            prevJobId.current = jobId;
            if (jobId != null) {
                // Μόλις επιλέχθηκε jobAd → ακύρωσε τυχόν forced org και πήγαινε jobAd
                setForcedLevel(null);
                setLastChanged('jobAd');
            } else if (lastChanged === 'jobAd') {
                // Έφυγε jobAd → πήγαινε σε επόμενο διαθέσιμο ή org
                setLastChanged(occId != null ? 'occupation' : (deptId != null ? 'department' : 'organization'));
            }
        }
    }, [jobId, occId, deptId, lastChanged]);

    // occId changed
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

    // deptId changed
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

    // Το τελικό scope level:
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

    // Tabs
    const [activeTab, setActiveTab] = useState('overview');

    // Εσωτερικές επιλογές
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    // Καθάρισε selections αν φύγεις από jobAd
    useEffect(() => {
        if (level !== 'jobAd') {
            setSelectedStepId(null);
            setSelectedQuestionId(null);
        }
    }, [level]);

    // Καθάρισε selections όταν αλλάζει jobAd
    useEffect(() => {
        setSelectedStepId(null);
        setSelectedQuestionId(null);
    }, [jobAdId]);

    const handleSelectStep = (id) => {
        setSelectedStepId(id);
        setSelectedQuestionId(null);
    };

    const handleSelectQuestion = (id) => {
        setSelectedQuestionId(id);
    };

    const scopeLabel =
        {
            organization: 'Organization',
            department: 'Department',
            occupation: 'Occupation',
            jobAd: 'Job Ad',
        }[level];

    const gotoOrganization = () => {
        setSelectedStepId(null);
        setSelectedQuestionId(null);
        setForcedLevel('organization'); // υπερισχύει των props
        onGoToOrganization && onGoToOrganization(); // ενημέρωσε γονέα αν θέλεις
    };

    // Remount key για φρέσκο fetch κάθε φορά που αλλάζει το scope
    const overviewKey = useMemo(() => {
        const id =
            level === 'jobAd'
                ? (jobAdId ?? 'na')
                : level === 'occupation'
                    ? (occId ?? 'na')
                    : level === 'department'
                        ? (deptId ?? 'na')
                        : 'org';
        return `ov-${level}-${id}`;
    }, [level, jobAdId, occId, deptId]);

    return (
        <>
            <AnalyticsTabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'overview' && (
                <div className="d-flex align-items-center justify-content-between mb-2" style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600 }}>Scope: {scopeLabel}</div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={gotoOrganization}
                        disabled={level === 'organization'}
                        title="Εμφάνιση στατιστικών για όλο τον οργανισμό"
                    >
                        Organization
                    </button>
                </div>
            )}

            <TabContent activeTab={activeTab} className="pt-3">
                <TabPane tabId="overview">
                    <OverviewTab key={overviewKey} level={level} data={scope} base={apiBase} />
                </TabPane>

                <TabPane tabId="candidates">
                    {level === 'jobAd' ? (
                        <CandidatesTab apiBase={apiBase} jobAd={jobAdData} jobAdId={jobAdId} />
                    ) : (
                        <div className="text-muted">Pick a Job Ad to view candidates analytics.</div>
                    )}
                </TabPane>

                <TabPane tabId="steps">
                    {level === 'jobAd' ? (
                        <StepsTab
                            apiBase={apiBase}
                            jobAdId={jobAdId}
                            selectedStepId={selectedStepId}
                            onSelectStep={handleSelectStep}
                        />
                    ) : (
                        <div className="text-muted">Select a Job Ad to view steps and step analytics.</div>
                    )}
                </TabPane>

                <TabPane tabId="questions">
                    {level === 'jobAd' ? (
                        selectedStepId ? (
                            <QuestionsTab
                                apiBase={apiBase}
                                jobAdId={jobAdId}
                                stepId={selectedStepId}
                                selectedQuestionId={selectedQuestionId}
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
                        selectedQuestionId ? (
                            <SkillsTab apiBase={apiBase} questionId={selectedQuestionId} />
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
