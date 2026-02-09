<template>
  <div class="hello">
    <h1>跨链桥</h1>
    <div class="container">
      <div class="content-wrapper">
        <div class="chain-selector">
          <div class="chain-box">
            {{ chainName1 }}
          </div>
          <div class="chain-switch" @click="changeChain">
            &lt;===&gt;
          </div>
          <div class="chain-box">
            {{ chainName2 }}
          </div>
        </div>
        <div class="input-row">
          <div class="input-group">
            <div class="input-label">Token</div>
            <div>
              <select v-model="token" name="token" id="token-select" class="form-select">
                <option disabled value="">请选择</option>
                <option v-for="item in options" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="input-group">
            <div class="input-label">Amount</div>
            <div>
              <input type="number" v-model="amount" class="form-input" placeholder="0.00" />
            </div>
          </div>
        </div>

        <div class="recipient-section">
          <div class="input-label">Recipient address</div>
          <div class="recipient-input-wrapper">
            <input type="text" class="form-input recipient-input" v-model="recipientAddress" placeholder="0x123456" />
          </div>
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-if="success" class="success-message">
          {{ success }}
        </div>
        <div v-if="isTrue" class="connected-address">
          已连接: {{ address.substring(0, 6) }}...{{ address.substring(address.length - 4) }}
        </div>
        <div class="button-section">
          <div v-if="!isTrue" class="action-button" @click="connectWallet" :disabled="loading">
            {{ loading ? 'Connecting...' : msg }}
          </div>
          <div v-if="isTrue" class="action-button" @click="crossChainTransfer" :disabled="isSubmitting">
            {{ isSubmitting ? 'Processing...' : crossChain }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { CHAIN_IDS, CONTRACT_ADDRESSES, ABIS, BRIDGE_FEES } from "../config/constants";
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: "Connect Wallet",
      msg2: "Continue",
      chainName1: "BSC",
      chainName2: "MONAD",
      crossChain: "Cross BSC to MONAD",
      isTrue: false,
      signer: null,
      amount: null,
      options: [
        { id: 'usdt', name: 'USDT' },
        { id: 'usdc', name: 'USDC' },
        { id: 'bnb', name: 'BNB' }
      ],
      token: 'usdt',
      address: '',
      recipientAddress: '',
      loading: false,
      error: '',
      success: '',
      isSubmitting: false,
      // 合约实例缓存
      contracts: {
        usdt: null,
        warpRoute: {
          bsc: null,
          monad: null
        }
      }
    }
  },
  mounted() {
    // 检查钱包连接状态
    this.checkWalletConnection();
    
    // 监听钱包连接状态变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged);
      window.ethereum.on('chainChanged', this.handleChainChanged);
    }
  },
  
  beforeDestroy() {
    // 移除事件监听器
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  },
  
  methods: {
    async checkWalletConnection() {
      try {
        if (!window.ethereum) {
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          this.msg = this.msg2;
          this.signer = signer;
          this.isTrue = true;
          this.address = address;
          
          // 初始化合约实例缓存
          this.contracts.usdt = new ethers.Contract(CONTRACT_ADDRESSES.BSC.USDT, ABIS.ERC20.APPROVE, this.signer);
          this.contracts.warpRoute.bsc = new ethers.Contract(CONTRACT_ADDRESSES.BSC.WARP_ROUTER, ABIS.WARP_ROUTE, this.signer);
          this.contracts.warpRoute.monad = new ethers.Contract(CONTRACT_ADDRESSES.MONAD.WARP_ROUTER, ABIS.WARP_ROUTE, this.signer);
        }
      } catch (err) {
        console.error("检查钱包连接状态失败:", err);
      }
    },
    
    handleAccountsChanged(accounts) {
      if (accounts.length > 0) {
        this.address = accounts[0];
        this.isTrue = true;
        this.msg = this.msg2;
      } else {
        this.isTrue = false;
        this.msg = "Connect Wallet";
        this.signer = null;
        this.address = '';
        // 清空合约实例缓存
        this.contracts = {
          usdt: null,
          warpRoute: {
            bsc: null,
            monad: null
          }
        };
      }
    },
    
    handleChainChanged(chainId) {
      console.log('Chain changed to:', chainId);
      // 可以在这里添加链切换后的处理逻辑
    },
    
    async connectWallet() {
      try {
        this.error = '';
        this.loading = true;
        
        if (!window.ethereum) {
          this.error = "请安装钱包";
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        const network = await provider.getNetwork();
        console.log(network.chainId);

        const signer = provider.getSigner();
        const address = await signer.getAddress();

        console.log("地址:", address);

        if (address) {
          this.msg = this.msg2;
          this.signer = signer;
          this.isTrue = true;
          this.address = address;
          this.success = "钱包连接成功";
          
          // 初始化合约实例缓存
          this.contracts.usdt = new ethers.Contract(CONTRACT_ADDRESSES.BSC.USDT, ABIS.ERC20.APPROVE, this.signer);
          this.contracts.warpRoute.bsc = new ethers.Contract(CONTRACT_ADDRESSES.BSC.WARP_ROUTER, ABIS.WARP_ROUTE, this.signer);
          this.contracts.warpRoute.monad = new ethers.Contract(CONTRACT_ADDRESSES.MONAD.WARP_ROUTER, ABIS.WARP_ROUTE, this.signer);
          
          // 3秒后清除成功提示
          setTimeout(() => {
            this.success = '';
          }, 3000);
        }
      } catch (err) {
        console.error("连接钱包失败:", err);
        this.error = "连接钱包失败: " + (err.message || "未知错误");
        
        // 5秒后清除错误提示
        setTimeout(() => {
          this.error = '';
        }, 5000);
      } finally {
        this.loading = false;
      }
    },

    changeChain() {
      if (this.chainName1 === "BSC") {
        this.chainName1 = "MONAD";
        this.chainName2 = "BSC";
        this.crossChain = ""
        this.crossChain = "Cross MONAD to BSC"
      } else {
        this.chainName1 = "BSC";
        this.chainName2 = "MONAD";
        this.crossChain = ""
        this.crossChain = "Cross BSC to MONAD"
      }

      // 清空输入
      this.recipientAddress = "";
      this.amount = "";

    },

    isValidAddress(address) {
      try {
        return ethers.utils.isAddress(address);
      } catch {
        return false;
      }
    },

    async crossChainTransfer() {
      try {
        this.error = '';
        this.success = '';
        this.isSubmitting = true;

        if (!this.amount || !this.recipientAddress) {
          this.error = "请填写完整的转账信息";
          return;
        }

        // 验证金额
        const amountNum = parseFloat(this.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          this.error = "请输入有效的转账金额";
          return;
        }

        // 验证收款人地址
        if (!this.isValidAddress(this.recipientAddress)) {
          this.error = "请输入有效的以太坊地址";
          return;
        }

        // 通用参数准备
        const recipientAddressBytes32 = ethers.utils.hexZeroPad(this.recipientAddress, 32);
        const amountInWei = ethers.utils.parseUnits(this.amount, 18);

        let tx;
        if (this.chainName1 == "BSC") {
          // ERC20 approve
          await this.contracts.usdt.approve(CONTRACT_ADDRESSES.BSC.WARP_ROUTER, amountInWei);
          // 执行跨链转账
          tx = await this.contracts.warpRoute.bsc.transferRemote(
            CHAIN_IDS.MONAD,
            recipientAddressBytes32,
            amountInWei,
            {
              value: ethers.utils.parseEther(BRIDGE_FEES.BSC_TO_MONAD) // 跨链 fee
            }
          );
          console.log('跨链消息已发送bsc => monad，等待中继...');
          this.success = '跨链消息已发送bsc => monad，等待中继...';
        } else {
          // 执行跨链转账
          tx = await this.contracts.warpRoute.monad.transferRemote(
            CHAIN_IDS.BSC,
            recipientAddressBytes32,
            amountInWei,
            {
              value: ethers.utils.parseEther(BRIDGE_FEES.MONAD_TO_BSC) // 跨链 fee
            }
          );
          console.log('跨链消息已发送monad => bsc，等待中继...');
          this.success = '跨链消息已发送monad => bsc，等待中继...';
        }

        await tx.wait();

        // 3秒后清除成功提示
        setTimeout(() => {
          this.success = '';
        }, 5000);
      } catch (err) {
        console.error("跨链转账失败:", err);
        this.error = "跨链转账失败: " + (err.message || "未知错误");
        
        // 5秒后清除错误提示
        setTimeout(() => {
          this.error = '';
        }, 5000);
      } finally {
        this.isSubmitting = false;
      }
    }




  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hello {
  text-align: center;
}

.container {
  margin-top: 50px;
  width: 100%;
}

.content-wrapper {
  width: 50%;
  margin: 0 auto;
}

.chain-selector {
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
}

.chain-box {
  width: 40%;
  height: 100px;
  border: 1px solid #2764c1;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chain-switch {
  width: 5%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.input-row {
  width: 100%;
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.input-group {
  width: 45%;
  text-align: left;
}

.input-label {
  text-align: left;
  margin-bottom: 10px;
}

.form-select,
.form-input {
  width: 100%;
  height: 50px;
  border: 1px solid rgb(130 168 228 / 1);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
}

.recipient-section {
  margin-top: 20px;
  width: 100%;
  text-align: left;
}

.recipient-input-wrapper {
  width: 100%;
  margin-top: 10px;
}

.recipient-input {
  width: 95%;
  margin-left: 2%;
}

.button-section {
  width: 100%;
  margin-top: 20px;
}

.action-button {
  width: 95%;
  margin: 0 auto;
  height: 40px;
  background-color: rgb(192 44 166 / 1);
  color: white;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: rgb(162 34 136 / 1);
}

.action-button:disabled {
  background-color: rgb(192 192 192 / 1);
  cursor: not-allowed;
}

.error-message {
  width: 95%;
  margin: 10px auto 0;
  padding: 10px;
  background-color: rgb(255 200 200 / 1);
  color: rgb(150 0 0 / 1);
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
}

.success-message {
  width: 95%;
  margin: 10px auto 0;
  padding: 10px;
  background-color: rgb(200 255 200 / 1);
  color: rgb(0 100 0 / 1);
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
}

.connected-address {
  width: 95%;
  margin: 10px auto 0;
  padding: 10px;
  background-color: rgb(200 220 255 / 1);
  color: rgb(0 0 150 / 1);
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  font-family: monospace;
}
</style>
