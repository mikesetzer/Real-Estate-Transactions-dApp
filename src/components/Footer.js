import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
    return (
        <Container fluid className="text-center py-4" style={{ backgroundColor: '#f8f9fa', marginTop: 'auto' }}>
            <p className="mb-0">© {new Date().getFullYear()} BlockEstate. All rights reserved.</p>
            <p className="mb-0">Empowering Real Estate Ownership with Blockchain Technology</p>
        </Container>
    );
}

export default Footer;