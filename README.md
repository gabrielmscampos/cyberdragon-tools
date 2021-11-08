# binaryx-tools

Tools for simulating characters rewards in BinaryX CyberDragon Metaverse and integration with core smart contracts for fetching heroes statistics, mining data and income.

# Telegram Bot

This projects ships a telegram bot code to manage addresses tokens via telegram chatID using mongoDB for storing users credentials. The chatID property is used to identify the user and his nft tokens.


## Check token price
```
Command: /t {token}
Description: Get the last price of the token.

{token} str: token symbol
```

## Check price token of all registered tokens in MongoDB
```
Command: /p
Description: Get the last price of all registered tokens.
```

## Simulate hero monetary income
```
Command: /c {p} {s} {l}
Description: Compute NFT hero monetary income.

{p} int: primary hero status
{s} int: secondary hero status
{l} int: level
```

## Simulate monetary income of multiple heroes
```
Command: /cl {p1},{p2},... {s1},{s2},... {l1},{l2},...
Description: Compute monetary income of mulitple heroes.

{p1},{p2},...,{pn} int: primary hero status separeted by comma (,)
{s1},{s2},...,{sn} int: secondary hero status separeted by comma (,)
{l1},{l2},...,{ln} int: level separeted by comma (,)
```

## Check account
```
Command: /account
Description: Check account status (use telegram chatID in backend)
```

## Register account
```
Command: /newAccount {user} {address}
Description: Register new account in MongoDB

{user} str: User name (not used in telegram bot)
{address} str: Wallet public address
```

## Register token into account
```
Command: /addToken {tokenID}
Description: Register NFT hero into user wallet (use telegram chatID in backend)

{tokenID} str: NFT token id
```

## Remove token from account
```
Command: /rmToken {tokenID}
Description: Remove NFT hero from user wallet (use telegram chatID in backend)

{tokenID} str: NFT token id
```

## Show account monetary statistics
```
Command: /w
Description: Show account statistics (monetary income, current heroes gold balance)
```
