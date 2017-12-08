/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const _ = require('underscore');
const Web3 = require('web3');
const path = require('path');
const jsonfile = require('jsonfile');
const config = require('../../config/config');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const medicalEventContractAddress = allContractAddress.medicalEventContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function fetchs the CCDA of a user from bockchain
 * @param {patientAccount} ethereum account of user
 * @param {password} password of ethereum address
 * @private
 */
exports.getAllRecords = function(patientAccount, password, callback) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(patientAccount, password, 1000000);
		const myContract = web3.eth.contract(medicalEventContractAddress.abi).at(medicalEventContractAddress.address);
		let records = [];
		console.log('\nFetching Records From BlockChain for User : ', patientAccount, ' Starts >>> ', new Date());
		let allSubstringLength = myContract.getCCDASubStringArrayLength({from: patientAccount});
		if (allSubstringLength > 0) {
			let ccdaSubstringDetails = getAllCcdaSubstrings(patientAccount, myContract, allSubstringLength);
			console.log('\nFetching Records From BlockChain for User : ', patientAccount, ' Ends >>> ', new Date());
			records = parseCcdaSubstringDetails(ccdaSubstringDetails);
			return callback(null, records);
		} else {
			console.log('\nFetching Records From BlockChain for User : ', patientAccount, ' Ends >>> ', new Date());
			return callback(null, []);
		}
	} catch (e) {
		console.log(e);
		return callback(null);
	}
};

function getAllCcdaSubstrings(patientAccount, myContract, allSubstringLength) {
	let ccdaSubstringDetails = {};
	for (let i = 0; i < allSubstringLength; i++) {
		let subString = myContract.getCCDASubString(i,{from: patientAccount});
		if (isValidJson(subString)) {
			subString = JSON.parse(subString);
			let ccdaId = subString.hdr[0];
			let totalRequiredSubstrings = subString.hdr[1];
			let ccdaSubstringIndex = parseInt(subString.hdr[2]);
			let ccdaSubstring = subString.ss;
			if(!ccdaSubstringDetails.hasOwnProperty(ccdaId)) {
				ccdaSubstringDetails[ccdaId] = {
					totalRequiredSubstrings: totalRequiredSubstrings,
					subStrings : {}
				};
			}
			ccdaSubstringDetails[ccdaId].subStrings[ccdaSubstringIndex] = ccdaSubstring;
		}
	}
	return ccdaSubstringDetails;
}

function parseCcdaSubstringDetails(ccdaSubstringDetails) {
	let records = [];
	_.each(ccdaSubstringDetails, function(ccdaDetails) {
		let totalAvailableSubStrings = Object.keys(ccdaDetails.subStrings).length;
		if(totalAvailableSubStrings === ccdaDetails.totalRequiredSubstrings) {
			// valid substrings are present
			let ccdaJsonString = createCcdaFromSubstrings(ccdaDetails.subStrings);
			if(isValidJson(ccdaJsonString)) {
				records.push(JSON.parse(ccdaJsonString));
			}
		}
	});
	return records;
}

function createCcdaFromSubstrings(subStrings) {
	let ccdaJsonString = '';
	let totalAvailableSubStrings = Object.keys(subStrings).length;
	for(let i = 0; i < totalAvailableSubStrings; i++) {
		if(subStrings.hasOwnProperty(i)) {
			ccdaJsonString += subStrings[i];
		} else {
			ccdaJsonString = '';
			break;
		}
	}
	return ccdaJsonString;
}

function isValidJson(json) {
	try {
		JSON.parse(json);
		return true;
	} catch (e) {
		return false;
	}
}
