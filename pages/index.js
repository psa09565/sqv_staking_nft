import { useEffect, useState } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import { format } from "date-fns";
import "./styles.css"; // 引入 CSS 檔案來美化 UI

const stakingContractAddress = "0x8725FB6603D1e518C0078d9DE68365F22f2eee85";
const claimContractAddress = "0x2383596EFa3A0fc13EfdCd776410deFf25017417";

const stakingAbi = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getStakedNFTs",
    "outputs": [{
      "components": [
        { "internalType": "address", "name": "owner", "type": "address" },
        { "internalType": "uint256", "name": "nftId", "type": "uint256" },
        { "internalType": "uint256", "name": "stakeTime", "type": "uint256" },
        { "internalType": "uint256", "name": "defaultRewardStartTime", "type": "uint256" },
        { "internalType": "uint256", "name": "feeRewardStartTime", "type": "uint256" }
      ],
      "internalType": "struct StakingNFT.StakeInfo[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const claimAbi = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_id", "type": "uint256" },
      { "internalType": "bool", "name": "isFp", "type": "bool" }
    ],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256[]", "name": "_ids", "type": "uint256[]" },
      { "internalType": "bool", "name": "isFp", "type": "bool" }
    ],
    "name": "batchClaimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function StakingNFT() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date();
      document.getElementById("clock").innerText = format(time, "yyyy年MM月dd日 HH:mm:ss");
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider,
            options: { rpc: { 56: "https://bsc-dataseed.binance.org/" } }
          }
        }
      });

      console.log("🔗 連接錢包...");
      const instance = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);
      setProvider(web3Provider);

      const signer = web3Provider.getSigner();
      const walletAddress = await signer.getAddress();
      setAccount(walletAddress);

      console.log(`✅ 連接成功: ${walletAddress}`);
      fetchStakedNFTs(walletAddress);
    } catch (error) {
      console.error("❌ 連接錢包失敗:", error);
    }
  };

  const fetchStakedNFTs = async (wallet) => {
    if (!provider) {
      console.error("❌ Provider 未初始化，請先連接錢包");
      return;
    }

    const contract = new ethers.Contract(stakingContractAddress, stakingAbi, provider);
    if (!contract) {
      console.error("❌ 無法創建合約實例，請檢查合約地址或 ABI");
      return;
    }

    try {
      console.log("🔍 獲取質押 NFT...");
      const data = await contract.getStakedNFTs(wallet);
      console.log("✅ 合約回傳 `data`:", data);

      if (!data || data.length === 0) {
        console.warn("⚠️ 無質押 NFT");
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const formattedData = data.map(nft => ({
        id: `QCP${parseInt(nft.nftId.toString(), 10)}`,
        stakeTime: nft.stakeTime.toNumber() ? new Date(nft.stakeTime.toNumber() * 1000).toLocaleString() : "未設定",
        lastRewardTime: nft.defaultRewardStartTime.toNumber() ? new Date(nft.defaultRewardStartTime.toNumber() * 1000).toLocaleString() : "未設定",
        canClaim: now - nft.defaultRewardStartTime.toNumber() >= 86400
      }));

      console.log("✅ 處理後 NFT 資料:", formattedData);
      setNfts(formattedData);
    } catch (error) {
      console.error("❌ 獲取 NFT 失敗:", error);
    }
  };

  const claimRewards = async () => {
    if (!provider || selectedNFTs.length === 0) return;

    const signer = provider.getSigner();
    const contract = new ethers.Contract(claimContractAddress, claimAbi, signer);

    try {
      console.log("🔍 送出領取獎勵交易...");
      if (selectedNFTs.length === 1) {
        const tx = await contract.claimRewards(parseInt(selectedNFTs[0].replace("QCP", ""), 10), false);
        await tx.wait();
      } else {
        const nftIds = selectedNFTs.map(nft => parseInt(nft.replace("QCP", ""), 10));
        const tx = await contract.batchClaimRewards(nftIds, false);
        await tx.wait();
      }
      console.log("✅ 領取成功");
      alert("領取成功！");
    } catch (error) {
      console.error("❌ 領取失敗:", error);
      alert("領取失敗，請檢查交易");
    }
  };

  const handleSelectAll = () => {
    setSelectedNFTs(nfts.filter(nft => nft.canClaim).map(nft => nft.id));
  };

  const handleDeselectAll = () => {
    setSelectedNFTs([]);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>SQV StakingNFT Scan</h1>
        <button className="wallet-btn" onClick={connectWallet}>WalletConnect</button>
      </div>
      <div id="clock" className="clock"></div>
      <div className="button-group">
        <button className="select-all" onClick={handleSelectAll}>全選</button>
        <button className="deselect-all" onClick={handleDeselectAll}>取消全選</button>
        <button className="claim-btn" onClick={claimRewards} disabled={selectedNFTs.length === 0}>領取獎勵</button>
      </div>
      <table className="staking-table">
        <thead>
          <tr>
            <th>選取</th>
            <th>NFT 名稱</th>
            <th>質押時間</th>
            <th>上次領取時間</th>
          </tr>
        </thead>
        <tbody>
          {nfts.map(nft => (
            <tr key={nft.id}>
              <td><input type="checkbox" disabled={!nft.canClaim} checked={selectedNFTs.includes(nft.id)}
                onChange={() => setSelectedNFTs(selectedNFTs.includes(nft.id)
                  ? selectedNFTs.filter(id => id !== nft.id)
                  : [...selectedNFTs, nft.id])} />
              </td>
              <td>{nft.id}</td>
              <td>{nft.stakeTime}</td>
              <td>{nft.lastRewardTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
