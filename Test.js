javascript: (function() {
  const popupCss = `
    .popup { background-color: #f9f9f9; border: 3px solid #444; border-radius: 20px; width: 90%; height: 80%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
    .section { padding: 20px; border-right: 1px solid #ccc; overflow-y: scroll; }
    .section h3 { text-align: center; margin-bottom: 15px; color: #444; }
    .user-section { text-align: center; height: 220px; }
    .user-section input { margin-bottom: 15px; width: 230px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
    .user-section #userList { margin-bottom: 15px; max-height: 130px; overflow-y: scroll; scrollbar-width: thin; -ms-overflow-style: auto; }
    .user-section #userList::-webkit-scrollbar { width: 5px; }
    .user-section #userList::-webkit-scrollbar-thumb { background: #ccc; }
    .details-section { display: inline-block; width: 33%; height: 250px; vertical-align: top; box-sizing: border-box; text-align: left; }
    .selected { background-color: #e0e0e0; }
    .user { cursor: pointer; padding: 5px; font-size: 14px; transition: background-color 0.3s; }
    .user:hover { background-color: #f0f0f0; }
    #sectionsRow { white-space: nowrap; }
    .popup-row { display: flex; }
    .popup-header { text-align: center; padding: 15px; background-color: #444; color: #fff; font-size: 18px; border-bottom: 2px solid #333; border-radius: 20px 20px 0 0; }
  `;

  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function fetchTeamsForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
  }

  function fetchBusinessUnitName(businessUnitId, callback) {
    Xrm.WebApi.retrieveRecord('businessunit', businessUnitId, '?$select=name').then(callback);
  }

 function createPopupHtml() {
  return `
    <div class="popup">
      <div class="popup-header">User Details</div>
      <style>${popupCss}</style>
      <div class="popup-row">
        <div class="section user-section" id="section1">
          <h3>User Info</h3>
          <input type="text" id="searchInput1" placeholder="Search Users">
          <div id="userList1"></div>
        </div>
        <div class="section user-section" id="section2">
          <h3>User Info 2</h3>
          <input type="text" id="searchInput2" placeholder="Search Users">
          <div id="userList2"></div>
        </div>
      </div>
      <div id="sectionsRow1" class="popup-row">
        <div class="section details-section" id="section3"><h3>Business Unit & Teams</h3><ul></ul></div>
        <div class="section details-section" id="section4"><h3>Security Roles</h3><ul></ul></div>
      </div>
      <div id="sectionsRow2" class="popup-row">
        <div class="section details-section" id="section5"><h3>Business Unit & Teams</h3><ul></ul></div>
        <div class="section details-section" id="section6"><h3>Security Roles</h3><ul></ul></div>
      </div>
    </div>`;
}

  function createAndAppendPopup() {
    const popupHtml = createPopupHtml();
    const popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = popupHtml;
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '10000';
    popupDiv.style.left = '50%';
    popupDiv.style.top = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popupDiv);
    return popupDiv;
  }

  function renderUserList(users, selectUserCallback, sectionId, searchInputId) {
    const userListDiv = document.getElementById(sectionId);
    users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.className = `user${sectionId.charAt(sectionId.length - 1)}`;
      userDiv.textContent = user.fullname;
      userDiv.dataset.id = user.systemuserid;
      userDiv.onclick = () => selectUserCallback(user);
      userListDiv.appendChild(userDiv);
    });
  }

function selectUser(user, sectionPrefix) {
  try {
    document.querySelectorAll('.user1, .user2').forEach(el => el.classList.remove('selected'));
    const userDiv = document.getElementById('userList' + sectionPrefix).querySelector(`[data-id='${user.systemuserid}']`);
    userDiv.classList.add('selected');

    const businessUnitAndTeamsList = document.getElementById('section' + (3 + (sectionPrefix - 1) * 2)).querySelector('ul');
    businessUnitAndTeamsList.innerHTML = '';

    fetchBusinessUnitName(user._businessunitid_value, function(businessUnit) {
      if (!businessUnit || !businessUnit.name) {
        console.error('Business unit not found');
        return;
      }
      const listItem = document.createElement('li');
      listItem.textContent = 'Business Unit: ' + businessUnit.name;
      businessUnitAndTeamsList.appendChild(listItem);
    });

    fetchTeamsForUser(user.systemuserid, function(response) {
      if (!response || !response.entities || !response.entities[0].teammembership_association) {
        console.error('Teams not found');
        return;
      }
      response.entities[0].teammembership_association.forEach(team => {
        const listItem = document.createElement('li');
        listItem.textContent = 'Team: ' + team.name;
        businessUnitAndTeamsList.appendChild(listItem);
      });
    });

    fetchRolesForUser(user.systemuserid, function(roles) {
      if (!roles || !roles.entities) {
        console.error('Roles not found');
        return;
      }
      const rolesList = document.getElementById('section' + (4 + (sectionPrefix - 1) * 2)).querySelector('ul');
      rolesList.innerHTML = '';
      roles.entities.forEach(role => {
        const roleId = role['roleid'];
        Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
          const listItem = document.createElement('li');
          listItem.textContent = roleDetail.name;
          rolesList.appendChild(listItem);
        });
      });
    });
  } catch (e) {
    console.error('Error in selectUser function', e);
  }
}

  function setupSearchFilter(searchInputId) {
    document.getElementById(searchInputId).oninput = function() {
      const searchValue = this.value.toLowerCase();
      document.querySelectorAll(`.user${searchInputId.charAt(searchInputId.length - 1)}`).forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
      });
    };
  }

  function displayPopup(users) {
    const popupDiv = createAndAppendPopup();
    renderUserList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1');
    renderUserList(users.entities, user => selectUser(user, '2'), 'userList2', 'searchInput2');
    setupSearchFilter('searchInput1');
    setupSearchFilter('searchInput2');
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();