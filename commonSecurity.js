window.updateUserDetails = async function(selectedUserId, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds, actionType) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

  try {
    switch (actionType) {
      case 'Change BUTR':
        await changeBusinessUnit(selectedUserId, selectedBusinessUnitId);
        await disassociateUserFromTeams(selectedUserId, clientUrl);
        await disassociateUserFromRoles(selectedUserId, clientUrl);    
    
        for (const roleId of selectedRoleIds) {
          await associateUserToRole(selectedUserId, roleId, clientUrl);
        }
        
        for (const teamId of selectedTeamIds) {
          await associateUserToTeam(selectedUserId, teamId, clientUrl);
        } 
        break;

      case 'ChangeBU':
        await changeBusinessUnit(selectedUserId, selectedBusinessUnitId);
        break;

      case 'AddTeams':
        for (const teamId of selectedTeamIds) {
          await associateUserToTeam(selectedUserId, teamId, clientUrl);
        }
        break;
      case 'RemoveAllTeams':
        await disassociateUserFromTeams(selectedUserId, clientUrl);
        break;
        
      case 'RemoveTeams':
        await disassociateUserFromSpecificTeams(selectedUserId, selectedTeamIds, clientUrl);
        break;

      case 'RemoveAllRoles':
        await disassociateUserFromRoles(selectedUserId, clientUrl);
        break;

      case 'AddRoles':
        for (const roleId of selectedRoleIds) {
          await associateUserToRole(selectedUserId, roleId, clientUrl);
        }
        break;

      case 'RemoveRoles':
        await disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds, clientUrl);
        break;

      default:
        console.error(`Invalid actionType: ${actionType}`);
        break;
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function changeBusinessUnit(selectedUserId, selectedBusinessUnitId) {
  const data1 = {
    "businessunitid@odata.bind": `/businessunits(${selectedBusinessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", selectedUserId, data1);
}

async function disassociateUserFromRoles(selectedUserId, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
    
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.2/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}
//NewCode
// Disassociate user from specific roles

async function disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds, clientUrl) {
  await Promise.all(selectedRoleIds.map(async (roleId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.2/roles(${roleId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

//new 11/10
/*
async function disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds) {
  if (!selectedUserId || !selectedRoleIds) {
    console.error("Invalid parameters.");
    return;
  }

  // Ensure selectedRoleIds is always an array
  if (!Array.isArray(selectedRoleIds)) {
    selectedRoleIds = [selectedRoleIds];
  }

  try {
    await Promise.all(selectedRoleIds.map(async (roleId) => {
      var disassociateRequest = {
        target: { entityType: "systemuser", id: selectedUserId },
        relatedEntities: [{ entityType: "role", id: roleId }],
        relationship: "systemuserroles_association", // Correct relationship name
        getMetadata: function () {
          return {
            boundParameter: null,
            parameterTypes: {},
            operationType: 2, // Disassociate operation
            operationName: "Disassociate"
          };
        }
      };

      const response = await Xrm.WebApi.online.execute(disassociateRequest);
      if (!response.ok) {
        console.error(`Failed to disassociate role ${roleId} from user ${selectedUserId}`);
      }
    }));

    console.log('Successfully disassociated specified roles from user.');
  } catch (error) {
    console.error('Error occurred:', error);
  }
} */

// Disassociate user from specific teams
async function disassociateUserFromSpecificTeams(selectedUserId, selectedTeamIds, clientUrl) {
  await Promise.all(selectedTeamIds.map(async (teamId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${teamId})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}
//EndNewCode

/*
async function disassociateUserFromTeams(selectedUserId, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
  
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
} */
async function disassociateUserFromTeams(selectedUserId, clientUrl) {
  // Assuming that teamtype is a property of the team entity and the API supports the $filter query.
  const teamsUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/teammembership_association?$filter=teamtype eq 0 or teamtype eq 1`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();

  await Promise.all(results.value.map(async (result) => {
    // Only disassociate if the teamtype is Owner (0) or Access (1)
    if (result.teamtype === 0 || result.teamtype === 1) {
      const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
      await fetch(disassociateUrl, { method: "DELETE" });
    }
  }));
}

async function associateUserToTeam(selectedUserId, selectedTeamIds, clientUrl) {
  const associateTeamUrl = `${clientUrl}/api/data/v9.2/teams(${selectedTeamIds})/teammembership_association/$ref`;
  const associateTeamData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  await fetch(associateTeamUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateTeamData)
  });
} 

/*
async function associateUserToRole(selectedUserId, selectedRoleIds, clientUrl) {
  const associateRoleUrl = `${clientUrl}/api/data/v9.2/roles(${selectedRoleIds})/systemuserroles_association/$ref`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  await fetch(associateRoleUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateRoleData)
  });
}*/

//Test 10/16/2023
/*
async function associateUserToRole(selectedUserId, selectedRoleIds, clientUrl) {
  if (!selectedUserId || !selectedRoleIds || !clientUrl) {
    console.error("Invalid parameters.");
    return;
  }

  const associateRoleUrl = `${clientUrl}/api/data/v9.2/roles(${selectedRoleIds})/systemuserroles_association/$ref?`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  
  console.log(`Associating role using URL: ${associateRoleUrl}`);
  console.log(`Associate Role Data: ${JSON.stringify(associateRoleData)}`);

  try {
    const response = await fetch(associateRoleUrl, {
      method: "POST",
      headers: { 
        "OData-MaxVersion": "4.0", 
        "OData-Version": "4.0", 
        "Accept": "application/json", 
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(associateRoleData)
    });
    
    if (!response.ok) {
      const responseData = await response.json();
      console.error('Server returned:', responseData);
    } else {
      console.log('Successfully associated role to user.');
    }
    
  } catch (error) {
    console.error('Fetch failed:', error);
  }
} */
//test11/10
async function associateUserToRole(selectedUserId, selectedRoleIds) {
  if (!selectedUserId || !selectedRoleIds) {
    console.error("Invalid parameters.");
    return;
  }

  // Ensure selectedRoleIds is always an array
  if (!Array.isArray(selectedRoleIds)) {
    selectedRoleIds = [selectedRoleIds];
  }

  // Preparing the association request
  var associateRequest = {
    target: { entityType: "systemuser", id: selectedUserId }, // User ID
    relatedEntities: selectedRoleIds.map(roleId => ({ entityType: "role", id: roleId })),
    relationship: "systemuserroles_association", // Correct relationship name
    getMetadata: function () {
      return {
        boundParameter: null,
        parameterTypes: {},
        operationType: 2,
        operationName: "Associate"
      };
    }
  };

  console.log(`Associating user to roles...`);

  try {
    const response = await Xrm.WebApi.online.execute(associateRequest);
    if (response.ok) {
      console.log('Successfully associated roles to user.');
    } else {
      console.error('Association failed:', response);
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

