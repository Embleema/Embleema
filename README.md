# Embleema
This repository contains 16 modules related to the smart contracts and associated .js modules. It also contains .xlsx with module description.

© 2017 Embleema Inc.
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE
See the GNU General Public License in LICENSE.txt for more details.


The functional description of Embleema’s PatientTruth™ Prototype is described in our White Paper (www.embleema.com).

The Embleema’s PatientTruth™ code contains: 

	-	Solidity smart contracts: representing users (patients, care professionals, admins), care facilities, medical information for a patient, and patient-care professional connections.

	-	Node.js modules for:
		-	smart contract deployment
		-	smart contract function implementation (e.g. register a new user, append a new medical record for a patient in Ethereum…)
		-	admin functions (e.g. retrieve number of patients, patient-care professional connections…) 
		-	ingest and manage medical records in Ethereum. Medical records handled in the prototype are in CCD format (HL7 compliant Continuity of Care Document)

	-	Handlebars (.hbs) files containing the HTLM code for the front-end apps for patients, care professionals and admin.

We have published the source code for the smart contracts and their related node.js modules:

	-	MedicalEvent.sol

		*	addCCDASubString.js
		*	getCCDASubStrings.js

	-	CareProfessionalConnection.sol

		*	addGrantAccessForCareProfessional.js
		*	getGrantAccessForCareProfessional.js

	-	PatientConnection.sol

		*	addGrantAccessByPatient.js
		*	getGrantAccessByPatient.js

	-	UserRegistry.sol

		*	addUserInfo.js
		*	getUserDetails.js
		*	updateUserInfo.js

	-	CareFacility.sol

		*	addCareFacility.js
		*	getCareFacility.js


All the modules and their external specification are listed in the excel file: “Patient_Truth_Code_Modules_Inventory_Dec 2017.xls” 

We welcome your questions and feedback! Please contact us at info@embleema.com.
