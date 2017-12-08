/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const Web3 = require('web3');
const path = require('path');
const _ = require('lodash');
const jsonfile = require('jsonfile');
const config = require('../../config/config');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const userEthereumMappingPath = path.join(__dirname, '../../data/userEthereumMapping.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const userRegistryContractAddress = allContractAddress.userRegistryContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function fetchs user information from blockchain
 *
 * @param {Account} ethereum account of user
 * @param {password} password to unlock ethereum account of user
 * @public
 */
exports.getUserInfo = function(Account, password, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(Account, password, 1000000);
		const myContract = web3.eth.contract(userRegistryContractAddress.abi).at(userRegistryContractAddress.address);
		console.log('\nFetching Profile Information Starts for UserAccount : ', Account, ' >>>>> ', new Date());
		let userInfo = myContract.getInfo(Account,{ from: Account });
		console.log('\nFetching Profile Information Ends for UserAccount : ', Account, ' >>>>> ', new Date());
		return callback(null, JSON.parse(userInfo));
	} catch (e) {
		console.log('\n',e);
		if(e.message==='invalid address'||e.message==='no key for given address or file'){
			console.log('address not found',Account);
			let userData = jsonfile.readFileSync(userEthereumMappingPath);
			delete userData[_.findKey(userData, function(o) { return o.etheriumAddress == Account; })];
			jsonfile.writeFileSync(userEthereumMappingPath, userData, { spaces: 2 });
		}
		return callback(null);
	}
};
