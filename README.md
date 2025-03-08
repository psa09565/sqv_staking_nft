This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 說明

1. 這是 SQV NFT 質押狀態的展示工具

2. 這個工具也可以領取質押收益，理論上可以一次領取任何的等級的卡片(未測試過)

3. 主要程式儲存在 pages 中的 index.js 、 styles.css，因使用 pages 運行，所以專案預設的 app 資料夾必須修改名稱或刪除，才不會運行錯誤

4. 我沒有設計 walletconnect 展示錢包地址的 UI介面，有需要可自行修改代碼

## Windows系統下的配置方式

1. 先去官網安裝 node.js

2. 打開cmd 輸入指令

	npx create-next-app@latest sqv-staking-nft

	npm install ethers @walletconnect/web3-provider web3modal date-fns

	cd sqv-staking-nft
	
	cd pages

	npm install react react-dom ethers date-fns web3modal @walletconnect/web3-provider

	npm run dev


## 免責聲明
程式碼沒有對應的過多除錯，使用時請自負風險，遭遇任何損失概不負責。
The code does not include extensive debugging. Use it at your own risk. We are not responsible for any losses incurred.