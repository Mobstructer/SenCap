async function main() {
   const SpadesEscrow = await ethers.getContractFactory("SpadesEscrow");

   const spades_escrow = await SpadesEscrow.deploy();

   await spades_escrow.waitForDeployment();

   console.log("Contract deployed to address:", await spades_escrow.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });