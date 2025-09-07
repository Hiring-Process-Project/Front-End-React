import React from 'react';
import JobAdOverview from './JobAdOverview';
import DepartmentOverview from './DepartmentOverview';
import OccupationOverview from './OccupationOverview';
import OrganizationOverview from './OrganizationOverview';

export default function OverviewTab({ level = 'organization', data = {}, base = '/api' }) {
    // Τα ids έρχονται από το parent όπως πριν. Δεν αλλάζω καμία υλοποίηση –
    // απλώς περνάω τα σωστά props στα επί μέρους components.
    if (level === 'jobAd') {
        const jobAdId = data?.id ?? data?.jobAdId;
        return <JobAdOverview jobAdId={jobAdId} base={base} />;
    }

    if (level === 'department') {
        const deptId = data?.id ?? data?.departmentId;
        return <DepartmentOverview deptId={deptId} base={base} />;
    }

    if (level === 'occupation') {
        const deptId = data?.departmentId ?? data?.deptId;
        const occId = data?.id ?? data?.occupationId;
        return <OccupationOverview deptId={deptId} occId={occId} base={base} />;
    }

    // Organization (default)
    const orgId = data?.orgId ?? 3;
    return <OrganizationOverview orgId={orgId} base={base} />;
}
