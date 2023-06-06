import { useMemo, useEffect, useState } from "react";
import './App.css';
import Web3 from 'web3';
import LotteryContractBuild from "./Lottery.json";
import 'bootstrap/dist/css/bootstrap.css';
import { Button, Navbar, Nav, NavDropdown, Form, FormControl, Jumbotron, Container, Row, Col, img } from 'react-bootstrap';
import Table from "./Table";


const LOTTERY_ADDRESS = '0xC89C4883D9206f011cC10AeB06558845BCe8Ddfd';
const LOTTEREY_ABI = LotteryContractBuild.abi;

function App() {
  const [web3, setWeb3] = useState();
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [account, setAccount] = useState();
  const [balance, setBalance] = useState();
  const [walletType, setWalletType] = useState();

  const [lotteryContract, setLotteryContract] = useState();
  const [pot, setPot] = useState(-1);
  const [inputChallenges, setInputChallenges] = useState();
  const [inputGas, setInputGas] = useState(new Web3.utils.BN(2*10*20));
  const [inputGasLimit, setInputGasLimit] = useState(21000);

  const [showAccountAlert, setShowAccountAlert] = useState(false);
  const [showInputAlert, setShowInputAlert] = useState(false);


  const columns = useMemo(
    () => [
      {
        Header: "Index",
        accessor: "index"
      },
      {
        Header: "Address",
        accessor: "address"
      },
      {
        Header: "Challenges",
        accessor: "challenges"
      },
      {
        Header: "Answer",
        accessor: "answer"
      },
      {
        Header: "Answer of Block Number",
        accessor: "answerBlockNumber"
      },
      {
        Header: "Status",
        accessor: "status"
      },
      {
        Header: "Getted Pot",
        accessor: "pot" // Result 로 변경 하고 싶음 
      },
    ],
    []
  );
  const [data, setData] = useState([]);
  const [betRecords, setBetRecords] = useState([]);
  const [failRecords, setFailRecords] = useState([]);
  const [winRecords, setWinRecords] = useState([]);
  const [FinalRecords, setFinalRecords] = useState([]);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const web = new Web3(window.ethereum);
        setWeb3(web);
        setIsMetamaskInstalled(true);
        getCurrentWalletConnected();
        addWalletListener();
        getBalance();
      } catch (err) {
        console.log(err);
      }
    }
  }, [account]);

  useEffect(() => {
    if (web3 !== undefined) {
      let lotteryContract = new web3.eth.Contract(LOTTEREY_ABI, LOTTERY_ADDRESS);
      setLotteryContract(lotteryContract);
      console.log("Complete to set contract!", lotteryContract);
    }
  }, [web3]);

  useEffect(() => {
    if (lotteryContract !== undefined) {
      pollData();
      console.log("Start to pull data of contract!");
    }
  }, [lotteryContract]);

  const connectWallet = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        /* MetaMask is installed */
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        console.log("[connectWallet]", accounts[0]);
      } catch (err) {
        console.error(err.message);
      }
    } else {
      /* MetaMask is not installed */
      console.log("[connectWallet]", "Please install MetaMask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log("[getCurrentWalletConnected]", accounts[0]);
        } else {
          console.log("[getCurrentWalletConnected]", "Connect to MetaMask using the Connect button");
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      /* MetaMask is not installed */
      console.log("[getCurrentWalletConnected] Please install MetaMask");
    }
  };

  const addWalletListener = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        console.log("[addWalletListener]", accounts[0]);
      });
    } else {
      /* MetaMask is not installed */
      setAccount(undefined);
      console.log("[addWalletListener]", "Please install MetaMask");
    }
  };

  const getBalance = async () => {
    if (account !== undefined) {
      const web3 = new Web3(window.ethereum);
      const balance = await web3.eth.getBalance(account).then(result => web3.utils.fromWei(result, "ether"));
      setBalance(balance);
    }
  };

  useEffect(() => {
    if (betRecords !== []) {
      try {
        makeFinalRecords();
      } catch (err) {
        console.log(err);
      }
    }
  }, [betRecords, winRecords, failRecords]);

  const pollData = async () => {
    await getPot();
    // let data = [
    //   {
    //     index: 0,
    //     address: '0xabc...12',
    //     challanges: '0xab',
    //     answer: '0x5d',
    //     pot: pot,
    //     status: 'Not Reserved',
    //     answerBlockNumber: 0
    //   },

    //   {
    //     index: 1,
    //     address: '0x00c...12',
    //     challanges: '0x12',
    //     answer: '0x5d',
    //     pot: pot,
    //     status: 'Not Reserved',
    //     answerBlockNumber: 1
    //   }
    // ]
    // setData(data);
    await getBetEvents();
    await getFailEvents();
    await getWinEvents();
  }

  const getPot = async () => {
    if (lotteryContract !== undefined) {
      let pot = await lotteryContract.methods.getPot().call();
      let potString = web3.utils.fromWei(pot.toString(), 'ether');
      setPot(potString);
      console.log("[getPot]", "pot:", potString)
    }
  }

  const bet = async () => {
    if (account === undefined) {
      setShowAccountAlert(true);

    } else if (inputChallenges === undefined) {
      setShowInputAlert(true);

    } else if (lotteryContract !== undefined) {
      let nonce = await web3.eth.getTransactionCount(account);
      let challenges = inputChallenges;
      // let gas = inputGas;
      await lotteryContract.methods.betAndDistribute(challenges).send({ from: account, value: 5000000000000000, nonce: nonce })
      .then(async () => {
      console.log("[bet]", "Complete to betting", challenges);
      await pollData();
      })
      .catch(err => {
        console.log('[bet]', err);
      });
    }
  }

  const getBetEvents = async () => {
    if (lotteryContract !== undefined) {
      const records = [];
      const events = await lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });

      for (let i = 0; i < events.length; i += 1) {
        const record = {}
        record.index = parseInt(events[i].returnValues.idx, 10).toString();
        record.address = events[i].returnValues.bettor.slice(0, 4) + '...' + events[i].returnValues.bettor.slice(40, 42);
        record.answerBlockNumber = events[i].returnValues.anwserBlockNum;
        record.challenges = events[i].returnValues.challenges;
        record.status = 'Not Revealed';
        record.answer = '';
        records.unshift(record);
      }

      setBetRecords(records);
      console.log("[getBetEvents]", "records:", records);
    }
  }

  const getFailEvents = async () => {
    if (lotteryContract !== undefined) {
      const records = [];
      const events = await lotteryContract.getPastEvents('FAIL', { fromBlock: 0, toBlock: 'latest' });

      for (let i = 0; i < events.length; i += 1) {
        let index = parseInt(events[i].returnValues.idx, 10).toString();
        records[index] = {};
        records[index].answer = events[i].returnValues.answer.slice(0, 4);
      }

      setFailRecords(records);
      console.log("[getFailEvents]", "records:", records);
    }
  }

  const getWinEvents = async () => {
    if (lotteryContract !== undefined) {
      const records = [];
      const events = await lotteryContract.getPastEvents('WIN', { fromBlock: 0, toBlock: 'latest' });

      for (let i = 0; i < events.length; i += 1) {
        let index = parseInt(events[i].returnValues.idx, 10).toString();
        records[index] = {};
        records[index].index = parseInt(events[i].returnValues.idx, 10).toString();
        records[index].answer = events[i].returnValues.answer.slice(0, 4);
        records[index].amount = parseInt(events[i].returnValues.amount, 10).toString();
      }

      setWinRecords(records);
      console.log("[getWinEvents]", "records:", records);
    }
  }

  const makeFinalRecords = () => {

    const records = [...betRecords];
    console.log("[makeFinalRecords]", "winRecords:", winRecords, "failRecords:", failRecords);

    for (let i = 0; i < betRecords.length; i += 1) {

      let index = betRecords[i].index
      if (winRecords.length > 0 && winRecords.hasOwnProperty(index)) {
        records[i].status = 'WIN'
        records[i].pot = failRecords[index].pot;
        records[i].answer = failRecords[index].answer;
      }
      else if (failRecords.length > 0 && failRecords.hasOwnProperty(index)) {
        records[i].status = 'FAIL'
        records[i].pot = 0;
        records[i].answer = failRecords[index].answer;
      }
      else {
        records[i].status = 'Not Revealed';
        records[i].answer = 'Not Revealed';
        records[i].pot = '-';
      }

    }
    setFinalRecords(records);
    console.log("[makeFinalRecords]", "records:", records);

  }

  const handleInputChallenges = e => {
    const value = e.target.value || undefined;
    setInputChallenges(value);
  };

  const handleInputGas = e => {
    let value = e.target.value || undefined;
    if (value !== undefined) {
      value = value * (10 ** 9);
    }
    setInputGas(value);
  };

  // const handleInputGasLimit = e => {
  //   let value = e.target.value || undefined;
  //   setInputGasLimit(value);
  // };

    return (

      <div className="App">
        <div className="container mt-3">
          <h2>Lottery</h2>
          <div className="mb-4 p-5 bg-light rounded-3">
            <h1 className="display-5 text-center fw-bold">Current Pot: {pot} ETH</h1>
            <p className="text-center fs-4"></p>
            {
              (account === undefined) ? (
                isMetamaskInstalled ? (
                  <div className="find-btn">
                    <button className="btn btn-primary btn-lg" type="button" onClick={connectWallet} role="Bet">Connect Your Metamask Wallet</button>
                  </div>
                ) : (
                  <div>
                  <p className="text-center fs-4"> Install Your Metamask wallet</p>
                </div>
                )
              ) : (
                <div>
                  <p className="text-center fs-4"> My Address: {account}</p>
                  <p className="text-center fs-4"> My Balance: {balance} ETH</p>
                </div>
              )
            }
            {
              showAccountAlert && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <strong> Please connect your MetaMask.</strong>
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setShowAccountAlert(false)}></button>
                </div>
              )
            }
          </div>

          <div className="mb-4 p-5 bg-light rounded-3">
            <div className="mb-3">
              <label htmlFor="inputForChallenges" className="form-label">My Challenges to bet:</label>
              <input type="text" className="form-control" id="inputForChallenges" placeholder="ex. 0xAB, 0x1C" onChange={handleInputChallenges}></input>
            </div>
            {/* <div className="mb-3">
              <label htmlFor="inputForGas" className="form-label">Gas (GWEI):</label>
              <input type="number" className="form-control" id="inputForGas" onChange={handleInputGas} defaultValue={20}></input>
            </div> */}
            {/* <div className="mb-3">
              <label htmlFor="inputForGas" className="form-label">Gas Limit:</label>
              <input type="number" className="form-control" id="inputForGas" onChange={handleInputGasLimit} defaultValue={21000}></input>
            </div> */}
            <button className="btn btn-primary btn-lg" type="button" onClick={bet} role="Bet">BET</button>
            {
              showInputAlert && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <strong> Please fill in challanges and gas fee.</strong>
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setShowInputAlert(false)}></button>
                </div>
              )
            }
          </div>
        </div>

        <div className="container mt-3">
          <Table columns={columns} data={FinalRecords} />
        </div>
      </div>
    );
 
}

export default App;