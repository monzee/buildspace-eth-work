pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract WavePortal {
  uint waveCount;

  event NewWave(address indexed from, uint timestamp, string message);

  struct Wave {
    address waver;
    string message;
    uint timestamp;
  }

  Wave[] waves;

  constructor() {
    console.log("sup yo");
  }

  function wave(string memory _message) public {
    waveCount += 1;
    console.log("[#wave] %s from: %s", _message, msg.sender);
    waves.push(Wave(msg.sender, _message, block.timestamp));
    emit NewWave(msg.sender, block.timestamp, _message);
  }

  function allWaves() view public returns (Wave[] memory) {
    return waves;
  }

  function totalWaves() view public returns (uint) {
    console.log("[#totalWaves] %d", waveCount);
    return waveCount;
  }
}

