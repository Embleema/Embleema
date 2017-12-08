/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

const Web3 = require('web3');
const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');
const cosmos = require('../../lib/ccdas.js');
const config = require('../../config/config');
const conAddress = path.join(__dirname, './../../config/contractAddress.json');
const allContractAddress = jsonfile.readFileSync(conAddress);
const medicalEventContractAddress = allContractAddress.medicalEventContractAddress;
const mainBlockchainNodeInfo = config.blockchainNodeInfo.mainNode;
const userEtheriumMappingPath = path.join(__dirname, '../../data/userEthereumMapping.json');

/**
 * This function check for valid XML file
 *
 * @param {ccda} ccda infomration
 * @param {patientAccount} ethereum address of patient
 * @param {password} password of ethereum address
 * @param {userDetails} user information
 * @return {queryParams} extra parameters
 * @public
 */
exports.addCCDAStrings = function(ccda, patientAccount, password, userDetails, queryParams, documentId, callback) {
	try {
		let lengthOfCcdaChunks = 0;
		let countOfCompletedChunks = 0;
		let statusOfCcdaChunks = [];
		updateCcdaStatusForUser(userDetails.email, queryParams.careFacility, 2);
		const web3 = new Web3(new Web3.providers.HttpProvider(mainBlockchainNodeInfo.protocol + '://' + mainBlockchainNodeInfo.host + ':' + mainBlockchainNodeInfo.port));
		web3.personal.unlockAccount(patientAccount, password, 1000000);
		const myContract = web3.eth.contract(medicalEventContractAddress.abi).at(medicalEventContractAddress.address);
		let data = ccda;
		let ccda_ID = data['ccda_id_root'].toString();
		let obj = JSON.stringify(data);
		// creates chunks of ccda string
		let _size = Math.ceil(obj.length / 4000),
			_ret = new Array(_size),
			_offset;
		console.log('\nCCDA SubString Size : ', _size);
		lengthOfCcdaChunks = _ret.length;
		for (let _i = 0; _i < _size; _i++) {
			_offset = _i * 4000;
			_ret[_i] = obj.substring(_offset, _offset + 4000);
		}
		for (let i = 0; i < _ret.length; i++) {
			let index = (i.toString().length == 1) ? '0' + i : i;
			let str = {
				'hdr': [ccda_ID, _size, index],
				'ss': _ret[i]
			};
			console.log('\nSub String Saving Started >>>>>>>>>>>>>>>>> : ', new Date());
			async.retry({
				times: 3,
				interval: 60000,
				errorFilter: function(err) {
					console.log('Inside errorFilter', err);
					return true;
				},
			}, function(cb) {
				saveStringInEthereum(str, function(err, response) {
					if (err) {
						return cb(err);
					} else {
						return cb(null, response);
					}
				});
			}, function(err) {
				countOfCompletedChunks++;
				if (err) {
					statusOfCcdaChunks[i] = 0;
				} else {
					statusOfCcdaChunks[i] = 1;
				}
				if (countOfCompletedChunks === lengthOfCcdaChunks) {
					let isCcdaSavedSuccessfully = checkIfCcdaIsSaved(statusOfCcdaChunks, lengthOfCcdaChunks);
					if (isCcdaSavedSuccessfully) {
						updateCcdaStatusForUser(userDetails.email, queryParams.careFacility, 1);
						cosmos.updateCCDAs(documentId, function(err, updated) {
							if (err) {
								console.log('error wile updating to cosmos', err);
							}
							console.log('Successfully updated status in cosmos');
						});
					} else {
						updateCcdaStatusForUser(userDetails.email, queryParams.careFacility, 0);
					}
				}
			});
		}
		callback(null, 'done');
		/**
		 * This function adds ccda substrings in blockchain
		 *
		 * @param {str} substring of ccda with added information
		 * @private
		 */
		function saveStringInEthereum(str, callback) {
			myContract.addCCDASubString(JSON.stringify(str), {
				gas: 4000000,
				from: patientAccount
			}, function(err, res) {
				if (err) {
					return callback(err);
				} else {
					console.log('\nCCDA SubString Hash : ' + res);
					const txhash = res;
					const filter = web3.eth.filter('latest');
					let isCallbackSent = false;
					// waiting for mining
					filter.watch(function(error, result) {
						let receipt = web3.eth.getTransactionReceipt(txhash);
						setTimeout(function() {
							if (!isCallbackSent) {
								filter.stopWatching();
								return callback('Data is not mined yet');
							}
						}, 45000);
						if (receipt && receipt.transactionHash == txhash) {
							if (web3.eth.getTransaction(txhash).blockNumber) {
								console.log('\nCCDA SubString Mined : ' + ' Transaction ' + txhash + ' in Block ' + web3.eth.getTransaction(txhash).blockNumber + ' at difficulty ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).difficulty);
								console.log('gasLimit : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasLimit + ' GasUsed : ' + web3.eth.getBlock(web3.eth.getTransaction(txhash).blockNumber).gasUsed + ' nonce ' + web3.eth.getTransaction(txhash).nonce);
								console.log('\nCCDA SubString Saved >>>>>>>>>>>>>>>>> : ', new Date());
								filter.stopWatching();
								isCallbackSent = true;
								return callback(null, result);
							} else {
								console.log('\n' + txhash + ' Not yet Mined');
								filter.stopWatching();
								isCallbackSent = true;
								return callback('Not yet mined');
							}
						}
					});
				}
			});
		}

		/**
		 * This function updates ccda status in UserEthereumMapping.json
		 * @param {userEmail} email address of user
		 * @param {ccdaName} uploaded ccda name
		 * @param {status} uploaded ccda status
		 * @private
		 */
		function updateCcdaStatusForUser(userEmail, ccdaName, status) {
			let userMappingData = jsonfile.readFileSync(userEtheriumMappingPath);
			if (!userMappingData[userEmail].hasOwnProperty('ccdaUploadStatus')) {
				userMappingData[userEmail].ccdaUploadStatus = {};
			}
			let ccdaMappedName = ccdaName.toLowerCase();
			userMappingData[userEmail].ccdaUploadStatus[ccdaMappedName] = status;
			jsonfile.writeFileSync(userEtheriumMappingPath, userMappingData, {
				spaces: 2
			});
		}
	} catch (e) {
		console.log(e);
		return callback(null, e);
	}
};

/**
 * This function checks is ccda saved or not
 * @param {statusOfCcdaChunks} status of uploaded ccda
 * @param {lengthOfCcdaChunks} number of CCDA chunks
 * @private
 */
function checkIfCcdaIsSaved(statusOfCcdaChunks, lengthOfCcdaChunks) {
	let isCcdaSavedSuccessfully = true;
	if (statusOfCcdaChunks.length == lengthOfCcdaChunks) {
		for (let i in statusOfCcdaChunks) {
			if (statusOfCcdaChunks[i] == 0) {
				isCcdaSavedSuccessfully = false;
				break;
			}
		}
	} else {
		isCcdaSavedSuccessfully = false;
	}
	return isCcdaSavedSuccessfully;
}
