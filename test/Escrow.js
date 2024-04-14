const { expect } = require('chai');
const { ethers } = require('hardhat');

/**
 * Converts Ether to wei units
 */
const tokens = (n) => ethers.utils.parseUnits(n.toString(), 'ether');

/**
 * Test Escrow contract.
 */
describe('Escrow', () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;

    /**
     * Sets up test environment
     */
    beforeEach(async () => {
        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Deploy Real Estate contract
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();

        // Mint an NFT
        await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");

        // Deploy Escrow contract
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);

        // Seller approves the Escrow contract to manage the NFT
        await realEstate.connect(seller).approve(escrow.address, 1);

        // Seller lists the property in the Escrow contract
        await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5));
    });

    /**
     * Tests for contract deployment and initialization
     */
    describe('Deployment', () => {
        it('correctly sets the NFT address', async () => {
            expect(await escrow.nftAddress()).to.equal(realEstate.address);
        });

        it('correctly sets the seller address', async () => {
            expect(await escrow.seller()).to.equal(seller.address);
        });

        it('correctly sets the inspector address', async () => {
            expect(await escrow.inspector()).to.equal(inspector.address);
        });

        it('correctly sets the lender address', async () => {
            expect(await escrow.lender()).to.equal(lender.address);
        });
    });

    /**
     * Tests for listing properties in the Escrow contract
     */
    describe('Listing', () => {
        it('correctly marks the property as listed', async () => {
            const isListed = await escrow.isListed(1);
            expect(isListed).to.be.true;
        });

        it('correctly records the buyer', async () => {
            const recordedBuyer = await escrow.buyer(1);
            expect(recordedBuyer).to.equal(buyer.address);
        });

        it('correctly records the purchase price', async () => {
            const purchasePrice = await escrow.purchasePrice(1);
            expect(purchasePrice).to.equal(tokens(10));
        });

        it('correctly records the escrow amount', async () => {
            const escrowAmount = await escrow.escrowAmount(1);
            expect(escrowAmount).to.equal(tokens(5));
        });

        it('transfers NFT ownership to the Escrow contract', async () => {
            const currentOwner = await realEstate.ownerOf(1);
            expect(currentOwner).to.equal(escrow.address);
        });
    });

    /**
     * Tests for earnest money deposits
     */
    describe('Deposits', () => {
        beforeEach(async () => {
            await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
        });

        it('updates the contract balance with the deposit amount', async () => {
            const balance = await escrow.getBalance();
            expect(balance).to.equal(tokens(5));
        });
    });

    /**
     * Tests for the property inspection process
     */
    describe('Inspection', () => {
        beforeEach(async () => {
            await escrow.connect(inspector).updateInspectionStatus(1, true);
        });

        it('correctly updates the inspection status', async () => {
            const status = await escrow.inspectionPassed(1);
            expect(status).to.be.true;
        });
    });

    /**
     * Tests for the sale approval process
     */
    describe('Approval', () => {
        beforeEach(async () => {
            await Promise.all([
                escrow.connect(buyer).approveSale(1),
                escrow.connect(seller).approveSale(1),
                escrow.connect(lender).approveSale(1),
            ]);
        });

        it('correctly records approvals', async () => {
            const buyerApproval = await escrow.approval(1, buyer.address);
            const sellerApproval = await escrow.approval(1, seller.address);
            const lenderApproval = await escrow.approval(1, lender.address);
            expect(buyerApproval).to.be.true;
            expect(sellerApproval).to.be.true;
            expect(lenderApproval).to.be.true;
        });
    });

    /**
     * Tests for finalizing the sale and transferring ownership
     */
    describe('Sale', () => {
        beforeEach(async () => {
            await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await escrow.connect(inspector).updateInspectionStatus(1, true);
            await escrow.connect(buyer).approveSale(1);
            await escrow.connect(seller).approveSale(1);
            await escrow.connect(lender).approveSale(1);
            await lender.sendTransaction({ to: escrow.address, value: tokens(5) });
            await escrow.connect(seller).finalizeSale(1);
        });

        it('transfers NFT ownership to the buyer', async () => {
            expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
        });

        it('resets the escrow contract balance to zero', async () => {
            expect(await escrow.getBalance()).to.equal(0);
        });
    });
});
