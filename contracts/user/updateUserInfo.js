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
const userRegistryContractAddress = allContractAddress.userRegistryContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function updates user information in blockchain
 *
 * @param {Account} ethereum account of user
 * @param {password} password to unlock ethereum account of user
 * @param {body} updated information of user
 * @public
 */
exports.updateUserInfo = function(Account, password, body, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(Account, password, 1000000);
		const myContract = web3.eth.contract(userRegistryContractAddress.abi).at(userRegistryContractAddress.address);
		console.log('\nUpdating Profile Information Start for UserAccount : ', Account, ' >>> ', new Date());
		myContract.updateInfo(Account, JSON.stringify(body), { gas: 4000000, from: Account }, function(err, res) {
			if (err) {
				console.log('2nd', err);
				callback(err);
			} else {
				const txhash = res;
				const filter = web3.eth.filter('latest');
				// waiting for mining
				filter.watch(function() {
					let receipt = web3.eth.getTransactionReceipt(txhash);
					if (receipt && receipt.transactionHash == txhash) {
						if (web3.eth.getTransaction(txhash).blockNumber) {
							console.log('\nUpadted Profile Information Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
							console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
							console.log('\nUpdating Information End for UserAccount : ', Account, ' >>> ', new Date());
							callback(null, 'updated successfully');
						} else {
							console.log('\n' + txhash + ' Not yet Mined');
						}
						filter.stopWatching();
					}
				});
			}
		});
	} catch (e) {
		console.log(e);
		callback(null, e);
	}
};
