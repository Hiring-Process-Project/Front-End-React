import React, { useEffect, useState } from 'react';
import AnalyticsTabsHeader from './AnalyticsTabsHeader';
import StepsTab from './StepsTab';
import QuestionsTab from './QuestionsTab';
import SkillsTab from './SkillsTab';
import CandidatesTab from './CandidatesTab';
import OverviewTab from './OverviewTab';

export default function AnalyticsShell({ jobAdId }) {
    const [activeTab, setActiveTab] = useState('overview');

    // “κατάσταση” επιλογών που ξεκλειδώνουν τα tabs
    const [selectedStepId, setSelectedStepId] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    // όταν αλλάζει jobAd, καθάρισε selections
    useEffect(() => {
        setSelectedStepId(null);
        setSelectedQuestionId(null);
        // προαιρετικά γύρνα στην αρχή
        // setActiveTab('overview');
    }, [jobAdId]);

    // όταν αλλάζει step, καθάρισε την ερώτηση
    useEffect(() => {
        setSelectedQuestionId(null);
    }, [selectedStepId]);

    // αν ο χρήστης πάει Questions χωρίς step -> σπρώξε τον πίσω στο Steps
    useEffect(() => {
        if (activeTab === 'questions' && !selectedStepId) setActiveTab('steps');
    }, [activeTab, selectedStepId]);

    // αν ο χρήστης πάει Skills χωρίς question -> σπρώξε τον πίσω στο Questions
    useEffect(() => {
        if (activeTab === 'skills' && !selectedQuestionId) setActiveTab('questions');
    }, [activeTab, selectedQuestionId]);

    const canSteps = !!jobAdId;
    const canQuestions = !!selectedStepId;
    const canSkills = !!selectedQuestionId;

    return (
        <div>
            <AnalyticsTabsHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                canSteps={canSteps}
                canQuestions={canQuestions}
                canSkills={canSkills}
            />

            {activeTab === 'overview' && <OverviewTab jobAdId={jobAdId} />}
            {activeTab === 'candidates' && <CandidatesTab jobAdId={jobAdId} />}

            {activeTab === 'steps' && (
                <StepsTab
                    jobAdId={jobAdId}
                    onSelectStep={setSelectedStepId}   // <-- πολύ σημαντικό
                />
            )}

            {activeTab === 'questions' && (
                <QuestionsTab
                    jobAdId={jobAdId}
                    stepId={selectedStepId}
                    onSelectQuestion={setSelectedQuestionId} // <-- πολύ σημαντικό
                />
            )}

            {activeTab === 'skills' && (
                <SkillsTab
                    jobAdId={jobAdId}
                    questionId={selectedQuestionId}
                />
            )}
        </div>
    );
}
