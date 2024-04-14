import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { Button, Card, ListGroup, Modal } from 'react-bootstrap';

const Home = ({ home, provider, account, escrow, togglePop }) => {
    const [hasBought, setHasBought] = useState(false);
    const [hasLended, setHasLended] = useState(false);
    const [hasInspected, setHasInspected] = useState(false);
    const [hasSold, setHasSold] = useState(false);

    const [buyer, setBuyer] = useState(null);
    const [lender, setLender] = useState(null);
    const [inspector, setInspector] = useState(null);
    const [seller, setSeller] = useState(null);

    const [owner, setOwner] = useState(null);
    const [show, setShow] = useState(true);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        const fetchDetails = async () => {
            // Fetch roles and states
            const buyerAddress = await escrow.buyer(home.id);
            setBuyer(buyerAddress);
            const sellerAddress = await escrow.seller();
            setSeller(sellerAddress);
            const lenderAddress = await escrow.lender();
            setLender(lenderAddress);
            const inspectorAddress = await escrow.inspector();
            setInspector(inspectorAddress);

            setHasBought(await escrow.approval(home.id, buyerAddress));
            setHasSold(await escrow.approval(home.id, sellerAddress));
            setHasLended(await escrow.approval(home.id, lenderAddress));
            setHasInspected(await escrow.inspectionPassed(home.id));

            // Fetch owner if the home is not listed
            if (!(await escrow.isListed(home.id))) {
                const ownerAddress = await escrow.buyer(home.id);
                setOwner(ownerAddress);
            }
        };

        fetchDetails();
    }, [escrow, home.id]);

    // Handlers for actions
    const buyHandler = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id)
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setHasBought(true)
    };

    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        // Inspector updates status
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
    };

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Lender sends funds to contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
    };

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Seller finalize
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{home.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Card>
                    <Card.Img variant="top" src={home.image} alt={home.name} />
                    <Card.Body>
                        <Card.Title>{home.attributes[0].value} ETH</Card.Title>
                        <ListGroup variant="flush">
                            <ListGroup.Item>{home.attributes[2].value} bedrooms</ListGroup.Item>
                            <ListGroup.Item>{home.attributes[3].value} bathrooms</ListGroup.Item>
                            <ListGroup.Item>{home.attributes[4].value} sqft</ListGroup.Item>
                            <ListGroup.Item>Location: {home.address}</ListGroup.Item>
                        </ListGroup>
                        {owner ? (
                            <Card.Text className="text-brand">Owned by: {owner}</Card.Text>
                        ) : (
                            <>
                                {account === inspector && (
                                    <Button onClick={inspectHandler} disabled={hasInspected} variant="primary">
                                        Approve Inspection
                                    </Button>
                                )}
                                {account === lender && (
                                    <Button onClick={lendHandler} disabled={hasLended} variant="success">
                                        Approve & Lend
                                    </Button>
                                )}
                                {account === seller && (
                                    <Button onClick={sellHandler} disabled={hasSold} variant="warning">
                                        Approve & Sell
                                    </Button>
                                )}
                                {account !== inspector && account !== lender && account !== seller && (
                                    <Button onClick={buyHandler} disabled={hasBought} variant="info">
                                        Buy
                                    </Button>
                                )}
                            </>
                        )}
                    </Card.Body>
                </Card>
                <p className="mt-3">{home.description}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Home;
