function fetchEntityFields() {
    // You can add your closeIframe() function code here, if applicable

    // Add custom styles
    var customStyleElement = document.createElement('style');
    customStyleElement.type = 'text/css';
    customStyleElement.innerHTML = `
        .customPopup { background-color: #f9f9f9; border: 3px solid #444 !important; border-radius: 20px !important; width: 800px; height: 100%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }
        .customSection { padding: 20px; border-right: 0px solid #ccc; overflow-y: scroll; }   
        .customUserSection { text-align: center; height: 500px; width: 100%;}    
        .customPopupRow { display: flex; }
        .customPopupHeader { text-align: center; padding: 10px; background-color: #444; color: #fff; font-size: 18px; border-bottom: 2px solid #333; border-radius: 20px 20px 0 0; }
        .customTooltip { position: absolute; top: 15px; right: 15px; cursor: pointer; background-color: #fff; border: 1px solid #444; border-radius: 50%; width: 20px; height: 20px; text-align: center; font-size: 14px; line-height: 20px; }
        .customTooltiptext { visibility: visible; width: 120px; background-color: black; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1; right: 100%; top: 50%; margin-top: -15px; opacity: 0; transition: opacity 0.3s; }
    `;
    document.head.appendChild(customStyleElement);

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
                        return '<div>' + (index + 1) + '. <strong>' + displayName + '</strong><div style="margin-left: 20px;"><div>Name: ' + field.LogicalName + '</div><div>Type: ' + field.AttributeType + '</div></div></div>';
                    })
                    .join('');

                var html = '<h2 style="text-align: left;">Entity: ' + entityName + '</h2><h2 style="text-align: left;">Record ID: ' + cleanRecordId + '</h2><h2 style="text-align: left;">Fields:</h2><br><div style="padding: 5px; columns: 2; -webkit-columns: 2; -moz-columns: 2;">' + fieldList + '</div>';

                // Create new container
                var newContainer = document.createElement('div');
                newContainer.id = 'bookmarkletPopup';
                newContainer.className = 'customPopup';
                newContainer.innerHTML = `<div class="customPopupHeader">Copy User Security</div><div id="customTooltip" class="customTooltip">i<span class="customTooltiptext" id="customTooltiptext">This tool allows you to copy Business Unit, Teams, and Security Roles from one user to another.</span></div><div class="customPopupRow"><div class="customSection customUserSection" id="section1">${html}</div></div>`;
                document.body.appendChild(newContainer);
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
