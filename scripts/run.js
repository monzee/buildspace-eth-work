async function main() {
	const [owner, somebody] = await ethers.getSigners();
	const wavePortal = await hre.ethers.getContractFactory("WavePortal");
	const contract = await wavePortal.deploy();
	await contract.deployed();
	console.log(`Contract deployed to:${contract.address} by:${owner.address}`);

	let total = await contract.totalWaves();
	console.log(`before wave: ${total}`);
	await (await contract.wave()).wait();
	total = await contract.totalWaves();
	console.log(`after wave: ${total}`);

	await (await contract.connect(somebody).wave()).wait();
	total = await contract.totalWaves();
	console.log(`after other wave: ${total}`);
}


main().catch((e) => {
	console.error(e);
	process.exit(1);
});
