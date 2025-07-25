import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../images/search.png';
import './SearchBar.css';

export default function SearchBar({ style = {}, value = '', onChange = () => { } }) {
    return (
        <div className="search-bar-wrapper" style={style}>
            <InputGroup className="custom-search">
                <Form.Control
                    className="search-input"
                    placeholder="Search..."
                    aria-label="Search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <InputGroup.Text className="search-icon">
                    <img src={logo} alt="Search" />
                </InputGroup.Text>
            </InputGroup>
        </div>
    );
}


