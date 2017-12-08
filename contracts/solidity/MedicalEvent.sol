/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

pragma solidity ^0.4.0;

contract MedicalEvent {

	mapping(address=>string[]) public PCstr;

	function MedicalEvent() {
		//constructor
	}

	function addCCDASubString(string _str) {
		PCstr[msg.sender].push(_str);
	}

	function getCCDASubString(uint i) constant returns(string) {
		return (PCstr[msg.sender][i]);
	}

	function getCCDASubStringArrayLength() constant returns(uint){
		return (PCstr[msg.sender].length);
	}
}
