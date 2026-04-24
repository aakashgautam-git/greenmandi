import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SolarixModule", (m) => {
  const oracleAddress = m.getAccount(0);
  const energyToken = m.contract("EnergyToken", [oracleAddress]);
  const marketplace = m.contract("EnergyMarketplace", [energyToken]);
  return { energyToken, marketplace };
});
