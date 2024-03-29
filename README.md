# Lottery-Dapp
This repository is clone-coded for [Infran lecture](https://www.inflearn.com/course/ethereum-dapp/dashboard).
However, I modified the existing code as below:
- Modified the code to match the latest solidity and react versions
- Create tables quickly using react-table
- Previously, challenges could only be selected from a, b, c, and d, but modified to allow all cases

## About Lottery-Dapp
This lottery dapp is a game based on Ethereum to match the first two letters of the hash value of a future block.

I create this dapp using Truffle and React.
<p align="center">
  <img alt="Example preview image" src="./img/main_before.png" width="100%">
  <figcaption>⬆️ Screen before connecting my account to Metamask</figcaption>
</p>
<p align="center">
  <img alt="Example preview image" src="./img/main.png" width="100%">
  <figcaption>⬆️ Screen after connecting my account to Metamask</figcaption>
</p>

## Game Rules
- Match the first two characters of the +3 block hash. 
  * User submits a betting transaction containing information (betting amount = 0.0005 ETH, 2 letters).
  * Compare the value to the block hash of +3 based on the block containing the betting transaction.
- Pot money
  * Only when the result is obtained, the money transferred from the user will be accumulated in the pot money.
  * If more than one person is guessed, the first person to win wins the pot money.
  * If only one of the two letters is correct, the transfer will be refunded.
  * If the result cannot be confirmed, the transferred money will be refunded.
