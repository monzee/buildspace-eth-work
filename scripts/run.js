async function main() {
  const WavePortal = await hre.ethers.getContractFactory("WavePortal");
  const contract = await WavePortal.deploy({ value: hre.ethers.utils.parseEther("0.1") });
  await contract.deployed();
  console.log(`Contract deployed to: ${contract.address}`);

  let balance = await hre.ethers.provider.getBalance(contract.address);
  console.log(`Contract balance: ${balance}`);

  let total = await contract.totalWaves();
  console.log(`before wave: ${total}`);

  for (let i = 0; i < 5; i++) {
    let txn = await contract.wave(`wave ${i}`);
    await txn.wait();
  }

  balance = await hre.ethers.provider.getBalance(contract.address);
  console.log(`Contract balance: ${balance}`);

  console.log(await contract.allWaves());
}


main().catch((e) => {
  console.error(e);
  process.exit(1);
});
