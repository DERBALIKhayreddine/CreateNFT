// Import required Hedera SDK classes
const { Client, PrivateKey, AccountCreateTransaction, Hbar, AccountBalanceQuery, TransferTransaction } = require("@hashgraph/sdk");
require('dotenv').config();

// Asynchronous function to set up the environment and create a new account
async function environmentSetup() {
    // Retrieve your Hedera testnet account ID and private key from .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // Validate presence of environment variables
    if (!myAccountId || !myPrivateKey) {
        throw new Error("Environment Variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present.");
    }

    // Create a Hedera Testnet client
    const client = Client.forTestnet();

    // Set your account as the client's operator
    client.setOperator(myAccountId, myPrivateKey);

    // Set default maximum transaction fee (in Hbars)
    client.setDefaultMaxTransactionFee(new Hbar(100)); // 100 Hbars

    // Set maximum payment for queries (in Hbars)
    client.setMaxQueryPayment(new Hbar(50)); // 50 Hbars

    // Generate new private and public keys for a new account
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    // Create a new account with an initial balance of 1,000 tinybars
    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey) // Assign the public key
        .setInitialBalance(Hbar.fromTinybars(1000)) // Set initial balance
        .execute(client); // Execute the transaction

    // Retrieve the receipt of the transaction to get the new account ID
    const receipt = await newAccount.getReceipt(client);
    const newAccountId = receipt.accountId;

    // Log the new account ID
    console.log("The new Account ID is:", newAccountId.toString());


    // Verify the new Account Balance

    const accountBalance = await new AccountBalanceQuery().setAccountId(newAccountId).execute(client);

    console.log("The new account balance is : " + accountBalance.hbars.toTinybars() + " Tinybars");

    //Create the NFT
    const nftCreate = await new TokenCreateTransaction()
        .setTokenName("diploma")
        .setTokenSymbol("GRAD")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(250)
        .setSupplyKey(supplyKey)
        .freezeWith(client);

    //Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(treasuryKey);

    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    const tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log("Created NFT with Token ID: " + tokenId);




}


// Run the environment setup function
environmentSetup();
