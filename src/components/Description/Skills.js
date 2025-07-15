import { Row, Button } from 'reactstrap';
import './skills.css';

function Skills({ requiredskills, onSkillClick, selectedSkill }) {
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
            {requiredskills &&
                requiredskills.map((skill, index) => (
                    <Button
                        key={index}
                        id={`skills-button-${index}`}
                        title={skill}
                        className={`skill-pill ${selectedSkill === skill ? 'selected' : ''}`}
                        onClick={() => onSkillClick && onSkillClick(skill)}
                        color={selectedSkill === skill ? 'primary' : 'outline-primary'}
                        size="sm"
                    >
                        {skill}
                    </Button>
                ))}
        </Row>
    );
}

export default Skills;
