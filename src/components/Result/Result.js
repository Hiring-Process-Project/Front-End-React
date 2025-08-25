// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import { Row, Col, Card, CardBody, Button, Input } from "reactstrap";
// import CandidateDropdown from "../Candidates/CandidateDropDown";
// import StepSkills from "../Candidates/StepSkills";
// import StepsDropDown from "../Candidates/StepsDropDown";
// import "../Candidates/Candidates.css";

// // Βάση API για το backend
// const API_BASE =
//     import.meta?.env?.VITE_API_BASE ||
//     process.env.REACT_APP_API_BASE ||
//     "http://localhost:8087";

// /**
//  * Δώσε στο Result το jobAdId όπως και στο Candidates.
//  * <Result jobAdId={selectedJobAdId} />
//  */
// export default function Result({ jobAdId }) {
//     // επιλεγμένα
//     const [selectedCandidate, setSelectedCandidate] = useState(null);
//     const [selectedStep, setSelectedStep] = useState(null);
//     const [selectedQuestion, setSelectedQuestion] = useState(null);
//     const [generalComment, setGeneralComment] = useState("");

//     // δεδομένα
//     const [candidates, setCandidates] = useState([]);
//     const [steps, setSteps] = useState([]); // [{id,name,questions:[{id,question}], __metrics?}]
//     const [interviewId, setInterviewId] = useState(null);

//     // loading/error
//     const [loadingCandidates, setLoadingCandidates] = useState(false);
//     const [errCandidates, setErrCandidates] = useState(null);
//     const [loadingSteps, setLoadingSteps] = useState(false);
//     const [errSteps, setErrSteps] = useState(null);
//     const [loadingAssess, setLoadingAssess] = useState(false);

//     // δεξί pane (read-only)
//     const [rightPane, setRightPane] = useState(null); // {name, skills:[]}

//     // reset όταν αλλάζει αγγελία
//     useEffect(() => {
//         setSelectedCandidate(null);
//         setSelectedStep(null);
//         setSelectedQuestion(null);
//         setGeneralComment("");

//         setCandidates([]);
//         setSteps([]);
//         setInterviewId(null);
//         setRightPane(null);
//     }, [jobAdId]);

//     /* =========================
//      * 1) Υποψήφιοι του jobAd
//      * ========================= */
//     useEffect(() => {
//         if (!jobAdId) {
//             setCandidates([]);
//             return;
//         }
//         const ac = new AbortController();
//         setLoadingCandidates(true);
//         setErrCandidates(null);

//         (async () => {
//             try {
//                 const url = `${API_BASE}/api/v1/candidates/jobad/${jobAdId}`;
//                 const res = await fetch(url, { signal: ac.signal });
//                 if (!res.ok) throw new Error(`HTTP ${res.status}`);
//                 const data = await res.json();

//                 const mapped = (Array.isArray(data) ? data : []).map((c) => ({
//                     id: c.id,
//                     name: `${c.firstName} ${c.lastName}`.trim(),
//                     email: c.email,
//                     status: c.status,
//                     cv: c.cvPath,
//                 }));
//                 setCandidates(mapped);
//             } catch (e) {
//                 if (e.name !== "AbortError") setErrCandidates(e.message || "Load error");
//             } finally {
//                 setLoadingCandidates(false);
//             }
//         })();

//         return () => ac.abort();
//     }, [jobAdId]);

//     /* ==========================================================
//      * 2) Interview (id) + steps του jobAd, και μετά questions
//      * ========================================================== */
//     useEffect(() => {
//         if (!jobAdId) return;
//         const ac = new AbortController();

//         (async () => {
//             try {
//                 setLoadingSteps(true);
//                 setErrSteps(null);

//                 // interview-details: θέλουμε interviewId + steps[]
//                 const detailsRes = await fetch(
//                     `${API_BASE}/jobAds/${jobAdId}/interview-details`,
//                     { signal: ac.signal }
//                 );
//                 if (!detailsRes.ok) throw new Error("Failed to fetch interview-details");
//                 const d = await detailsRes.json();

//                 const iid = d?.interviewId ?? d?.id ?? null; // δούλεψε και με id ή με interviewId
//                 setInterviewId(iid);

//                 // map steps σε {id,name}
//                 const baseSteps = (Array.isArray(d?.steps) ? d.steps : [])
//                     .map((s) => ({
//                         id: s.id ?? s.stepId ?? null,
//                         name: s.title ?? s.tittle ?? "",
//                         questions: [], // θα γεμίσει
//                     }))
//                     .filter((s) => s.id != null);

//                 // φέρε ερωτήσεις ανά step
//                 const withQuestions = [];
//                 for (const st of baseSteps) {
//                     try {
//                         const qsRes = await fetch(
//                             `${API_BASE}/api/v1/step/${st.id}/questions`,
//                             { signal: ac.signal }
//                         );
//                         const qs = qsRes.ok ? await qsRes.json() : [];
//                         const mappedQs = (Array.isArray(qs) ? qs : []).map((q) => ({
//                             id: q.id,
//                             question: q.name ?? q.title ?? "",
//                         }));
//                         withQuestions.push({ ...st, questions: mappedQs });
//                     } catch {
//                         withQuestions.push({ ...st, questions: [] });
//                     }
//                 }

//                 setSteps(withQuestions);
//             } catch (e) {
//                 if (e.name !== "AbortError") setErrSteps(e.message || "Load error");
//             } finally {
//                 setLoadingSteps(false);
//             }
//         })();

//         return () => ac.abort();
//     }, [jobAdId]);

//     /* ==========================================================
//      * 3) Όταν επιλεγεί υποψήφιος → φόρτωσε assessments per step
//      * ========================================================== */
//     useEffect(() => {
//         if (!interviewId || !selectedCandidate?.id) {
//             // καθάρισε μετρικές
//             setSteps((prev) => prev.map((s) => ({ ...s, __metrics: undefined })));
//             return;
//         }
//         const ac = new AbortController();
//         setLoadingAssess(true);

//         (async () => {
//             try {
//                 // Χρησιμοποιούμε το endpoint σου στον AssessmentController
//                 const url = `${API_BASE}/api/v1/assessment/interviews/${interviewId}/candidates/${selectedCandidate.id}/steps`;
//                 const r = await fetch(url, { signal: ac.signal });
//                 const data = r.ok ? await r.json() : [];

//                 const byId = new Map(
//                     (Array.isArray(data) ? data : []).map((a) => [a.stepId, a])
//                 );
//                 setSteps((prev) =>
//                     prev.map((s) => {
//                         const a = byId.get(s.id);
//                         return a
//                             ? {
//                                 ...s,
//                                 __metrics: {
//                                     totalQuestions: a.totalQuestions ?? 0,
//                                     ratedQuestions: a.ratedQuestions ?? 0,
//                                     averageScore: a.averageScore ?? null,
//                                 },
//                             }
//                             : { ...s, __metrics: undefined };
//                     })
//                 );
//             } catch {
//                 setSteps((prev) => prev.map((s) => ({ ...s, __metrics: undefined })));
//             } finally {
//                 setLoadingAssess(false);
//             }
//         })();

//         return () => ac.abort();
//     }, [interviewId, selectedCandidate?.id]);

//     /* ==========================================================
//      * 4) Επιλογή ερώτησης → φόρτωσε skills (read-only view)
//      * ========================================================== */
//     const handleSelectQ = useCallback(
//         async (step, q) => {
//             setSelectedStep(step);
//             setSelectedQuestion(q);

//             if (!q?.id) {
//                 setRightPane(null);
//                 return;
//             }
//             try {
//                 const r = await fetch(`${API_BASE}/api/v1/question/${q.id}/details`);
//                 if (!r.ok) throw new Error();
//                 const d = await r.json();
//                 const skills =
//                     (Array.isArray(d?.skills) ? d.skills : [])
//                         .map((s) => s?.title || s?.name)
//                         .filter(Boolean) || [];
//                 setRightPane({
//                     name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
//                     skills,
//                 });
//             } catch {
//                 setRightPane({
//                     name: `${step?.name ?? ""} — ${q?.question ?? ""}`,
//                     skills: [],
//                 });
//             }
//         },
//         [setRightPane]
//     );

//     const rightPaneStepObj = useMemo(() => rightPane, [rightPane]);

//     return (
//         <div>
//             {/* Επάνω σειρά: 3 panels */}
//             <Row>
//                 {/* ΑΡΙΣΤΕΡΑ: Candidates */}
//                 <Col md="4">
//                     <label className="description-labels">Candidates:</label>
//                     <Card className="panel panel--short">
//                         <CardBody>
//                             <Row className="panel__header-row">
//                                 <Col md="4"><label className="active-label">Candidate No:</label></Col>
//                                 <Col md="4"><label className="active-label">Name:</label></Col>
//                                 <Col md="4"><label className="active-label">Status:</label></Col>
//                             </Row>

//                             {!jobAdId ? (
//                                 <div style={{ opacity: 0.7 }}>Επίλεξε μία αγγελία…</div>
//                             ) : loadingCandidates ? (
//                                 <div>Φόρτωση υποψηφίων…</div>
//                             ) : errCandidates ? (
//                                 <div style={{ color: "crimson" }}>Σφάλμα: {errCandidates}</div>
//                             ) : (
//                                 <CandidateDropdown
//                                     candidates={candidates}
//                                     onSelect={(cand) => {
//                                         setSelectedCandidate(cand);
//                                         setSelectedStep(null);
//                                         setSelectedQuestion(null);
//                                         setGeneralComment("");
//                                         setRightPane(null);
//                                     }}
//                                 />
//                             )}
//                         </CardBody>
//                     </Card>
//                 </Col>

//                 {/* ΜΕΣΗ: Steps & Questions με badges/ποσοστά */}
//                 <Col md="4">
//                     <label className="description-labels">Interview Steps:</label>
//                     <Card className="panel panel--short">
//                         <CardBody>
//                             {!jobAdId ? (
//                                 <div style={{ opacity: 0.6 }}>Επίλεξε αγγελία…</div>
//                             ) : loadingSteps ? (
//                                 <div>Φόρτωση steps…</div>
//                             ) : errSteps ? (
//                                 <div style={{ color: "crimson" }}>Σφάλμα: {errSteps}</div>
//                             ) : selectedCandidate ? (
//                                 <StepsDropDown
//                                     steps={steps}
//                                     ratings={{}}               // δεν χρησιμοποιούμε fallback ratings
//                                     onSelect={handleSelectQ}
//                                     showScore={true}
//                                 />
//                             ) : (
//                                 <div style={{ opacity: 0.6 }}>Select a candidate to see steps…</div>
//                             )}

//                             {loadingAssess && selectedCandidate && (
//                                 <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
//                                     Loading ratings…
//                                 </div>
//                             )}
//                         </CardBody>
//                     </Card>
//                 </Col>

//                 {/* ΔΕΞΙΑ: Skills (READ ONLY) */}
//                 <Col md="4">
//                     <label className="description-labels">Skills for this question:</label>
//                     <Card className="panel panel--short">
//                         <CardBody>
//                             {selectedCandidate ? (
//                                 <StepSkills step={rightPaneStepObj} mode="view" />
//                             ) : (
//                                 <div style={{ opacity: 0.6 }}>Select a candidate to see skills…</div>
//                             )}
//                         </CardBody>
//                     </Card>
//                 </Col>
//             </Row>

//             {/* Κάτω σειρά: Approve/Reject + Comments */}
//             <Row className="bottom-controls" style={{ marginTop: 16, alignItems: "flex-start" }}>
//                 <Col md="4" className="d-flex justify-content-center">
//                     <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
//                         <Button color="success" style={{ minWidth: 120, height: 40 }} disabled={!selectedCandidate}>
//                             Approve
//                         </Button>
//                         <Button color="danger" style={{ minWidth: 120, height: 40 }} disabled={!selectedCandidate}>
//                             Reject
//                         </Button>
//                     </div>
//                 </Col>

//                 <Col md="8">
//                     <Card
//                         className="shadow-sm"
//                         style={{ backgroundColor: "#E5E7EB", borderRadius: "12px", height: 140 }}
//                     >
//                         <CardBody>
//                             <Input
//                                 type="textarea"
//                                 rows={2}
//                                 placeholder="Write comments about this candidate..."
//                                 value={generalComment}
//                                 onChange={(e) => setGeneralComment(e.target.value)}
//                                 style={{ resize: "vertical" }}
//                                 disabled={!selectedCandidate}
//                             />
//                         </CardBody>
//                         <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
//                             <Button color="success" style={{ width: 60, height: 36 }} disabled={!selectedCandidate}>
//                                 Save
//                             </Button>
//                         </div>
//                     </Card>
//                 </Col>
//             </Row>
//         </div>
//     );
// }
