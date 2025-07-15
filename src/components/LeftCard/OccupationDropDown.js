import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

function OccupationDropdown({ occupations }) {
    if (!occupations || occupations.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {occupations.map((occupation, index) => (
                <DropdownButton
                    key={index}
                    id={`dropdown-button-${index}`}
                    title={occupation}
                    className="custom-dropdown"
                    variant="secondary"
                >
                    <Dropdown.Item as="button">Job Title 1</Dropdown.Item>
                    <Dropdown.Item as="button">Job Title 2</Dropdown.Item>
                    <Dropdown.Item as="button">Job Title 3</Dropdown.Item>
                </DropdownButton>
            ))}
        </div>
    );
}

export default OccupationDropdown;
