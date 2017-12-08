/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const Web3 = require('web3');
const path = require('path');
const _= require('lodash');
const jsonfile = require('jsonfile');
const config = require('../../config/config');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const careFacilityContractAddress = allContractAddress.careFacilityContractAddress;
const careFacilityEthereumMappingPath = path.join(__dirname, '../../data/careFacilityEthereumMappingPath.json');
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function fetchs information about the care facility
 *
 * @param {Account} ethereum account of care facility
 * @param {password} password to unlock ethereum account of care facility
 * @public
 */
exports.getCareFacility = function(Account, password, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(Account, password, 1000000);
		const myContract = web3.eth.contract(careFacilityContractAddress.abi).at(careFacilityContractAddress.address);
		console.log('\nFetching Care Facility Information From BlockChain for Care Facility : ', Account, ' Starts >>> ', new Date());
		let careFacilityInfo = myContract.getCareFacility({ from: Account });
		console.log('\nFetching Care Facility Information From BlockChain for Care Facility : ', Account, ' Ends >>> ', new Date());
		careFacilityInfo = (careFacilityInfo == '') ? [] : JSON.parse(careFacilityInfo);
		return callback(null, careFacilityInfo);
	} catch (e) {
		if(e.message==='invalid address'||e.message==='no key for given address or file'){
			console.log('address not found',Account);
			let careFacilityData = jsonfile.readFileSync(careFacilityEthereumMappingPath);
			delete careFacilityData[_.findKey(careFacilityData, function(o) { return o.etheriumAddress == Account; })];
			jsonfile.writeFileSync(careFacilityEthereumMappingPath, careFacilityData, { spaces: 2 });
		}
		return callback(e);
	}
};
