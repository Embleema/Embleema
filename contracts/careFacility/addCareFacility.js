/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const Web3 = require('web3');
const async = require('async');
const path = require('path');
const moment = require('moment');
const jsonfile = require('jsonfile');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const careFacilityEthereumMappingPath = path.join(__dirname, '../../data/careFacilityEthereumMappingPath.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const careFacilityContractAddress = allContractAddress.careFacilityContractAddress;
const config = require('../../config/config');
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function adds care facility into blockchain
 *
 * @param {body} information of care facility
 * @public
 */
exports.addCareFacility = function(body, callback) {
	try {
		async.waterfall([
			async.apply(createEthereumAccount, body),
			addCareInfo,
		], function(err) {
			if (err) {
				console.log(err);
				callback(err);
			} else {
				console.log('Saved');
				callback(null, 'saved');
			}
		});
	} catch (e) {
		console.log(e);
		return callback(null, e);
	}
};

/**
 * This function creates an ethereum account for new care facility and transfer ethers
 *
 * @private
 */
function createEthereumAccount(body, callback) {
	console.log('\nAdding Care Facility Starts : >>> ', new Date());
	const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
	const myContract = web3.eth.contract(careFacilityContractAddress.abi).at(careFacilityContractAddress.address);
	web3.personal.unlockAccount(web3.eth.accounts[0], '', 9999999);
	let userData, username, password;
	userData = jsonfile.readFileSync(careFacilityEthereumMappingPath);
	username = body.name.trim().toLowerCase().replace(/ /gi, '_');
	// checks care facility alreay present in careFacilityEthereumMappingpath.json
	if (userData[username]) {
		console.log('\ncare facility already exists');
		return callback('care facility already exists');
	}
	password = username + '_1234';
	const address = web3.personal.newAccount(password);
	// transfer 100 ether from miner account to new care facility account to perform transactions
	const res = web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: address, value: web3.toWei(100, 'ether') });
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
				console.log('\nCare Facility Account Created and Fee Transferred Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
				console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
				console.log('\nCare facility account created(Fee Transferred) : ', address, ' >>>>> ', new Date());
				web3.personal.unlockAccount(address, password, 9999999);
				filter.stopWatching();
				isCallbackSent = true;
				callback(null, myContract, web3, body, username, password, address);
			} else {
				console.log('\n' + txhash + ' Not yet Mined');
				filter.stopWatching();
				isCallbackSent = true;
			}
		}
	});
}

/**
 * This function adds information about the new care facility in the new ethereum account
 *
 * @param {body} information of care facility
 * @param {address} ethereum address of care facility
 * @param {username} username of care facility
 * @param {password} password for ethereum address
 * @param {web3} web3 instance
 * @param {myContract} contract instance
 * @private
 * @private
 */
function addCareInfo( myContract, web3, body, username, password, address, callback) {
	web3.personal.unlockAccount(address, password, 1000000);
	let currentTime = moment.utc().format('ddd MMM DD YYYY HH:mm:ss z');
	body['creationDate'] = currentTime;
	let info = JSON.stringify(body);
	myContract.addCareFacility(info, { gas: 4000000, from: address }, function(err, res) {
		if (err) {
			console.log(' Error : ', err);
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
						console.log('\nCare Facility Information Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
						console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
						let userData = jsonfile.readFileSync(careFacilityEthereumMappingPath);
						// adds registred care facility in careFacilityEthereumMappingPath.json
						userData[username] = {
							etheriumAddress: address,
							creationDate: currentTime
						};
						jsonfile.writeFileSync(careFacilityEthereumMappingPath, userData, { spaces: 2 });
						console.log('\nCare facility info saved for account : ', address , ' >>>>> ', new Date());
						filter.stopWatching();
						isCallbackSent = true;
						callback(null, body);
					} else {
						console.log('\n' + txhash + ' Not yet Mined');
						filter.stopWatching();
						isCallbackSent = true;
					}
				}
			});
		}
	});
}
