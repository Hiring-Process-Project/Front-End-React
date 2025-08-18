import React, { useMemo, useState } from 'react';
import { TabContent, TabPane } from 'reactstrap';
import OverviewTab from './OverviewTab';
import CandidatesTab from './CandidatesTab';
import StepsTab from './StepsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import StatisticsTabs from './StatisticsTabs';

export default function Statistics({ departmentData, occupationData, jobAdData }) {
    const level = jobAdData ? 'jobAd' : (occupationData ? 'occupation' : 'department');

    const scope = useMemo(
        () => jobAdData || occupationData || departmentData || {},
        [jobAdData, occupationData, departmentData]
    );

    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    const steps = useMemo(() => scope?.steps ?? [], [scope]);

    const selectedStep = useMemo(
        () => steps.find(s => s.id === selectedStepId) || null,
        [steps, selectedStepId]
    );

    const selectedQuestion = useMemo(() => {
        if (!selectedStep) return null;
        return (selectedStep.questions || []).find(q => q.id === selectedQuestionId) || null;
    }, [selectedStep, selectedQuestionId]);

    const canQuestions = Boolean(selectedStepId);
    const canSkills = Boolean(selectedQuestionId);

    const handleSelectStep = (id) => {
        setSelectedStepId(id);
        setSelectedQuestionId(null);
        setActiveTab('questions');
    };

    const handleSelectQuestion = (id) => {
        setSelectedQuestionId(id);
        setActiveTab('skills');
    };

    const scopeLabel = { department: 'Department', occupation: 'Occupation', jobAd: 'Job Ad' }[level];

    return (
        <>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Scope: {scopeLabel}</div>

            {/* Τα Tabs πλέον σε ξεχωριστό container */}
            <StatisticsTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                canQuestions={canQuestions}
                canSkills={canSkills}
            />

            <TabContent activeTab={activeTab} className="pt-3">
                <TabPane tabId="overview">
                    <OverviewTab level={level} data={scope} />
                </TabPane>

                <TabPane tabId="candidates">
                    <CandidatesTab jobAd={jobAdData || { candidates: scope?.candidates || [] }} />
                </TabPane>

                <TabPane tabId="steps">
                    <StepsTab
                        steps={steps}
                        selectedStepId={selectedStepId}
                        onSelectStep={handleSelectStep}
                    />
                </TabPane>

                <TabPane tabId="questions">
                    <QuestionsTab
                        step={selectedStep}
                        selectedQuestionId={selectedQuestionId}
                        onSelectQuestion={handleSelectQuestion}
                    />
                </TabPane>

                <TabPane tabId="skills">
                    <SkillsTab question={selectedQuestion} />
                </TabPane>
            </TabContent>
        </>
    );
}
