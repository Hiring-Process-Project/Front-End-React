import React from 'react';
import { Collapse, Button } from 'reactstrap';
import './OccupationDropdown.css';

function OccupationDropdown({
    occupations = [],
    openIndex,
    onToggle,
    selectedItemIndex,
    onSelectItem,
    hoveredItemIndex,
    onHoverItem
}) {
    return (
        <div className="occupation-container">
            {occupations.map((occupation, index) => (
                <div key={index} className="occupation-box">
                    <Button
                        onClick={() => onToggle(index)}
                        className="occupation-btn"
                        block
                    >
                        {occupation.name}
                    </Button>

                    <Collapse isOpen={openIndex === index}>
                        <div className="job-title-box">
                            {(occupation.jobTitles || []).map((title, i) => (
                                <Button
                                    key={i}
                                    className={`job-title-item
                                        ${selectedItemIndex?.occupationIndex === index && selectedItemIndex?.itemIndex === i ? 'selected' : ''}
                                        ${hoveredItemIndex?.occupationIndex === index && hoveredItemIndex?.itemIndex === i ? 'hovered' : ''}
                                    `}
                                    onClick={() => onSelectItem(index, i)}
                                    onMouseEnter={() => onHoverItem({ occupationIndex: index, itemIndex: i })}
                                    onMouseLeave={() => onHoverItem(null)}
                                >
                                    {title}
                                </Button>
                            ))}
                        </div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
}

export default OccupationDropdown;
