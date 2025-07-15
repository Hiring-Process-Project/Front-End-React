import { Row, Button } from 'reactstrap';
import './Description/skills.css';

function Steps({ steps, selectedIndex, hoveredIndex, onSelect, onHover }) {
    return (
        <Row
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '5px',
                justifyContent: 'center'
            }}
        >
            {steps &&
                steps.map((step, index) => (
                    <Button
                        key={index}
                        id={`skills-button-${index}`}
                        title={step}
                        className={`skill-pill 
                            ${selectedIndex === index ? 'selected' : ''}
                            ${hoveredIndex === index ? 'hovered' : ''}
                        `}
                        size="sm"
                        onClick={() => onSelect(index)}
                        onMouseEnter={() => onHover(index)}
                        onMouseLeave={() => onHover(null)}
                    >
                        {step}
                    </Button>
                ))}
        </Row>
    );
}

export default Steps;
