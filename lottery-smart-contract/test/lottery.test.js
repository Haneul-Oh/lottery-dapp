const Lottery = artifacts.require("Lottery");
const assertRevert = require('./_assertRevert');
const expectEvent = require('./_expectEvent');

contract('Lottery', function([deployer, user1, user2]){ 
    let lottery;
    let BET_AMOUNT = 5 * 10 ** 15;
    let BET_BLOCK_INTERVAL = 3;
    let BLOCK_LIMIT = 256;
    let BET_AMOUNT_BN = new web3.utils.BN(BET_AMOUNT);

    beforeEach(async () => {
        lottery = await Lottery.new(); // 새로 배포
    })

    it('GetPot() should return current pot', async () => { // it.only: 특정 테스트만을 위해서
        let pot = await lottery.getPot();
        console.log(`pot: ${pot}`)
        assert.equal(0, pot, "ERROR")
    })

    describe('Bet()', function () {
        it('Should fail when the bet money < 0.005 ETH', async () => { // TX 가 ERROR 반환하는지 확인하는 테스트
            await assertRevert(lottery.bet('0xab', {from: user1, value: BET_AMOUNT-1}));
        })
        it('Should put the bet to the bet queue with 1 bet', async () => { // 성공한 TX에 대해서 
            let receipt = await lottery.bet('0xab', {from: user1, value: BET_AMOUNT});
            
            // pot money should 0 because the bet amount has not yet been received
            let pot = await lottery.getPot();
            assert.equal(0, pot);

            // contractBalance should be 1 * BET_AMOUNT because user1 sent BET_AMOUNT to contract.
            let contractBalance = await web3.eth.getBalance(lottery.address);
            assert.equal(contractBalance, BET_AMOUNT); 

            // the value of _bet at 0 index should be ...
            let bet = await lottery.getBetInfo(0);
            let currentBlockNum = await web3.eth.getBlockNumber();
            assert.equal(bet.answerBlockNum, currentBlockNum + BET_BLOCK_INTERVAL, "answerBlockNum"); 
            assert.equal(bet.bettor, user1, "bettor"); 
            assert.equal(bet.challanges, '0xab', "challanges"); 

            // check the Bet event
            await expectEvent.inLogs(receipt.logs, 'BET');  
        })
    
    })

    describe('isMatch()', function () {
        let matchResult;
        let blockHash = '0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd';

        it('Should return BettingResult.Win when two letters match', async () => {
            matchResult = await lottery.isMatch('0xab', blockHash); 
            console.log(matchResult[0])
        })
        it('Should return BettingResult.Draw when one letter matches', async () => {
            matchResult = await lottery.isMatch('0xac', blockHash);
            assert.equal(1, matchResult[0])
            matchResult = await lottery.isMatch('0xcb', blockHash);
            assert.equal(1, matchResult[0])
        })
        it('Should return BettingResult.Fail when both letters are not matched', async () => {
            matchResult = await lottery.isMatch('0xcc', blockHash);
            assert.equal(2, matchResult[0])
        })
    })

    describe.only('ditribute()', function () {

        describe('When blockStatus is Checkable', function () {
            it('Should transfer the pot money to user when user match two letters', async () => { 
                await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})

                // Try many betting and user1 win at 1-th betting
                await lottery.betAndDistribute('0x01', {from: user2, value: BET_AMOUNT}); // wil in 1-th block (ans: 4-th block) // FAIL
                await lottery.betAndDistribute('0x02', {from: user2, value: BET_AMOUNT}); // wil in 2-th block (ans: 5-th block) // FAIL
                await lottery.betAndDistribute('0xab', {from: user1, value: BET_AMOUNT}); // wil in 3-th block (ans: 6-th block) // WIN!
                await lottery.betAndDistribute('0x04', {from: user2, value: BET_AMOUNT}); // wil in 4-th block 
                await lottery.betAndDistribute('0x05', {from: user2, value: BET_AMOUNT}); // wil in 5-th block 
                await lottery.betAndDistribute('0x06', {from: user2, value: BET_AMOUNT}); // wil in 6-th block 

                // pot money should be BET_AMOUNT * 2 after 6-th transaction is committed
                let potBefore = await lottery.getPot();                                   // tytpe: BN 
                let balanceUser1Before = await web3.eth.getBalance(user1);                // type: string           
                let balanceUser1Before_BN = new web3.utils.BN(balanceUser1Before);        // Change type from string to BN
                assert.equal(potBefore.toString(), BET_AMOUNT_BN.mul(new web3.utils.BN(2)).toString());

                // pot money should reset to 0 after 7-th transaction is committed
                let receipt7 = await lottery.betAndDistribute('0x06', {from:user2, value:BET_AMOUNT}); // wil in 7-th block // Get Result of user1
                let potAfter = await lottery.getPot();
                assert.equal(potAfter, 0);

                // user1 receive the pot money committed up to the 6-th transaction
                let balanceUser1After = await web3.eth.getBalance(user1);
                assert.equal(balanceUser1After.toString(), balanceUser1Before_BN.add(potBefore).toString());
    
                // check the Bet event
                await expectEvent.inLogs(receipt7.logs, 'WIN');  
            })
            it('Should accumulate the pot when user1 does not match both letters', async () => { 
                await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})

                // Try many betting and user1 win at 1-th betting
                await lottery.betAndDistribute('0x01', {from: user2, value: BET_AMOUNT}); // wil in 1-th block (ans: 4-th block) // FAIL
                await lottery.betAndDistribute('0x02', {from: user2, value: BET_AMOUNT}); // wil in 2-th block (ans: 5-th block) // FAIL
                await lottery.betAndDistribute('0xcc', {from: user1, value: BET_AMOUNT}); // wil in 3-th block (ans: 6-th block) // FAIL (*)
                await lottery.betAndDistribute('0x04', {from: user2, value: BET_AMOUNT}); // wil in 4-th block 

                let potBeforeBet = await lottery.getPot();
                let receipt5 = await lottery.betAndDistribute('0x05', {from: user2, value: BET_AMOUNT}); // wil in 5-th block 

                // pot money should increase by BET_AMOUNT.
                let potAfterBet = await lottery.getPot();
                assert.equal(potAfterBet.toString(), potBeforeBet.add(BET_AMOUNT_BN).toString());
    
                // check the Bet event
                await expectEvent.inLogs(receipt5.logs, 'FAIL');  
            })
            it('Should transfer BET_AMOUNT to user when user1 match one letter', async () => { 
                await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})

                // Try many betting and user1 win at 1-th betting
                await lottery.betAndDistribute('0x01', {from: user2, value: BET_AMOUNT}); // wil in 1-th block (ans: 4-th block) // FAIL
                await lottery.betAndDistribute('0x02', {from: user2, value: BET_AMOUNT}); // wil in 2-th block (ans: 5-th block) // FAIL
                await lottery.betAndDistribute('0x0b', {from: user1, value: BET_AMOUNT}); // wil in 3-th block (ans: 6-th block) // WIN!
                await lottery.betAndDistribute('0x04', {from: user2, value: BET_AMOUNT}); // wil in 4-th block 
                await lottery.betAndDistribute('0x05', {from: user2, value: BET_AMOUNT}); // wil in 5-th block 
                await lottery.betAndDistribute('0x06', {from: user2, value: BET_AMOUNT}); // wil in 6-th block 

                // pot money should be BET_AMOUNT * 2 after 6-th transaction is committed
                let potBefore = await lottery.getPot();                                   // tytpe: BN 
                assert.equal(potBefore.toString(), BET_AMOUNT_BN.mul(new web3.utils.BN(2)).toString());

                let balanceUser1Before = await web3.eth.getBalance(user1);                // type: string           
                let balanceUser1Before_BN = new web3.utils.BN(balanceUser1Before);        // Change type from string to BN

                // user1 receive BET_AMOUNT after 7-th transaction is committed
                let receipt7 = await lottery.betAndDistribute('0x06', {from:user2, value:BET_AMOUNT}); // wil in 7-th block // Get Result of user1
                let balanceUser1After = await web3.eth.getBalance(user1);
                assert.equal(balanceUser1After.toString(), balanceUser1Before_BN.add(BET_AMOUNT_BN).toString());
    
                // pot money should not be changed.
                let potAfterBet = await lottery.getPot();
                assert.equal(potBefore.toString(), potAfterBet.toString());
    
                // check the Bet event
                await expectEvent.inLogs(receipt7.logs, 'DRAW');  
            })
        })

        describe('When blockStatus is NotRevealed (Not mined yet)', function () {
            it('Should not change when answerBlock is not mind', async () => { 
                await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})

                // Try many betting 
                await lottery.betAndDistribute('0x01', {from: user2, value: BET_AMOUNT}); // wil in 1-th block (ans: 4-th block) // FAIL
                await lottery.betAndDistribute('0x02', {from: user2, value: BET_AMOUNT}); // wil in 2-th block (ans: 5-th block) // FAIL

                let potBeforeBet = await lottery.getPot();
                await lottery.betAndDistribute('0x03', {from: user2, value: BET_AMOUNT}); // wil in 3-th block 

                // pot money should not be changed.
                let potAfterBet = await lottery.getPot();
                assert.equal(potAfterBet.toString(), potBeforeBet.toString());
            })
            
        })
        
        describe('When blockStatus is BlockLimitPassed (Block Limit is passed)', function () {
            it('Should transfer BET_AMOUNT to user when answerBlockHash cannot be checked', async () => { 
                await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})

                // Try one betting 
                await lottery.betAndDistribute('0xab', {from: user1, value: BET_AMOUNT}); // wil in 1-th block (ans: 4-th block) // FAIL

                // 256 blocks are mined.
                for (let i = 0; i < BLOCK_LIMIT + BET_BLOCK_INTERVAL; i++) {
                    await lottery.setBlockHashForTest('0xab0de0543dfac8a524faba216956375dc92c8e6a6b06cbb07788573a67c9b3bd', {from:deployer})
                }

                let potBeforeBet = await lottery.getPot();
                let balanceUser1Before = await web3.eth.getBalance(user1);                         
                let balanceUser1Before_BN = new web3.utils.BN(balanceUser1Before);    

                // the current block number is 259.
                let receipt = await lottery.betAndDistribute('0x02', {from: user2, value: BET_AMOUNT}); // wil in 259-th block
                currentBlockNum = await web3.eth.getBlockNumber();

                let balanceUser1After = await web3.eth.getBalance(user1);
                assert.equal(balanceUser1After.toString(), balanceUser1Before_BN.add(BET_AMOUNT_BN).toString());

                // pot money should not be changed.
                let potAfterBet = await lottery.getPot();
                assert.equal(potBeforeBet.toString(), potAfterBet.toString());
    
                // check the Bet event
                await expectEvent.inLogs(receipt.logs, 'REFUND');  
            })
        })
    })

});