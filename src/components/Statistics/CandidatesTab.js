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

/* ========== Local small component ========== */
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

/* ========== TAB ========== */
export default class CandidatesTab extends PureComponent {
    render() {
        const { jobAd } = this.props;

        const candidates = jobAd?.candidates ?? [];
        const counts = countByStatus(candidates);
        const scores = candidates
            .map(c => overallCandidateScore(c.ratings || {}))
            .filter(Number.isFinite);
        const avgScore = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%'
            : '—';

        return (
            <>
                <Row className="g-3">
                    <Col md="3"><Kpi title="Approved" value={counts.approved} /></Col>
                    <Col md="3"><Kpi title="Rejected" value={counts.rejected} /></Col>
                    <Col md="3"><Kpi title="Pending" value={counts.pending} /></Col>
                    <Col md="3"><Kpi title="Avg Score" value={avgScore} /></Col>
                </Row>

                <div style={{ marginTop: 16, minHeight: 220 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Candidates statistics</div>
                    <div style={{ opacity: .7 }}>Εδώ θα μπουν histogram, πίνακες κ.λπ.</div>
                </div>
            </>
        );
    }
}
