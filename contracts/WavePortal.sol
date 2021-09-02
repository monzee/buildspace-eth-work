pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract WavePortal {
	uint waveCount;

	constructor() {
		console.log("sup yo");
	}

	function wave() public {
		waveCount += 1;
		console.log("[#wave] sender: %s", msg.sender);
	}

	function totalWaves() view public returns (uint) {
		console.log("[#totalWaves] %d", waveCount);
		return waveCount;
	}
}

