import { Row, Button } from 'reactstrap';
import './Description/skills.css';

function Steps({ steps }) {
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
                        className={`skill-pill `}

                        size="sm"
                    >
                        {step}
                    </Button>
                ))}
        </Row>
    );
}

export default Steps;