const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
  const balance = await provider.getBalance("0x152992bf4ea6330571d7bd15993944925fe1093f");
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
}

main().catch(console.error);
