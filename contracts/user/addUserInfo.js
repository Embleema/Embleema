/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const fs = require('fs');
const Web3 = require('web3');
const async = require('async');
const moment = require('moment');
const jsonfile = require('jsonfile');
const path = require('path');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const userRegistryContractAddress = allContractAddress.userRegistryContractAddress;
const userEthereumMappingPath = path.join(__dirname, '../../data/userEthereumMapping.json');
const config = require('../../config/config');
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;

/**
 * This function register user and save information into blockchain
 *
 * @param {body} information of new user
 * @public
 */
exports.addUserInfo = function(body, callback) {
	try {
		async.waterfall([
			async.apply(createEthereumAccount, body),
			addUserInfo
		], function(err) {
			if (err) {
				callback(err);
			} else {
				callback(null, 'registered');
			}
		});
	} catch (e) {
		console.log(e);
		return callback(null, e);
	}
};
/**
 * This function creates an ethereum account for new user and transfer ethers
 *
 * @param {body} User Information
 * @private
 */
function createEthereumAccount(body, callback) {
	const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
	const myContract = web3.eth.contract(userRegistryContractAddress.abi).at(userRegistryContractAddress.address);
	web3.personal.unlockAccount(web3.eth.accounts[0], '', 1000000);
	let userData, username, password;
	console.log('\nCreating New Account Starts For ', body.email.toLowerCase(), ' : >>>>> ', new Date());
	userData = jsonfile.readFileSync(userEthereumMappingPath);
	username = body.email.toLowerCase();
	// checks user already present in UserEthereumMapping.json
	if (userData[username]) {
		return callback('User already exists');
	}
	password = username + '_1234';
	//creates a ethereum account
	const address = web3.personal.newAccount(password);
	// transfer 100 ether to new account for performing transactions
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
				return callback('Fee Transferred not mined yet');
			}
		}, 45000);
		if (receipt && receipt.transactionHash == txhash) {
			if (web3.eth.getTransaction(txhash).blockNumber) {
				console.log('\nCreated New Account and Fee Transaferred Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
				console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
				console.log('\nNew Account Created(Fee Transferred) for ', body.email.toLowerCase(), ' With Address ', address, ' >>>>> ', new Date());
				filter.stopWatching();
				isCallbackSent = true;
				callback(null, body, address, username, password, web3, myContract);
			} else {
				filter.stopWatching();
				isCallbackSent = true;
			}
		}
	});
}
/**
 * This function adds information about the new user in the new ethereum account
 *
 * @param {body} information of new user
 * @param {address} ethereum address of user
 * @param {username} username of user
 * @param {password} password for ethereum address
 * @param {web3} web3 instance
 * @param {myContract} contract instance
 * @private
 */
function addUserInfo(body, address, username, password, web3, myContract,callback) {
	let info = JSON.stringify(body);
	web3.personal.unlockAccount(address, password, 9999999);
	myContract.addInfo(address, info, { gas: 4000000, from: address }, function(err, res) {
		if (err) {
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
						console.log('\nUser Profile Information Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
						console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
						let userData = jsonfile.readFileSync(userEthereumMappingPath);
						let username = body.email.toLowerCase();
						//adds new registered user into UserEthereumMapping.json
						userData[username] = {
							etheriumAddress: address,
							userType: body.usrType,
							creationDate: moment.utc().format('ddd MMM DD YYYY HH:mm:ss z')
						};
						fs.writeFileSync(userEthereumMappingPath, JSON.stringify(userData, null, 4), { spaces: 2 });
						isCallbackSent = true;
						console.log('\nUser Registered Successfully with UserName : ', username, ' having account ', address, ' with userType ', userData[username].userType, ' >>> ', new Date());
						filter.stopWatching();
						callback(null, userData);
					} else {
						filter.stopWatching();
						isCallbackSent = true;
					}
				}
			});
		}
	});
}
