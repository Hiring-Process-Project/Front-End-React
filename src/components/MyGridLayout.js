import React from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';

import SidebarCard from './LeftCard/SidebarCard';
import Header from './Header/Header';
import Candidates from './Candidates/Candidates';
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

    React.useEffect(() => {
        if (isPending && LOCKED_TABS.includes(selectedTab)) {
            setSelectedTab('description');
        }
    }, [isPending, selectedTab]);

    React.useEffect(() => {
        const onUpdated = (e) => {
            const { id, status } = e.detail || {};
            if (!id) return;
            if (selectedJobAdId && Number(id) === Number(selectedJobAdId)) {
                setJobStatus(status || 'Published');
            }
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

    const disabledTabs = isPending ? LOCKED_TABS : [];

    const handleSelectTab = (key) => {
        if (disabledTabs.includes(key)) return;
        setSelectedTab(key);
    };

    return (
        // 1) Το εξωτερικό container γεμίζει 100vh και ΚΟΒΕΙ το window scroll (βοηθάει και το global CSS)
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header
                selectedTab={selectedTab}
                setSelectedTab={handleSelectTab}
                disabledTabs={disabledTabs}
            />

            {/* 2) Περιεχόμενο: flex:1 + minHeight:0 για να μην “σπρώχνει” ύψος */}
            <div
                style={{
                    flex: 1,
                    padding: '2rem',
                    paddingTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                {/* 3) Η Row πρέπει να μπορεί να συμπιεστεί (minHeight:0) */}
                <Row style={{ flex: 1, minHeight: 0, width: '100%' }}>
                    {/* Sidebar: φρόντισε στο root component του SidebarCard να έχει minHeight:0 και
              το δικό του overflowY:'auto' αν χρειαστεί */}
                    {/* <SidebarCard
                        onJobAdSelect={setSelectedJobAdId}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                        onDepartmentSelect={setSelectedDepartment}
                        onClearOrganization={() => {
                            setSelectedDepartment(null);
                            setSelectedOccupation(null);
                        }}
                        selectedDepartmentId={selectedDepartment?.id ?? null}
                        onOccupationSelect={setSelectedOccupation}
                        selectedOccupationId={selectedOccupation?.id ?? null}
                    /> */}
                    <SidebarCard
                        onJobAdSelect={(id) => {
                            // Επιλογή Job Ad ⇒ καθάρισε occupation (μένει το department)
                            setSelectedJobAdId(id);
                            if (id != null) setSelectedOccupation(null);
                        }}
                        selectedJobAdId={selectedJobAdId}
                        reloadKey={reloadKey}
                        onDepartmentSelect={(dept) => {
                            // Επιλογή Department ⇒ καθάρισε occupation & jobAd
                            setSelectedDepartment(dept);
                            setSelectedOccupation(null);
                            setSelectedJobAdId(null);
                        }}
                        onClearOrganization={() => {
                            setSelectedDepartment(null);
                            setSelectedOccupation(null);
                            setSelectedJobAdId(null);
                        }}
                        selectedDepartmentId={selectedDepartment?.id ?? null}
                        onOccupationSelect={(occ) => {
                            // δέχεται είτε object είτε number ⇒ κράτα object στο state
                            const obj = (occ && typeof occ === 'object') ? occ : { id: Number(occ) || null };
                            setSelectedOccupation(obj);
                            setSelectedJobAdId(null);
                        }}
                        selectedOccupationId={selectedOccupation?.id ?? null}
                    />


                    {/* Δεξί panel */}
                    <Col md="8" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Card
                            className="shadow-sm"
                            style={{
                                backgroundColor: '#F6F6F6',
                                flex: 1,
                                minHeight: 0,       // ✅ επιτρέπει στο CardBody να διαχειριστεί ύψος
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',  // ❗️ ΜΗ scroll εδώ
                            }}
                        >
                            {/* 4) Το CardBody επίσης δεν κάνει scroll.
                     Τα child components (DescriptionCard, Interview, κ.λπ.) έχουν δικό τους εσωτερικό scroll. */}
                            <CardBody
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {selectedTab === 'description' && (
                                    <DescriptionCard
                                        selectedJobAdId={selectedJobAdId}
                                        allskills={allskills}
                                        onDeleted={handleJobAdDeleted}
                                        onPublished={() => {
                                            setJobStatus('Published');
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
                                        <Analytics
                                            orgId={3}
                                            apiBase={`${baseUrl}/api`}
                                            departmentData={selectedDepartment}
                                            occupationData={selectedOccupation}
                                            jobAdData={selectedJobAdId ? { id: selectedJobAdId } : null}
                                            onGoToOrganization={() => {
                                                // καθάρισε όλες τις επιλογές όταν πατιέται το κουμπί Organization
                                                setSelectedJobAdId(null);
                                                setSelectedDepartment(null);
                                                setSelectedOccupation(null);
                                            }}
                                        />
                                    ))}


                                {selectedTab === 'hire' &&
                                    (isPending ? (
                                        <LockNotice statusLabel={statusLabel} />
                                    ) : (
                                        <Hire key={selectedJobAdId ?? 'no-job'} jobAdId={selectedJobAdId} />
                                    ))}

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
