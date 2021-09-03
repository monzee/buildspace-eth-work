async function main() {
  const WavePortal = await hre.ethers.getContractFactory("WavePortal");
  const contract = await WavePortal.deploy();
  await contract.deployed();
  console.log(`Contract deployed to: ${contract.address}`);

  let total = await contract.totalWaves();
  console.log(`before wave: ${total}`);

  let txn = await contract.wave("first");
  await txn.wait();

  console.log(await contract.allWaves());
}


main().catch((e) => {
  console.error(e);
  process.exit(1);
});
