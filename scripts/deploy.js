async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Balance: ${await deployer.getBalance()}`);

  const WavePortal = await ethers.getContractFactory("WavePortal");
  const token = await WavePortal.deploy({ value: ethers.utils.parseEther("0.1") });
  await token.deployed();
  console.log(`WavePortal address: ${token.address}`);
}


main().catch((e) => {
  console.error(e);
  process.exit(1);
});
