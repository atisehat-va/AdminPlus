function fetchEntityFields() {
    closeIframe();
    var entityName = Xrm.Page.data.entity.getEntityName();
    var recordId = Xrm.Page.data.entity.getId();
    var cleanRecordId = recordId.replace(/[{}]/g, "");
    var url = Xrm.Page.context.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + entityName + "')/Attributes?$select=LogicalName,AttributeType,DisplayName";
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                var results = JSON.parse(this.responseText);
                var fieldList = results.value
                    .filter(function(field) {
                        return field.AttributeType !== 'Virtual' && field.DisplayName && field.DisplayName.UserLocalizedLabel && field.DisplayName.UserLocalizedLabel.Label;
                    })
                    .map(function(field, index) {
                        var displayName = field.DisplayName.UserLocalizedLabel.Label;
                        return '<div>' + (index + 1) + '. <strong>' + displayName + '</strong>' +
                               '<div style="margin-left: 20px;"><div>Name: ' + field.LogicalName + '</div>' +
                               '<div>Type: ' + field.AttributeType + '</div></div></div>';
                    })
                    .join('');
                
                var html = '<h2 style="text-align: left;">Entity: ' + entityName + '</h2><h2 style="text-align: left;">Record ID: ' + cleanRecordId + '</h2><h2 style="text-align: left;">Fields:</h2><br><div style="padding: 5px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">' + fieldList + '</div>';

                var bookmarkletPopup = document.getElementById('bookmarkletPopup');
                const popupCss = `
                    .popup { background-color: #f9f9f9; border: 3px solid #444; border-radius: 20px; width: 800px; height: 100%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
                    .section { padding: 20px; border-right: 0px solid #ccc; overflow-y: scroll; }   
                    .user-section { height: 500px; width: 100%;}    
                    .popup-row { display: flex; }        
                `;

                if (bookmarkletPopup) {
                    bookmarkletPopup.innerHTML = `<style>${popupCss}</style><div class="popup-row"><div class="section user-section">${html}</div></div>`;
                } else {
                    var newContainer = document.createElement('div');
                    newContainer.id = 'bookmarkletPopup';
                    newContainer.className = 'popup';
                    newContainer.innerHTML = `<style>${popupCss}</style><div class="popup-row"><div class="section user-section" id="section1">${html}</div></div>`;
                    document.body.appendChild(newContainer);
                }

            } else {
                alert("Error: " + this.statusText);
            }
        }
    };
    xhr.send();
}

function renameTabsSectionsFields() { 
	var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
	if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {
	   showContent('alert', 'Show Logical Names button has already been clicked!!');
	   return;
	}
	Xrm.Page.ui.tabs.forEach(function(tab) {
		var logicalName = tab.getName();
		tab.setLabel(logicalName);
		tab.sections.forEach(function(section) {
			var logicalName = section.getName();
			section.setLabel(logicalName);
			section.controls.forEach(renameControlAndUpdateOptionSet);
		});
	});
    logicalNameBtnClickStatus = true; 
    lastUpdatedFormId = currentFormId;
    renameHeaderFields();   
}

function renameHeaderFields() {
    closeIframe();
    var headerControls = Xrm.Page.ui.controls.get(function (control, index) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(renameControlAndUpdateOptionSet);   
}


function renameControlAndUpdateOptionSet(control) {
	var attribute = control.getAttribute();
	if (attribute !== null) {
		var logicalName = attribute.getName();
		control.setLabel(logicalName);
		if (control.getControlType() === "optionset") {
			updateOptionSetValues(control);            
		}
	}
}

function updateOptionSetValues(control) {	
	var optionSetOptions = control.getOptions();
	optionSetOptions.forEach(function(option) {
		if (option.text !== "") {			
			var originalText = option.text.split("(").pop().split(")")[0];			
			var newText = option.value.toString() + " (" + originalText + ")";						
			control.removeOption(option.value);
			control.addOption({
				value: option.value,
				text: newText
			}, option.value);
		}
	});    
}
