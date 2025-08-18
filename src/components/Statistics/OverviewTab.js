import React, { PureComponent } from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';

/* ========== Local helpers (ΜΟΝΟ για αυτό το tab) ========== */
const countByStatus = (cands = []) => {
    let approved = 0, rejected = 0, pending = 0;
    for (const c of cands) {
        const s = (c?.status || '').toLowerCase();
        if (s === 'approved') approved++;
        else if (s === 'rejected') rejected++;
        else pending++;
    }
    return { approved, rejected, pending };
};

const overallCandidateScore = (ratings = {}) => {
    const vals = Object.values(ratings).map(r => r?.value).filter(Number.isFinite);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

const decileHistogram = (scores = []) => {
    const bins = Array.from({ length: 10 }, () => 0);
    for (const s of scores) {
        if (!Number.isFinite(s)) continue;
        const idx = Math.min(9, Math.floor(Math.max(0, Math.min(100, s)) / 10));
        bins[idx] += 1;
    }
    return bins;
};

const avgCandsPerJob = (jobAds = []) => {
    if (!jobAds.length) return '—';
    const total = jobAds.reduce((s, ad) => s + (ad?.candidates?.length || 0), 0);
    return (total / jobAds.length).toFixed(1);
};

/* ========== Local small components ========== */
class Kpi extends PureComponent {
    render() {
        const { title, value } = this.props;
        return (
            <Card className="shadow-sm">
                <CardBody>
                    <div style={{ fontSize: 12, opacity: .7 }}>{title}</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
                </CardBody>
            </Card>
        );
    }
}

class DecileList extends PureComponent {
    render() {
        const { scores } = this.props;
        const bins = decileHistogram(scores);
        const labels = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80–89', '90–100'];

        return (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', rowGap: 6 }}>
                {bins.map((v, i) => (
                    <React.Fragment key={i}>
                        <div>{labels[i]}</div>
                        <div style={{ background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', height: 10 }}>
                            <div style={{ width: `${Math.min(100, v * 10)}%`, height: '100%' }} />
                        </div>
                        <div style={{ textAlign: 'right' }}>{v}</div>
                    </React.Fragment>
                ))}
            </div>
        );
    }
}

/* ========== TAB ========== */
export default class OverviewTab extends PureComponent {
    render() {
        const { level, data } = this.props;

        const candidates = data?.candidates ?? [];
        const counts = countByStatus(candidates);
        const scores = candidates
            .map(c => overallCandidateScore(c.ratings || {}))
            .filter(Number.isFinite);
        const avgScore = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%'
            : '—';

        const extraKpis = (() => {
            switch (level) {
                case 'department':
                    return [
                        { title: 'Job Ads', value: (data?.jobAds?.length ?? 0) },
                        { title: 'Avg Candidates/Job', value: avgCandsPerJob(data?.jobAds) },
                    ];
                case 'occupation':
                    return [
                        { title: 'Job Ads in Occupation', value: (data?.jobAds?.length ?? 0) },
                        { title: 'Avg Candidates/Job', value: avgCandsPerJob(data?.jobAds) },
                    ];
                case 'jobAd':
                    return [
                        { title: '# Candidates', value: candidates.length },
                        { title: 'Steps', value: (data?.steps?.length ?? 0) },
                    ];
                default:
                    return [];
            }
        })();

        return (
            <>
                <Row className="g-3">
                    <Col md="3"><Kpi title="Approved" value={counts.approved} /></Col>
                    <Col md="3"><Kpi title="Rejected" value={counts.rejected} /></Col>
                    <Col md="3"><Kpi title="Pending" value={counts.pending} /></Col>
                    <Col md="3"><Kpi title="Avg Score" value={avgScore} /></Col>
                </Row>

                <Row className="g-3 mt-1">
                    {extraKpis.map((k, i) => (
                        <Col md="3" key={i}><Kpi title={k.title} value={k.value} /></Col>
                    ))}
                </Row>

                <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Score distribution (0–100, ανά 10)</div>
                    <DecileList scores={scores} />
                </div>
            </>
        );
    }
}
