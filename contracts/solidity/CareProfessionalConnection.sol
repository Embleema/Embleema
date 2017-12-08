/*
© 2017 Embleema Inc.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE

See the GNU General Public License in LICENSE.txt for more details.*/

pragma solidity ^0.4.0;

contract CareProfessionalConnection {

	mapping(address => string) public ConnectedPatient;

	function CareProfessionalConnection () {
	//constructor
	}

	function addCareProfessionalConnection(string info) {
		ConnectedPatient[msg.sender] = info;
	}

	function getCareProfessionalConnection() constant returns(string) {
		return (ConnectedPatient[msg.sender]);
	}

}
