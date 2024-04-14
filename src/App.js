import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  // Loads blockchain data asynchronously
  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const network = await provider.getNetwork();

    // RealEstate contract interaction
    const realEstate = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate,
      provider
    );
    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    // Fetch and prepare home metadata
    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push(metadata);
    }
    setHomes(homes);

    // Escrow contract setup
    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow,
      provider
    );
    setEscrow(escrow);

    // Handle account change
    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  // Toggle popup display
  const togglePop = (home) => {
    setHome(home);
    setToggle(!toggle);
  };

  return (
    <Container fluid>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <Container className="mt-4">
        <h3>Available Listings</h3>
        <hr />

        <Row xs={1} md={2} lg={3} className="g-4">
          {homes.map((home, index) => (
            <Col key={index}>
              <Card onClick={() => togglePop(home)}>
                <Card.Img variant="top" src={home.image} alt="Home" />
                <Card.Body>
                  <Card.Title>{home.attributes[0].value} ETH</Card.Title>
                  <Card.Text>
                    <strong>{home.attributes[2].value}</strong> bds |
                    <strong> {home.attributes[3].value}</strong> ba |
                    <strong> {home.attributes[4].value}</strong> sqft
                    <br />
                    {home.address}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </Container>
  );
}

export default App;
