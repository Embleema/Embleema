/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

pragma solidity ^0.4.0;

contract UserRegistry {

	mapping(address => string) public UserInfo;

	function UserRegistry () {
	//constructor
	}

	function addInfo(address addr, string info) {
		UserInfo[addr] = info;
	}

	function getInfo(address addr) constant returns(string) {
		return (UserInfo[addr]);
	}

	function updateInfo(address addr, string info) {
		UserInfo[addr] = info;
	}
}
