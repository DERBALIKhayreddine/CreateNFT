// Import required Hedera SDK classes
const { Client, PrivateKey, AccountCreateTransaction, Hbar, AccountBalanceQuery, TokenCreateTransaction,TokenAssociateTransaction } = require("@hashgraph/sdk");
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
        .setTokenName("NFT Token Test")
        .setTokenSymbol("TNFT")
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(250)
        .setSupplyKey(supplyKey)
        .freezeWith(client);

    console.log("Supply Key: " + supplyKey);
    //Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(PrivateKey.fromString(myPrivateKey));

    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    const tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log("Created NFT with Token ID: " + tokenId);


    // Max transaction fee as a constant
    const maxTransactionFee = new Hbar(20);

    //IPFS content identifiers for which we will create a NFT
    const CID = [
        Buffer.from(
            "ipfs://bafyreiao6ajgsfji6qsgbqwdtjdu5gmul7tv2v3pd6kjgcw5o65b2ogst4/metadata.json"
        ),
        Buffer.from(
            "ipfs://bafyreic463uarchq4mlufp7pvfkfut7zeqsqmn3b2x3jjxwcjqx6b5pk7q/metadata.json"
        ),
        Buffer.from(
            "ipfs://bafyreihhja55q6h2rijscl3gra7a3ntiroyglz45z5wlyxdzs6kjh2dinu/metadata.json"
        ),
        Buffer.from(
            "ipfs://bafyreidb23oehkttjbff3gdi4vz7mjijcxjyxadwg32pngod4huozcwphu/metadata.json"
        ),
        Buffer.from(
            "ipfs://bafyreie7ftl6erd5etz5gscfwfiwjmht3b52cevdrf7hjwxx5ddns7zneu/metadata.json"
        )
    ];

    // MINT NEW BATCH OF NFTs
    const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(CID) //Batch minting - UP TO 10 NFTs in single tx
        .setMaxTransactionFee(maxTransactionFee)
        .freezeWith(client);

    //Sign the transaction with the supply key
    const mintTxSign = await mintTx.sign(supplyKey);

    //Submit the transaction to a Hedera network
    const mintTxSubmit = await mintTxSign.execute(client);

    //Get the transaction receipt
    const mintRx = await mintTxSubmit.getReceipt(client);

    //Log the serial number
    console.log("Created NFT " + tokenId + " with serial number: " + mintRx.serials);

    //Create the associate transaction and sign with Account key 
    const associateAccountTx = await new TokenAssociateTransaction()
        .setAccountId(newAccountId)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(newAccountPrivateKey);

    //Submit the transaction to a Hedera network
    const associateAccountTxSubmit = await associateAccountTx.execute(client);

    //Get the transaction receipt
    const associateAccountRx = await associateAccountTxSubmit.getReceipt(client);

    //Confirm the transaction was successful
    console.log(`NFT association with Alice's account: ${associateAccountRx}\n`);


}


// Run the environment setup function
environmentSetup();
