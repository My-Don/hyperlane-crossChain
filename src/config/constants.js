// 链ID定义
export const CHAIN_IDS = {
  BSC: 56,
  MONAD: 143
};

// 合约地址
export const CONTRACT_ADDRESSES = {
  // BSC 网络
  BSC: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    WARP_ROUTER: "0x959bEa75eB8247917Ea4602B0bE0043885834f57"
  },
  // MONAD 网络
  MONAD: {
    USDT: "", // 请填写实际地址
    WARP_ROUTER: "0x67752c58D0592BB3b46d372341D85E7e8DF1b09B"
  }
};

// 合约 ABI
export const ABIS = {
  WARP_ROUTE: [
    'function transferRemote(uint32 destination, bytes32 recipient, uint256 amount) external payable returns (bytes32)'
  ],
  ERC20: {
    APPROVE: ['function approve(address,uint256)']
  }
};

// 跨链费用
export const BRIDGE_FEES = {
  BSC_TO_MONAD: "0.0003", // BSC 到 MONAD 的跨链费用
  MONAD_TO_BSC: "13" // MONAD 到 BSC 的跨链费用
};
