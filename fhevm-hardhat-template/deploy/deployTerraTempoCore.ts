import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy TerraTempoCore with no constructor arguments
  const deployed = await deploy("TerraTempoCore", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`TerraTempoCore contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_terra_tempo_core";
func.tags = ["TerraTempoCore"];


