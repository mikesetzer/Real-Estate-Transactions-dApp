import React, {Link} from 'react';
import { ethers } from 'ethers';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';

const Navigation = ({ account, setAccount }) => {
    const connectHandler = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = ethers.utils.getAddress(accounts[0]);
        setAccount(account);
    };

    return (
      <Container>
        <Navbar expand="lg" className="justify-content-between">
          <Nav>
              <Button className="custom-outline-primary px-3 me-2" as={Nav.Link} href="#buy">Buy</Button>
              <Button className="custom-outline-primary px-3" as={Nav.Link} href="#sell">Sell</Button>
          </Nav>
          <Navbar.Brand className="mx-auto">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h1 className="text-brand">BlockEstate</h1>
            </a>
        </Navbar.Brand>
          {account ? (
            <Button variant="outline-success" disabled className="ms-lg-5">
                {account.slice(0, 6) + '...' + account.slice(38, 42)}
            </Button>
          ) : (
            <Button className="custom-outline-primary ms-lg-5" onClick={connectHandler}>
                Connect
            </Button>
          )}
        </Navbar>
      </Container>
    );
}

export default Navigation;
