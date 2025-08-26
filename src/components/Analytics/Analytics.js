import React, { useMemo, useState, useEffect } from 'react';
import { TabContent, TabPane } from 'reactstrap';

import OverviewTab from './OverviewTab';
import CandidatesTab from './CandidatesTab';
import StepsTab from './StepsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import AnalyticsTabsHeader from './AnalyticsTabsHeader';

const hasAnyId = (obj, keys) =>
    !!(obj && typeof obj === 'object' && keys.some(k => obj[k] !== undefined && obj[k] !== null));

export default function Analytics({
    orgId = 3,
    apiBase = 'http://localhost:8087/api',
    departmentData,
    occupationData,
    jobAdData,
}) {
    const isJobAd = hasAnyId(jobAdData, ['id', 'jobAdId']);
    const isOccupation = hasAnyId(occupationData, ['id', 'occupationId']);
    const isDepartment = hasAnyId(departmentData, ['id', 'departmentId']);

    const level = isJobAd
        ? 'jobAd'
        : isOccupation
            ? 'occupation'
            : isDepartment
                ? 'department'
                : 'organization';

    const jobAdId = useMemo(
        () => (isJobAd ? (jobAdData?.id ?? jobAdData?.jobAdId ?? null) : null),
        [isJobAd, jobAdData]
    );

    const scope = useMemo(() => {
        if (level === 'jobAd') return jobAdData;
        if (level === 'occupation') return occupationData;
        if (level === 'department') return departmentData;
        return { orgId };
    }, [level, orgId, jobAdData, occupationData, departmentData]);

    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    const handleSelectStep = (id) => {
        setSelectedStepId(id);
        setSelectedQuestionId(null); // reset ερώτησης όταν αλλάζει step
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

    const showScopeHeader = level !== 'organization' || activeTab === 'overview';

    // Reset όταν φεύγουμε από jobAd scope
    useEffect(() => {
        if (level !== 'jobAd') {
            setSelectedStepId(null);
            setSelectedQuestionId(null);
        }
    }, [level]);

    // Reset όταν αλλάζει το συγκεκριμένο job ad
    useEffect(() => {
        if (level === 'jobAd') {
            setSelectedStepId(null);
            setSelectedQuestionId(null);
        }
    }, [level, jobAdId]);

    return (
        <>
            {showScopeHeader && (
                <div style={{ marginBottom: 12, fontWeight: 600 }}>Scope: {scopeLabel}</div>
            )}

            <AnalyticsTabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            <TabContent activeTab={activeTab} className="pt-3">
                <TabPane tabId="overview">
                    <OverviewTab level={level} data={scope} base={apiBase} />
                </TabPane>

                <TabPane tabId="candidates">
                    {isJobAd ? (
                        <CandidatesTab apiBase={apiBase} jobAd={jobAdData} jobAdId={jobAdId} />
                    ) : (
                        <div className="text-muted">Pick a Job Ad to view candidates analytics.</div>
                    )}
                </TabPane>

                <TabPane tabId="steps">
                    {isJobAd ? (
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
                    {isJobAd ? (
                        selectedStepId ? (
                            <QuestionsTab
                                apiBase={apiBase}
                                jobAdId={jobAdId}
                                stepId={selectedStepId}              // <-- περνάμε ΜΟΝΟ το stepId
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
                    {isJobAd ? (
                        selectedQuestionId ? (
                            <SkillsTab questionId={selectedQuestionId} />
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
