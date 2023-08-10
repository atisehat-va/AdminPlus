/*
function fetchEntityFields() {	
	closeIframe();
	var entityName = Xrm.Page.data.entity.getEntityName();
	var entityId = Xrm.Page.data.entity.getId();
	var url = Xrm.Page.context.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + entityName + "')/Attributes?$select=LogicalName,AttributeType";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			if (this.status === 200) {
				var results = JSON.parse(this.responseText);
				var fieldList = results.value
					.filter(function(field) {
						return field.AttributeType !== 'Virtual';
					})
					.map(function(field, index) {
						return '<div>' + (index + 1) + '. ' + field.LogicalName + ' (' + field.AttributeType + ')<div>';
					})
					.join('');
				        var html = '<h2 style="text-align: left;">Entity: ' + entityName + '</h2><h2 style="text-align: left;">Record ID: ' + entityId + '</h2><h2 style="text-align: left;">Fields:</h2><br><div style="columns: 2; -webkit-columns: 2; -moz-columns: 2;">' + fieldList + '</div>';				
				showContent('html', html);
			} else {
				alert("Error: " + this.statusText);
			}
		}
	};
	xhr.send();
}*/
function fetchEntityFields() {
    closeIframe();
    var entityName = Xrm.Page.data.entity.getEntityName();
    var entityId = Xrm.Page.data.entity.getId();
    var url = Xrm.Page.context.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + entityName + "')/Attributes?$select=LogicalName,AttributeType,DisplayName";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                var results = JSON.parse(this.responseText);
                var fieldList = results.value
                    .filter(function(field) {
                        return field.AttributeType !== 'Virtual';
                    })
                    .map(function(field, index) {
                        var displayName = field.DisplayName && field.DisplayName.UserLocalizedLabel ? field.DisplayName.UserLocalizedLabel.Label : 'N/A';
                        return '<div>' + (index + 1) + '. ' + displayName +
                               '<ul><li>Name: ' + field.LogicalName + '</li>' +
                               '<li>Type: ' + field.AttributeType + '</li></ul></div>';
                    })
                    .join('');
                var html = '<h2 style="text-align: left;">Entity: ' + entityName + '</h2><h2 style="text-align: left;">Record ID: ' + entityId + '</h2><h2 style="text-align: center;">Fields:</h2><br><div style="columns: 2; -webkit-columns: 2; -moz-columns: 2;">' + fieldList + '</div>';
                showContent('html', html);
            } else {
                alert("Error: " + this.statusText);
            }
        }
    };
    xhr.send();
}

function renameHeaderFields() {
    closeIframe();
    var headerControls = Xrm.Page.ui.controls.get(function (control, index) {
        var controlType = control.getControlType();
        return controlType === "standard" || controlType === "optionset" || controlType === "lookup";
    });
    headerControls.forEach(renameControlAndUpdateOptionSet);   
}

function renameTabsSectionsFields() {
    var currentFormId = Xrm.Page.ui.formSelector.getCurrentItem().getId();
    if (lastUpdatedFormId === currentFormId && logicalNameBtnClickStatus) {        
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
    
    renameHeaderFields();
    
    logicalNameBtnClickStatus = true; 
    lastUpdatedFormId = currentFormId;
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
       if(option.text !== "") {
           control.removeOption(option.value);
           control.addOption({
              value: option.value,
              text: option.value.toString() + " (" + option.text + ")"
           }, option.value); 
        }
	});   
}
