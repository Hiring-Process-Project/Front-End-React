// import React, { useState } from 'react';
// import { Button, Collapse, Input, Card, CardBody } from 'reactstrap';

// function StepSkills({ step, onRate }) {
//     const [openIndex, setOpenIndex] = useState(null);
//     // { [i]: { rating: '80', comment: '...' } }
//     const [values, setValues] = useState({});

//     if (!step) return <div style={{ opacity: .6 }}>Select a step to see skills…</div>;

//     const title = step.name || step;
//     const skills = step.skills || [];

//     const toggleSkill = (i) => setOpenIndex(prev => (prev === i ? null : i));

//     const handleRatingChange = (i, val) => {
//         setValues(prev => ({ ...prev, [i]: { ...(prev[i] || {}), rating: val } }));
//     };

//     const handleCommentChange = (i, val) => {
//         setValues(prev => ({ ...prev, [i]: { ...(prev[i] || {}), comment: val } }));
//     };

//     const handleSave = (i, e) => {
//         e.stopPropagation(); // να μην κλείνει το collapse
//         const v = values[i] || {};
//         const ratingNum = Number(v.rating);

//         // validation
//         if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 100) {
//             alert('Please enter a rating between 0 and 100.');
//             return;
//         }

//         const payload = {
//             skill: typeof skills[i] === 'string' ? { name: skills[i] } : skills[i],
//             rating: ratingNum,
//             comment: v.comment || ''
//         };

//         if (onRate) {
//             onRate(payload); // στείλ’το στον parent
//         } else {
//             console.log('Saved skill rating:', payload);
//         }
//     };

//     return (
//         <div className="candidate-container">
//             <h6 style={{ marginTop: 0 }}>{title}</h6>

//             {skills.map((s, i) => (
//                 <div key={i} className="skill-box">
//                     <Button
//                         onClick={() => toggleSkill(i)}
//                         className={`candidate-btn ${openIndex === i ? 'active' : ''}`}
//                         block
//                         aria-expanded={openIndex === i}
//                         aria-controls={`skill-collapse-${i}`}
//                         style={{ textAlign: 'left', fontSize: '11px' }}
//                     >
//                         <div className="skill-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <span className="skill-text">{typeof s === 'string' ? s : s.name}</span>
//                         </div>

//                         <Collapse isOpen={openIndex === i} id={`skill-collapse-${i}`}>
//                             <Card
//                                 style={{ marginTop: 8, overflow: 'hidden', backgroundColor: '#f6f6f6' }}
//                                 onClick={(e) => e.stopPropagation()}
//                             >
//                                 <CardBody>
//                                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
//                                         {/* Rating */}
//                                         <Input
//                                             id={`rating-${i}`}
//                                             type="number"
//                                             min={0}
//                                             max={100}
//                                             placeholder="Rate this skill (0–100)"
//                                             value={values[i]?.rating ?? ''}
//                                             onChange={(e) => handleRatingChange(i, e.target.value)}
//                                             onClick={(e) => e.stopPropagation()}
//                                             onFocus={(e) => e.stopPropagation()}
//                                         />

//                                         {/* Comment */}
//                                         <Input
//                                             id={`comment-${i}`}
//                                             type="textarea"
//                                             rows={3}
//                                             placeholder="Write your comments…"
//                                             value={values[i]?.comment ?? ''}
//                                             onChange={(e) => handleCommentChange(i, e.target.value)}
//                                             onClick={(e) => e.stopPropagation()}
//                                             onFocus={(e) => e.stopPropagation()}
//                                             style={{ resize: 'vertical' }}
//                                         />

//                                         {/* Save / Rate */}
//                                         <div className="d-flex justify-content-end">
//                                             <Button
//                                                 color="success"
//                                                 size="sm"
//                                                 onClick={(e) => handleSave(i, e)}
//                                                 disabled={values[i]?.rating === '' || values[i]?.rating == null}
//                                             >
//                                                 Save
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 </CardBody>
//                             </Card>
//                         </Collapse>
//                     </Button>
//                 </div>
//             ))}
//         </div>
//     );
// }

// export default StepSkills;

// StepSkills.jsx
import React, { useState } from 'react';
import { Button, Collapse, Input, Card, CardBody, Badge } from 'reactstrap';

function StepSkills({ step, onRate, ratings = {}, mode = 'edit' }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [values, setValues] = useState({});
    if (!step) return <div style={{ opacity: .6 }}>Select a step to see skills…</div>;

    const FONT_SIZE = 12; // <-- ζητούμενο μέγεθος
    const title = step.name || step;
    const skills = step.skills || [];
    const toggleSkill = (i) => setOpenIndex(prev => (prev === i ? null : i));
    const handleRatingChange = (i, val) => setValues(p => ({ ...p, [i]: { ...(p[i] || {}), rating: val } }));
    const handleCommentChange = (i, val) => setValues(p => ({ ...p, [i]: { ...(p[i] || {}), comment: val } }));

    const handleSave = (i, e) => {
        e?.stopPropagation();
        const s = skills[i];
        const rating = Number(values[i]?.rating);
        if (!Number.isFinite(rating) || rating < 0 || rating > 100) return alert('0–100');
        const payload = { skill: typeof s === 'string' ? { name: s } : s, rating, comment: values[i]?.comment || '' };
        onRate?.(payload);
    };

    // helper για να βρούμε rating/comment στο read-only
    const getSkillId = (s) => (s && s.id) || `${title}::${typeof s === 'string' ? s : s.name}`;
    const readOnlyFor = (s) => ratings[getSkillId(s)] || null;

    return (
        <div className="candidate-container">
            {/* Heading 12px */}
            <h6 style={{ marginTop: 0, fontSize: `${FONT_SIZE}px`, lineHeight: 1.25 }}>{title}</h6>

            {skills.map((s, i) => {
                const skillName = typeof s === 'string' ? s : s.name;

                // ----- VIEW MODE (Result) -----
                if (mode === 'view') {
                    const ro = readOnlyFor(s); // {value, comment}
                    return (
                        <div key={i} className="skill-box">
                            <Card className="shadow-sm" style={{ backgroundColor: '#F6F6F6' }}>
                                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {/* Skill name 12px */}
                                        <span className="skill-text" style={{ fontWeight: 600, fontSize: `${FONT_SIZE}px`, lineHeight: 1.25 }}>
                                            {skillName}
                                        </span>
                                        <Badge pill color={ro?.value != null ? 'success' : 'secondary'}>
                                            {ro?.value != null ? `${ro.value}%` : '—'}
                                        </Badge>
                                    </div>
                                    {ro?.comment ? (
                                        <div style={{ fontSize: 12, opacity: .85 }}>{ro.comment}</div>
                                    ) : (
                                        <div style={{ fontSize: 12, opacity: .55, fontStyle: 'italic' }}>No comments.</div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    );
                }

                // ----- EDIT MODE (Candidates) -----
                return (
                    <div key={i} className="skill-box">
                        <Button
                            onClick={() => toggleSkill(i)}
                            className={`candidate-btn ${openIndex === i ? 'active' : ''}`}
                            block
                            aria-expanded={openIndex === i}
                            aria-controls={`skill-collapse-${i}`}
                            // Button text 12px (ώστε και ο τίτλος skill να φαίνεται 12px)
                            style={{ textAlign: 'left', fontSize: `${FONT_SIZE}px`, lineHeight: 1.25 }}
                        >
                            <div className="skill-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Skill name 12px */}
                                <span className="skill-text" style={{ fontSize: `${FONT_SIZE}px`, lineHeight: 1.25 }}>
                                    {skillName}
                                </span>
                            </div>

                            <Collapse isOpen={openIndex === i} id={`skill-collapse-${i}`}>
                                <Card style={{ marginTop: 8, overflow: 'hidden', backgroundColor: '#f6f6f6' }}
                                    onClick={(e) => e.stopPropagation()}>
                                    <CardBody>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Input
                                                id={`rating-${i}`}
                                                type="number" min={0} max={100}
                                                placeholder="Rate this skill (0–100)"
                                                value={values[i]?.rating ?? ''}
                                                onChange={(e) => handleRatingChange(i, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.stopPropagation()}
                                            />
                                            <Input
                                                id={`comment-${i}`}
                                                type="textarea" rows={3}
                                                placeholder="Write your comments…"
                                                value={values[i]?.comment ?? ''}
                                                onChange={(e) => handleCommentChange(i, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.stopPropagation()}
                                                style={{ resize: 'vertical' }}
                                            />
                                            <div className="d-flex justify-content-end">
                                                <Button
                                                    color="success" size="sm"
                                                    onClick={(e) => handleSave(i, e)}
                                                    disabled={values[i]?.rating === '' || values[i]?.rating == null}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Collapse>
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}

export default StepSkills;
