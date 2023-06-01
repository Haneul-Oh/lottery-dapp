const Lottery = artifacts.require("Lottery"); // read ../build/Lottery.json

module.exports = function(deployer) {
  deployer.deploy(Lottery);  // read bytecode from Lottery var
};
