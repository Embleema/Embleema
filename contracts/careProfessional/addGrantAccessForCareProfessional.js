/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/
const Web3 = require('web3');
const path = require('path');
const config = require('../../config/config');
const jsonfile = require('jsonfile');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const careProfessionalConnectionContractAddress = allContractAddress.careProfessionalConnectionContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function adds grant access string for doctor into blockchain
 *
 * @param {con} grant access string
 * @param {Account} ethereum account of doctor
 * @param {password} password to unlock the ethereum account
 * @public
 */
exports.addGrantAccessForCareProfessional = function(con, Account, password, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(Account, password, 1000000);
		const myContract = web3.eth.contract(careProfessionalConnectionContractAddress.abi).at(careProfessionalConnectionContractAddress.address);
		const str_con = JSON.stringify(con);
		console.log('\nGranted Access to UserAccount(Doctor) ', Account, ' starts >>> ', new Date());
		myContract.addCareProfessionalConnection(str_con, { gas: 4000000, from: Account }, function(err, res) {
			if (err) {
				console.log(err);
				callback(err);
			} else {
				const txhash = res;
				const filter = web3.eth.filter('latest');
				let isCallbackSent = false;
				// waiting for mining
				filter.watch(function() {
					let receipt = web3.eth.getTransactionReceipt(txhash);
					setTimeout(function() {
						if (!isCallbackSent) {
							filter.stopWatching();
							return callback('Data is not mined yet');
						}
					}, 45000);
					if (receipt && receipt.transactionHash == txhash) {
						if (web3.eth.getTransaction(txhash).blockNumber) {
							console.log('\nGranted Access for Doctor Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
							console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
							console.log('\nGranted Access to UserAccount(Doctor) ', Account, ' ends >>> ', new Date());
							filter.stopWatching();
							isCallbackSent = true;
							callback(null, str_con);
						} else {
							console.log('\n' + txhash + ' Not yet Mined');
							filter.stopWatching();
							isCallbackSent = true;
						}
					}
				});
			}
		});
	} catch (e) {
		console.log(e);
		return callback(null, e);
	}
};
