const Migrations = artifacts.require("Migrations"); // read ../build/Migrations.json

module.exports = function(deployer) { 
  deployer.deploy(Migrations); // read bytecode from Migrations var
};
