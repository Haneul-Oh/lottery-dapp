import logo from './logo.svg';
import { useEffect, useState } from "react";
import './App.css';
import Web3 from 'web3';
import LotteryContractBuild from "./Lottery.json";


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



  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const web = new Web3(window.ethereum);
        setWeb3(web);
        setIsMetamaskInstalled(true);
        getCurrentWalletConnected();
        addWalletListener();
      } catch (err) {
        console.log(err);
      }
    }
  }, [account]);

  useEffect(() => {
    if (web3 !== undefined){
      let lotteryContract = new web3.eth.Contract(LOTTEREY_ABI, LOTTERY_ADDRESS);
      setLotteryContract(lotteryContract);
      console.log("Complete to set contract!", lotteryContract);
      pollData();
    }
  }, [web3]);

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
      const balance = await web3.eth.getBalance(account).then(result => web3.utils.fromWei(result,"ether"));
      setBalance(balance);
    }
  };


  const pollData = async () => {
    await getPot();
    // await this.getBetEvents();
    // await this.getWinEvents();
    // await this.getFailEvents();
    // this.makeFinalRecords();
  }

  const getPot = async () => {
    let pot = await lotteryContract.methods.getPot().call();
    let potString = web3.utils.fromWei(pot.toString(), 'ether');
    setPot(potString);
    console.log("[getPot]", potString)
  }


if (account === undefined) {
  return (
    <div className="App App-header">
      {
        isMetamaskInstalled ? (
          <div>
            <img src={logo} alt="logo" />
            <button onClick={connectWallet}>Connect Your Metamask Wallet</button>
          </div>
        ) : (
          <p>Install Your Metamask wallet</p>
        )
      }
      <p>
        Current Pot: {pot}
      </p>
    </div>
    
  );
}

getBalance();
return (
  <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        ETH wallet connected as: {account}
      </p>
      <p>
        Current Balance: {balance} ETH
      </p>

      <p>
        Current Pot: {pot}
      </p>
    </header>
  </div>
);

}

export default App;