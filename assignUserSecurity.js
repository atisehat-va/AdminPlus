function securityUpdate2() {        
	debugger;	
	let selectedUserId = null;
	let selectedBuId = null;
	let selectedBusinessUnitId = null;
	let selectedTeamIds = [];
	let selectedRoleIds = [];

	let teamsCheckedValues = [];
	let rolesCheckedValues = [];
	let teamsRadioSelected = null;
	let rolesRadioSelected = null;
	let businessUnitRadioSelected = null;
	let stateArray = { 'team': [], 'role': [] };	
	
	function fetchUsers(callback) {
	    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)').then(callback);
	}
	function fetchRolesForUser(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchTeamsForUser(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchBusinessUnitName(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=businessunitid($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchBusinessUnits(callback) {
	        Xrm.WebApi.retrieveMultipleRecords('businessunit', '?$select=businessunitid,name').then(callback);
	}
	function fetchTeams(callback) {
	  	Xrm.WebApi.retrieveMultipleRecords('team', '?$select=teamid,name&$expand=businessunitid($select=name)').then(callback);
	}
	function fetchSecurityRoles(businessUnitId, callback) {
	    	Xrm.WebApi.retrieveMultipleRecords('role', `?$select=roleid,name&$filter=_businessunitid_value eq ${businessUnitId}`).then(callback);
	}

	function createAppendSecurityPopup() {		
	  var newContainer = document.createElement('div');		
	  newContainer.className = 'assignPopup';		
	  newContainer.innerHTML =  `               
	    <div class="commonPopup-header">Assign User Security</div>
	    <button class="commonback-button" id="commonback-button">Back</button>		  
	    <div class="assignSecurityPopup-row">
	      <div class="assignSection leftUser-section" id="section1">
	        <h3>Current User Security:</h3>
	        <input type="text" id="searchInput1" placeholder="Search Users">
	        <div class="leftUser-list-container">
	          <div id="userList1"></div>
	        </div>
	      </div>                            
	      <div class="assignSection rightBuss-section" id="section2">
	        <h3>Change Business Unit:</h3>
	        <input type="text" id="searchInput2" placeholder="Search Business Units">
	        <div class="businessUnit-list-container">
	          <div id="businessUnitList"></div>
	        </div>
	      </div>
	    </div>
	    <div id="sectionsRow1" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section3">
	        <h3>Business Unit & Teams:</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section5">	        
	     	 <div class="teams-wrapper">		  
	          <div class="teamsRoles-list-container">	          
		  <div id="teamsList"></div>		   
		</div>	  
	       </div>
	      </div>
	    </div>
	    <div id="sectionsRow2" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section4">
	        <h3>Security Roles:</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section6">	        
	         <div class="teams-wrapper">	        
		 <div class="teamsRoles-list-container">
		   <div id="securityRolesList"></div>	          		 
	         </div>
	       </div>
	      </div>
	    </div>
	    <div class="assignSubmit-button-container">	       
	       <button id="assignSubmitButton" style="display: none;">Submit</button>
	    </div>	    
	  `;		
	  document.body.appendChild(newContainer);

	 document.getElementById('commonback-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	  });		
	  makePopupMovable(newContainer);	
	}
	//NewStuff	
	function toggleCheckboxes(action, classNames) {
	  // Accept either a single class name or an array of class names
	  const classes = Array.isArray(classNames) ? classNames : [classNames];
	  classes.forEach(className => {
	    const checkboxes = document.querySelectorAll(`.${className}`);
	    
	    checkboxes.forEach(checkbox => {
	      if (action === 'disable') {
	        checkbox.checked = false;
	      }
	      checkbox.disabled = (action === 'disable');
	    });
	  });
	}
	//endNewStuff
	
	function renderGenericList(entities, selectCallback, sectionId, searchInputId, classNamePrefix, textProperty, idProperty, skipSectionWrapper = false) {
	    const listDiv = document.getElementById(sectionId);
	    listDiv.innerHTML = '';
	
	    // Add "No Change" radio button if it's a Business Unit
	    if (classNamePrefix === 'businessUnit') {
	        addNoChangeRadioButton(listDiv, sectionId);
	    }
	
	    entities.forEach(entity => {
	        const entityDiv = document.createElement('div');
	        entityDiv.className = `${classNamePrefix}${sectionId.charAt(sectionId.length - 1)}`;
	
	        const wrapperDiv = document.createElement('div');
	        if (!skipSectionWrapper) {
	            wrapperDiv.className = 'sectionWrapper';
	        }
	
	        if (classNamePrefix === 'businessUnit') {
	            const inputElement = document.createElement('input');
	            inputElement.type = 'radio';
	            inputElement.name = 'businessUnit';
	            inputElement.className = 'businessUnitRadioButtons';
	            inputElement.value = entity['businessunitid']; 
	            wrapperDiv.appendChild(inputElement);
		    
		    inputElement.addEventListener('change', function() {
	               toggleCheckboxes('disable', ['assignCheckbox', 'teamsCheckbox', 'teamsRadioButtons', 'rolesCheckbox', 'rolesRadioButtons']);
                       businessUnitRadioSelected = this.value; // Set the global variable here
                    });
			
	        }
	
	        const textDiv = document.createElement('div');
	        textDiv.dataset.id = entity[idProperty];
	        textDiv.dataset.searchText = entity[textProperty];
	        textDiv.onclick = () => selectCallback(entity);
	        textDiv.textContent = entity[textProperty] || 'N/A';
	
	        wrapperDiv.appendChild(textDiv);
	        entityDiv.appendChild(wrapperDiv);
	
	        listDiv.appendChild(entityDiv);
	    });
	}
	
	function addNoChangeRadioButton(listDiv, sectionId) {
	    const noChangeDiv = document.createElement('div');
	    noChangeDiv.className = 'businessUnit' + sectionId.charAt(sectionId.length - 1);
	
	    const wrapperDiv = document.createElement('div');
	    wrapperDiv.className = 'sectionWrapper';
	
	    const noChangeRadio = document.createElement('input');
	    noChangeRadio.type = 'radio';
	    noChangeRadio.name = 'businessUnit';
	    noChangeRadio.value = 'noChange';
	    noChangeRadio.className = 'businessUnitRadioButtons';
	    wrapperDiv.appendChild(noChangeRadio);
	
	    const textDiv = document.createElement('div');
	    textDiv.textContent = 'No Change';
	    wrapperDiv.appendChild(textDiv);
	
	    noChangeDiv.appendChild(wrapperDiv);
	    listDiv.appendChild(noChangeDiv);

	    
	    noChangeRadio.addEventListener('change', function() {
	      toggleCheckboxes('enable', ['assignCheckbox', 'teamsCheckbox', 'teamsRadioButtons', 'rolesCheckbox', 'rolesRadioButtons']);
              businessUnitRadioSelected = this.value; 
           });
	}
	
	function addSearchFunctionality(array, inputElementId, displayFunction, targetElement) {
	    const searchInput = document.getElementById(inputElementId);
	
	    searchInput.addEventListener('input', function() {
	        const query = this.value.toLowerCase();
	        const filteredArray = array.filter(item => {
	            let name = item.hasOwnProperty('name') ? item.name : '';
	            let businessUnitName = item.hasOwnProperty('businessUnitName') ? `(${item.businessUnitName})` : '';
	            const itemInfo = `${name} ${businessUnitName}`.toLowerCase().trim();
	            return itemInfo.includes(query);
	        });
	
	        displayFunction(filteredArray, targetElement);
	    });
	}
	
	function createAndAppendItems(itemArray, targetElement, valueType, valueKey, textKeys, additionalClassNames, itemType) {
	    // Clear the existing content
	    targetElement.innerHTML = '';
	
	    // Choose the appropriate array to check the state
	    const relevantStateArray = stateArray[itemType] || [];
	
	    // Loop through each item in the array
	    itemArray.forEach(item => {
	        const wrapperDiv = document.createElement('div');
	        wrapperDiv.className = 'sectionWrapper';
	
	        if (itemType === 'team') {
	            wrapperDiv.classList.add('teamClass'); 
	        } else if (itemType === 'role') {
	            wrapperDiv.classList.add('roleClass'); 
	        }
	
	        const assignCheckbox = document.createElement('input');
	        assignCheckbox.type = valueType;
	        assignCheckbox.value = item[valueKey];
	        assignCheckbox.className = additionalClassNames;
	
	        // Check if this checkbox was selected earlier
	        if (relevantStateArray.includes(assignCheckbox.value)) {
	            assignCheckbox.checked = true;
	        }
	
	        assignCheckbox.addEventListener('change', function() {
	            // Update the relevantStateArray
	            if (this.checked) {
	                if (!relevantStateArray.includes(this.value)) {
	                    relevantStateArray.push(this.value);
	                }
	            } else {
	                const index = relevantStateArray.indexOf(this.value);
	                if (index > -1) {
	                    relevantStateArray.splice(index, 1);
	                }
	            }
	            
	            // Add or remove from teamsCheckedValues or rolesCheckedValues
	            const arrayToUse = (itemType === 'team') ? teamsCheckedValues : rolesCheckedValues;
	            if (this.checked) {
	                if (!arrayToUse.includes(this.value)) {
	                    arrayToUse.push(this.value);
	                }
	            } else {
	                const index = arrayToUse.indexOf(this.value);
	                if (index > -1) {
	                    arrayToUse.splice(index, 1);
	                }
	            }
	        });
	
	        const label = document.createElement('label');
	        label.textContent = textKeys.map(key => item[key]).join(' ');
	
	        wrapperDiv.appendChild(assignCheckbox);
	        wrapperDiv.appendChild(label);
	
	        targetElement.appendChild(wrapperDiv);
	    });
	}
	
	function selectUser(user, sectionPrefix) {
		try {
			const messageDiv = document.getElementById('updateMessage');
			if (messageDiv) {
				messageDiv.style.display = 'none';
			}		
			
			document.querySelectorAll('.userSelected').forEach(el => el.classList.remove('userSelected'));		
		        const userDiv = document.getElementById('userList' + sectionPrefix).querySelector(`[data-id='${user.systemuserid}']`);
		        if (userDiv) {
		            userDiv.classList.add('userSelected');
		        }		
		        
		        if (sectionPrefix === '1') {
		            selectedUserId = user.systemuserid;
		            selectedBusinessUnitId = user._businessunitid_value;
				
   			    //clear Selected Values			    
			    stateArray['team'] = [];
			    stateArray['role'] = [];
		        }
			const businessUnitAndTeamsList = document.getElementById('section' + (3 + (sectionPrefix - 1) * 2)).querySelector('ul');
		        businessUnitAndTeamsList.innerHTML = '';
			let businessUnitListItem = null;
		        let teamListItems = [];
			
			const appendLists = () => {
		            if (businessUnitListItem) {
		                businessUnitAndTeamsList.appendChild(businessUnitListItem);
		            }
		            teamListItems.forEach(item => businessUnitAndTeamsList.appendChild(item));
		        };
			fetchBusinessUnitName(user.systemuserid, function(response) {
				if (!response || !response.entities[0] || !response.entities[0].businessunitid || !response.entities[0].businessunitid.name) {
					console.error('Business unit not found');
					return;
				}
				const businessUnitName = response.entities[0].businessunitid.name;
				if (sectionPrefix === '1') {
					selectedBusinessUnitId = user._businessunitid_value;
				}
				businessUnitListItem = document.createElement('li');
				businessUnitListItem.textContent = 'Business Unit: ' + businessUnitName;
				appendLists();
			});
			fetchTeamsForUser(user.systemuserid, function(response) {
				if (!response || !response.entities || !response.entities[0].teammembership_association) {
					console.error('Teams not found');
					return;
				}
				if (sectionPrefix === '1') {
					selectedTeamIds = [];
				}
				teamListItems = response.entities[0].teammembership_association.map(team => {
				   if (sectionPrefix === '1') {
					selectedTeamIds.push(team.teamid);
				   }	
				   const listItem = document.createElement('li');
				   listItem.textContent = 'Team: ' + team.name;
				   return listItem;
				});
				appendLists();				
			});			
			// Target the teamsList div where you'll populate the team information
		        const teamsList = document.getElementById('teamsList');
		        teamsList.innerHTML = '';
		
		       // Fetch the teams
			fetchTeams(function(teams) {
			    if (!teams || !teams.entities) {
			        console.error('Teams not found');
			        return;
			    }						    
				
			    const teamsList = document.getElementById('teamsList');
			    teamsList.innerHTML = '';
			
			    const teamDetailsArr = teams.entities.map(team => ({
				    name: team.name, 
				    teamid: team.teamid, 
				    businessUnitName: team.businessunitid ? `(BU: ${team.businessunitid.name})` : 'BU: N/A'
			    }));						
		            teamDetailsArr.sort((a, b) => {
			            return a.name.localeCompare(b.name);
			    });	
					    	
			    addSearchFunctionality(teamDetailsArr, 'searchInput3', (filteredItems) => {
			    	const teamsList = document.getElementById('teamsList');
			   	 // Added 'team' as the last argument for item type
			   	 createAndAppendItems(filteredItems, teamsList, 'checkbox', 'teamid', ['name', 'businessUnitName'], 'teamsCheckbox', 'team');
				});
				// Added 'team' as the last argument for item type
				createAndAppendItems(teamDetailsArr, teamsList, 'checkbox', 'teamid', ['name', 'businessUnitName'], 'teamsCheckbox', 'team');
			   });
			
			if (sectionPrefix === '1') {
			    // Fetch roles specific to the user and display them under section4
			    const rolesListUser = document.getElementById('section4').querySelector('ul');
			    rolesListUser.innerHTML = '';
			
			    fetchRolesForUser(user.systemuserid, function(roles) {
			        if (!roles || !roles.entities) {
			            console.error('Roles not found');
			            return;
			        }
			        if (sectionPrefix === '1') {
			            selectedRoleIds = [];
			        }
			        const rolesList = document.getElementById('section' + (4 + (sectionPrefix - 1) * 2)).querySelector('ul');
			        rolesList.innerHTML = '';
			        const roleDetailsArr = [];
			        const rolePromises = roles.entities.map(role => {
			            const roleId = role['roleid'];
			            if (sectionPrefix === '1') {
			                selectedRoleIds.push(roleId);
			            }
			            return Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
			                roleDetailsArr.push(roleDetail);
			            });
			        });								
				createAndAppendItems(roleDetailsArr, rolesListUser, 'checkbox', 'roleid', ['name'], 'rolesCheckbox', 'role');
				    
			        Promise.all(rolePromises).then(() => {
			            // Using localeCompare for sorting
			            roleDetailsArr.sort((a, b) => {
			                return a.name.localeCompare(b.name);
			            });
			            roleDetailsArr.forEach(roleDetail => {
			                const listItem = document.createElement('li');
			                listItem.textContent = roleDetail.name;
			                rolesList.appendChild(listItem);
			            });
			        });
			    });     			    			
			     
			    // Fetch roles based on the business unit and display them under section6
			    const rolesListBusinessUnit = document.getElementById('section6').querySelector('#securityRolesList');
				rolesListBusinessUnit.innerHTML = '';
				
				fetchSecurityRoles(selectedBusinessUnitId, function(response) {
				    if (!response || !response.entities) {
				        console.error('Roles not found');
				        return;
				    }		        
				    const roleDetailsArr = response.entities.map(role => ({name: role.name, roleid: role.roleid}));
				    
				    // Using localeCompare for sorting
				    roleDetailsArr.sort((a, b) => {
				        return a.name.localeCompare(b.name);
				    });				
				       addSearchFunctionality(roleDetailsArr, 'searchInput4', (filteredItems) => {
					   createAndAppendItems(filteredItems, rolesListBusinessUnit, 'checkbox', 'roleid', ['name'], 'rolesCheckbox', 'role');
				       });
				       createAndAppendItems(roleDetailsArr, rolesListBusinessUnit, 'checkbox', 'roleid', ['name'], 'rolesCheckbox', 'role');
				});
				//newStuff
				// Add radio buttons for section5 (Team Actions)
			        addRadioButtonsToSection('section5', 'teamAction', [
				    { id: 'noTeamUpdate', label: 'No Change', value: 'noTeamUpdates' },				    
				    { id: 'addTeam', label: 'Add', value: 'addTeam' },
				    { id: 'removeTeam', label: 'Remove', value: 'removeTeam' },
				    { id: 'addAndRemoveTeam', label: 'Add + Remove Existing', value: 'addAndRemoveTeam' }
				], 'Change Team(s):', 'Search Teams', 'searchInput3', 'teamsRadioButtons');
				
				// For roles, with the class name "roleRadioButtonClass"
				addRadioButtonsToSection('section6', 'roleAction', [
				    { id: 'noRoleUpdate', label: 'No Change', value: 'noRoleUpdates' },
				    { id: 'addRole', label: 'Add', value: 'addRole' },
				    { id: 'removeRole', label: 'Remove', value: 'removeRole' },				    
				    { id: 'addAndRemoveRole', label: 'Add + Remove Existing', value: 'addAndRemoveRole' }
				], 'Change Security Role(s):', 'Search Security Role', 'searchInput4', 'rolesRadioButtons');

				//newStuff
				function createElementWithAttributes(tag, attributes = {}) {
				    const element = document.createElement(tag);
				    Object.entries(attributes).forEach(([key, value]) => {
				        element[key] = value;
				    });
				    return element;
				}
				
				function createAndAppendMessageDiv(parentNode, message, id, fontSize = "20px", fontWeight = "bold") {
				    const messageDiv = createElementWithAttributes('div', {
				        id,
				        innerHTML: message,
				        style: { fontSize, fontWeight }
				    });
				    parentNode.appendChild(messageDiv);
				    return messageDiv;
				}

				// Helper function to toggle element visibility
				function toggleElementDisplay(element, state = 'none') {
				    if (element) element.style.display = state;
				}
				
				// Helper function to remove element by ID
				function removeElementById(id) {
				    const existingElement = document.getElementById(id);
				    if (existingElement) existingElement.remove();
				}
				//EndNewStuff
				
				const submitButton = document.getElementById('assignSubmitButton');
				if (submitButton) {
				    toggleElementDisplay(submitButton, 'block');
				    submitButton.addEventListener('click', async function(event) {
				        console.log("submitButton clicked.");
				
				        // Remove existing message if it exists
				        removeElementById('updateMessage');
				
				        // Hide submit button and show message
				        toggleElementDisplay(event.target, 'none');
				        const messageDiv = createAndAppendMessageDiv(event.target.parentNode, 'Your update is in progress, please be patient...', 'updateMessage');
				
				        if (typeof updateUserDetails === "function") {					    
					    toggleCheckboxes('disable', ['assignCheckbox', 'teamsCheckbox', 'teamsRadioButtons', 'rolesCheckbox', 'rolesRadioButtons', 'businessUnitRadioButtons']);
					    await handleConditions(businessUnitRadioSelected, teamsRadioSelected, teamsCheckedValues, rolesRadioSelected, rolesCheckedValues);					    
					    toggleCheckboxes('enable', ['teamsRadioButtons', 'rolesRadioButtons', 'businessUnitRadioButtons']);
					    teamsCheckedValues = [];
					    rolesCheckedValues = [];
					    teamsRadioSelected = null;
					    rolesRadioSelected = null;
					    businessUnitRadioSelected = null;					    			    				            
				
				            // Remove message and show update
				            removeElementById('updateMessage');
				            createAndAppendMessageDiv(event.target.parentNode, `Security updated for ${selectedUserId}`, 'updateMessage');								    
					    
				        } else {
				            console.log("updateUserDetails is NOT accessible");
				        }										
				    });
				}
				//endNewStuff				
			}			
		} catch (e) {
			console.error('Error in selectUser function', e);
		}			
	}	
	async function handleConditions(businessUnitRadioSelected, teamsRadioSelected, teamsCheckedValues, rolesRadioSelected, rolesCheckedValues) {
	    if (businessUnitRadioSelected && businessUnitRadioSelected !== "noChange") {
	        await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "ChangeBU");
	        console.log('Business unit selected.');
	    }
	    
	    if (teamsRadioSelected && teamsCheckedValues.length > 0) {
	        if (teamsRadioSelected === "addTeam") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "AddTeams");
		} else if (teamsRadioSelected === "removeTeam") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "RemoveTeams");
		} else if (teamsRadioSelected === "addAndRemoveTeam") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "RemoveAllTeams");
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "AddTeams");
		} else {
		    console.log('No update needed on Teams');
		}	        
	    }
	
	    if (rolesRadioSelected && rolesCheckedValues.length > 0) {
	        if (rolesRadioSelected === "addRole") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "AddRoles");
		} else if (rolesRadioSelected === "removeRole") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "RemoveRoles");
		} else if (rolesRadioSelected === "addAndRemoveRole") {
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "RemoveAllRoles");
		    await updateUserDetails(selectedUserId, businessUnitRadioSelected, teamsCheckedValues, rolesCheckedValues, "AddRoles");
		} else {
		    console.log('No update needed on Teams');
		}
	    }
	}



	
	//newStuff
	// Function to add radio buttons to a given section
	function addRadioButtonsToSection(sectionId, radioName, radioData, headingText, inputIds, inputId, radioButtonClassName) {
	    const sectionElement = document.getElementById(sectionId);
	
	    if (sectionElement.getAttribute('data-hasRadioButtons') === 'true') {
	        return;
	    }
	
	    sectionElement.setAttribute('data-hasRadioButtons', 'true');
	
	    if (headingText) {
	        const heading = document.createElement('h3');
	        heading.appendChild(document.createTextNode(headingText));
	        sectionElement.appendChild(heading);
	    }
	
	    if (inputIds) {
	        const inputWrapper = document.createElement('div');
	        inputWrapper.className = 'teamsRoles-input-wrapper';
	
	        const searchInput = document.createElement('input');
	        searchInput.type = 'text';
	        searchInput.id = inputId;
	        searchInput.placeholder = inputIds;
	
	        inputWrapper.appendChild(searchInput);
	        sectionElement.appendChild(inputWrapper);
	    }
	
	    let teamsWrapper = sectionElement.querySelector('.teams-wrapper');
	    if (!teamsWrapper) {
	        teamsWrapper = document.createElement('div');
	        teamsWrapper.className = 'teams-wrapper';
	        sectionElement.appendChild(teamsWrapper);
	    }
	
	    const container = document.createElement('div');
	    container.className = 'team-action-checkboxes';
	    container.innerHTML = '';
	
	    const actionMap = {
	      'noTeamUpdates': { action: 'disable', classes: ['teamsCheckbox'] },
	      'addTeam': { action: 'enable', classes: ['teamsCheckbox'] },
	      'removeTeam': { action: 'enable', classes: ['teamsCheckbox'] },
	      'addRole': { action: 'enable', classes: ['rolesCheckbox'] },
	      'removeRole': { action: 'enable', classes: ['rolesCheckbox'] },
	      'addAndRemoveTeam': { action: 'enable', classes: ['teamsCheckbox'] },
	      'noRoleUpdates': { action: 'disable', classes: ['rolesCheckbox'] },		  
	    };
	
	    radioData.forEach(({ id, label, value }) => {
	        const radioButton = document.createElement('input');
	        radioButton.type = 'radio';
	        radioButton.id = id;
	        radioButton.className = radioButtonClassName;
	        radioButton.name = radioName;
	        radioButton.value = value;
	
	        radioButton.addEventListener('change', function() {		
		    const selectedAction = actionMap[this.value] || { action: 'enable', classes: ['teamsCheckbox', 'rolesCheckbox'] };
		    toggleCheckboxes(selectedAction.action, selectedAction.classes);
		
		    if (radioName === 'teamAction') {
		        teamsRadioSelected = this.value;		            
		    } else if (radioName === 'roleAction') {
		        rolesRadioSelected = this.value;		            
		    }
		});
	
	        const labelElement = document.createElement('label');
	        labelElement.htmlFor = id;
	        labelElement.appendChild(document.createTextNode(label));
	
	        const wrapperDiv = document.createElement('div');
	        wrapperDiv.className = 'sectionWrapper';
	        wrapperDiv.appendChild(radioButton);
	        wrapperDiv.appendChild(labelElement);
	
	        container.appendChild(wrapperDiv);
	    });
	
	    teamsWrapper.appendChild(container);
	    sectionElement.appendChild(teamsWrapper);
	}
	//EndNewStuff
	
	function setupSearchFilter(searchInputId, targetClassSuffix) {
	    document.getElementById(searchInputId).oninput = function() {
	        const searchValue = this.value.toLowerCase();
	        document.querySelectorAll(`.${targetClassSuffix}`).forEach(el => {
	            const searchText = el.dataset.searchText || el.textContent;
	            el.style.display = searchText.toLowerCase().includes(searchValue) ? 'block' : 'none';
	        });
	    };
	}
	
	function displayPopup(users, businessUnits) {
	    if (users && users.entities) {
	        users.entities.sort((a, b) => (a.fullname || "").localeCompare(b.fullname || ""));
	    }	
	    const newContainer = createAppendSecurityPopup();
	
	    if (businessUnits && businessUnits.entities) {
	        businessUnits.entities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
	    }
	    if (users && users.entities) {		    
		renderGenericList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1', 'user', 'fullname', 'systemuserid', true);		
	    }	
	   if (businessUnits && businessUnits.entities) {
	        renderGenericList(businessUnits.entities, businessUnit => selectItem(businessUnit, '1'), 'businessUnitList', 'searchInput2', 'businessUnit', 'name', 'id');		
	   }		
	      setupSearchFilter('searchInput1', `user${'userList1'.charAt('userList1'.length - 1)}`);
	      setupSearchFilter('searchInput2', `businessUnit${'businessUnitList'.charAt('businessUnitList'.length - 1)}`);	 
	}	
	
	 Promise.all([
	    new Promise(resolve => fetchUsers(resolve)),
	    new Promise(resolve => fetchBusinessUnits(resolve)),	    
	 ]).then(([users, businessUnits]) => {
	    displayPopup(users, businessUnits);	     
	});
	
	function loadScript(src, callback, errorCallback) {
	    const script = document.createElement("script");
	    script.type = "text/javascript";
	    script.onload = callback;
	    script.onerror = errorCallback;
	    script.src = src;
	    document.body.appendChild(script);
	}
}
