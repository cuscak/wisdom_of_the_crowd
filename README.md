# Wisdom of the Crowd

## Overview

The **Wisdom of the Crowd** theory posits that collective or averaged predictions from a group can often surpass the accuracy of estimates provided by individual experts. This decentralized application (dapp) embodies the first simple implementation of this theory.

Thi dapp is a first, simple implementation of the above theory.

## Current Features

Users have the ability to:
- Pose questions with a specified threshold, which is the number of responses the questioner desires before considering the predictions reliable.
- Contribute to answers for existing questions.

For instance, a question may be structured as follows:

```
Question: {
    "question": "What will be the price of SOL at the end of the year 2023?",
    "threshold": 1000
}
```
```
Answers: {
    "count": 155,     // Number of answers received so far
    "average": "55 USD"   // The current average prediction
}
```

## Future updates will include:

- The ability to pose questions with a fixed set of possible responses, enhancing the precision of predictions since currently only numerical answers are supported for average calculations.
- The introduction of monetary incentives alongside questions to encourage user participation and engagement.


## Structure
```
├── app
│   └── frontend    :   next.js fronted files
├── migrations
├── programs
│   └── wisdom_of_the_crowd :   solana program files
└── tests   : tests for solana program
```

### Solana program
#### Installation

#### Build and Run
```bash
anchor build
```

#### Test
Make changes in your "Anchor.toml":
```
[provider]
cluster = "Localnet"
wallet = "[path/to/your/wallet.json]"
```
and then run:
```bash
anchor test
```

### Frontend
#### Installation

```bash
cd app/frontend/
npm install
# or
yarn install
```

#### Build and Run

Next, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.