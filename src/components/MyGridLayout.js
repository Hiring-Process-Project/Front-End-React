// YGrid.jsx
import React from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';

import SidebarCard from './LeftCard/SidebarCard';
import Header from './Header/Header';
import Candidates from './Candidates/Candidates';
import Result from './Result/Result';
import Questions from './Questions/Questions';
import Interview from './Interview/Interview';
import DescriptionCard from './Description/DescriptionCard';
import Hire from './Hire/Hire';
import Analytics from './Analytics/Analytics';

const baseUrl = 'http://localhost:8087';

const normalizeStatus = (s) =>
    String(s ?? '')
        .replace(/\u00A0/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

const LOCKED_TABS = ['candidates', 'analytics', 'hire'];

function LockNotice({ statusLabel = 'Pending' }) {
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 12,
                background: '#E5E7EB',
                border: '1px solid #bbbbbb',
                color: '#374151',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 8,
            }}
        >
            <div>🔒 Το συγκεκριμένο Job Ad είναι σε κατάσταση</div>
            <div style={{ fontWeight: 700, color: '#111827' }}>{statusLabel}</div>
            <div>και οι ενότητες αυτές δεν είναι διαθέσιμες.</div>
        </div>
    );
}

export default function MyGridLayout() {
    const [allskills, setAllSkills] = React.useState(['JavaScript', 'CSS', 'React']);
    const [selectedTab, setSelectedTab] = React.useState('description');
    const [selectedJobAdId, setSelectedJobAdId] = React.useState(null);

    const [selectedDepartment, setSelectedDepartment] = React.useState(null);
    const [selectedOccupation, setSelectedOccupation] = React.useState(null);

    const [reloadKey, setReloadKey] = React.useState(0);

    // status για το επιλεγμένο Job Ad
    const [jobStatus, setJobStatus] = React.useState(null);
    const statusLabel = jobStatus ?? '—';
    const isPending = React.useMemo(() => {
        const n = normalizeStatus(jobStatus);
        return n === 'pending' || n === 'pedding' || n === 'draft';
    }, [jobStatus]);

    React.useEffect(() => {
        fetch(`${baseUrl}/skills`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch all skills');
                return res.json();
            })
            .then((data) => {
                const skillNames = data.map((skill) => skill.name);
                setAllSkills(skillNames);
            })
            .catch(console.error);
    }, []);

    // Φέρε status όταν αλλάζει JobAd
    React.useEffect(() => {
        if (!selectedJobAdId) {
            setJobStatus(null);
            return;
        }
        const load = async () => {
            try {
                const r = await fetch(`${baseUrl}/jobAds/details?jobAdId=${selectedJobAdId}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });
                if (!r.ok) throw new Error();
                const d = await r.json();
                setJobStatus(d?.status ?? null);
            } catch {
                setJobStatus(null);
            }
        };
        load();
    }, [selectedJobAdId]);

    // Μην αφήνεις να μείνει σε κλειδωμένα tabs όταν είναι Pending
    React.useEffect(() => {
        if (isPending && LOCKED_TABS.includes(selectedTab)) {
            setSelectedTab('description');
        }
    }, [isPending, selectedTab]);

    // Ακούει publish updates (χωρίς full refetch)
    React.useEffect(() => {
        const onUpdated = (e) => {
            const { id, status } = e.detail || {};
            if (!id) return;
            // αν αφορά το τρέχον job ad, ενημέρωσε label
            if (selectedJobAdId && Number(id) === Number(selectedJobAdId)) {
                setJobStatus(status || 'Published');
            }
            // bump reloadKey για να φρεσκαριστεί το SidebarCard (status badge)
            setReloadKey((k) => k + 1);
        };
        window.addEventListener('hf:jobad-updated', onUpdated);
        return () => window.removeEventListener('hf:jobad-updated', onUpdated);
    }, [selectedJobAdId]);

    const handleJobAdDeleted = () => {
        setSelectedJobAdId(null);
        setReloadKey((k) => k + 1);
        setJobStatus(null);
        setSelectedTab('description');
    };

    const handleDepartmentSelect = (dept) => {
        setSelectedDepartment(dept);
        setSelectedOccupation(null);
    };

    const handleOccupationSelect = (occ) => {
        setSelectedOccupation({
            ...occ,
            departmentId: occ.departmentId ?? selectedDepartment?.id ?? null,
        });
    };

    const handleBackToOrganization = () => {
        setSelectedDepartment(null);
        setSelectedOccupation(null);
    };

    const disabledTabs = isPending ? LOCKED_TABS : [];

    const handleSelectTab = (key) => {
        if (disabledTabs.includes(key)) return;
        setSelectedTab(key);
    };

    const analyticsProps = {
        orgId: 3,
        apiBase: `${baseUrl}/api`,
        departmentData: selectedDepartment,
        occupationData: selectedOccupation,
        jobAdData: selectedJobAdId ? { id: selectedJobAdId } : null,
    };

    return (
        <div>
            <Header
                selectedTab={selectedTab}
                setSelectedTab={handleSelectTab}
                disabledTabs={disabledTabs}
            />

            <div style={{ padding: '2rem', paddingTop: '20px' }}>
                <Row>
                    <SidebarCard
                        onJobAdSelect={setSelectedJobAdId}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                        // scopes
                        onDepartmentSelect={handleDepartmentSelect}
                        onClearOrganization={handleBackToOrganization}
                        selectedDepartmentId={selectedDepartment?.id ?? null}
                        onOccupationSelect={handleOccupationSelect}
                        selectedOccupationId={selectedOccupation?.id ?? null}
                    />

                    <Col md="8">
                        <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6', minHeight: '450px' }}>
                            <CardBody>
                                {selectedTab === 'description' && (
                                    <DescriptionCard
                                        selectedJobAdId={selectedJobAdId}
                                        allskills={allskills}
                                        onDeleted={handleJobAdDeleted}
                                        onPublished={() => {
                                            // ενημέρωσε local status…
                                            setJobStatus('Published');
                                            // …και ενημέρωσε SidebarCard + λοιπά listeners
                                            window.dispatchEvent(
                                                new CustomEvent('hf:jobad-updated', {
                                                    detail: { id: selectedJobAdId, status: 'Published' },
                                                })
                                            );
                                        }}
                                    />
                                )}

                                {selectedTab === 'questions' && (
                                    <Questions selectedJobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'interview' && (
                                    <Interview selectedJobAdId={selectedJobAdId} />
                                )}

                                {selectedTab === 'candidates' &&
                                    (isPending ? (
                                        <LockNotice statusLabel={statusLabel} />
                                    ) : (
                                        <Candidates key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                    ))}

                                {selectedTab === 'analytics' &&
                                    (isPending ? (
                                        <LockNotice statusLabel={statusLabel} />
                                    ) : (
                                        <Analytics {...analyticsProps} onGoToOrganization={handleBackToOrganization} />
                                    ))}

                                {selectedTab === 'hire' &&
                                    (isPending ? (
                                        <LockNotice statusLabel={statusLabel} />
                                    ) : (
                                        <Hire key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                    ))}

                                {/* (optional) */}
                                {selectedTab === 'result' && <Result jobAdId={selectedJobAdId} />}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
