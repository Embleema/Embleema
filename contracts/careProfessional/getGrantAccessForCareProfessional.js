/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const Web3 = require('web3');
const path = require('path');
const jsonfile = require('jsonfile');
const config = require('../../config/config');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const careProfessionalConnectionContractAddress = allContractAddress.careProfessionalConnectionContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function fetchs grant access string for doctor from blockchain
 *
 * @param {Account} ethereum account of doctor
 * @param {password} password to unlock the ethereum account
 * @public
 */
exports.getGrantAccessForCareProfessional = function(Account, password, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(Account, password, 1000000);
		const myContract = web3.eth.contract(careProfessionalConnectionContractAddress.abi).at(careProfessionalConnectionContractAddress.address);
		console.log('\nFetching Granted Access to UserAccount(Doctor) ', Account, ' starts >>> ', new Date());
		let grantAccessInfo = myContract.getCareProfessionalConnection({from: Account});
		console.log('\nFetching Grant Access to UserAccount(Doctor) ', Account, ' ends >>> ', new Date());
		grantAccessInfo = (grantAccessInfo == '') ? [] : JSON.parse(grantAccessInfo);
		console.log('\nDetails of Granted Access to Doctor : ', grantAccessInfo);
		return callback(null, grantAccessInfo);
	} catch (e) {
		console.log(e);
		return callback(null);
	}
};
