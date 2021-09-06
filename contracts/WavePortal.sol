// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


contract WavePortal {
  struct Wave {
    string message;
    address waver;
    uint timestamp;
    bool winner;
  }

  event NewWave(
    string message,
    address indexed waver,
    uint timestamp,
    bool winner
  );

  uint waveCount;
  Wave[] waves;
  uint private rngSeed;
  mapping(address => uint) private cooldown;

  constructor() payable {
  }

  function wave(string memory _message) public {
    require(cooldown[msg.sender] + 15 seconds < block.timestamp, "Wait 15s.");
    rngSeed = (block.difficulty + block.timestamp + rngSeed) % 100;
    bool winner = rngSeed < 20;
    if (winner) {
      uint prize = 0.0001 ether;
      require(prize <= address(this).balance, "Not enough funds for prize");
      (bool ok,) = (msg.sender).call{ value: prize }("");
      require(ok, "Failed to give out prize");
    }

    waveCount += 1;
    waves.push(Wave(_message, msg.sender, block.timestamp, winner));
    cooldown[msg.sender] = block.timestamp;
    emit NewWave(_message, msg.sender, block.timestamp, winner);
  }

  function allWaves() view public returns (Wave[] memory) {
    return waves;
  }

  function totalWaves() view public returns (uint) {
    return waveCount;
  }
}

