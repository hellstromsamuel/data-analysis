/* 
  --- Global functions that are reused in all spreadsheets' ---
*/

// Global variables that can be re-used in all script files (.gs)
let global_variables = {
    main_spreadsheet: SpreadsheetApp.getActive().getSheetByName("Dashboard"),
    grey_colorcode: "#f3f3f3"
  };
  
  // Clear all cells in a spreadsheet
  function globalClearSpreadsheet(spreadsheet){
      const range_all_cells = spreadsheet.getDataRange();
      range_all_cells.clearContent();
      range_all_cells.setBackground("white");
      range_all_cells.setFontColor("black");
      range_all_cells.setFontWeight(0);
      range_all_cells.setFontSize(10);
  }
  
  function globalWriteSpeadsheetHeader(spreadsheet, header_text){
    const headerRange = spreadsheet.getRange("A1");
    headerRange.setValue(header_text);
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(16);
  }
  
  function globalWriteUpdatedTextFromDashboard(spreadsheet){
      const range_updated_text = spreadsheet.getRange("A3");
      range_updated_text.setValue(global_variables.main_spreadsheet.
                                        getRange("A3").getValue());
      range_updated_text.setFontColor("red");
      range_updated_text.setFontWeight("bold");
  
      spreadsheet.getRange("A4").setValue(global_variables.main_spreadsheet.
                                        getRange("A4").getValue());
  }
  
  function globalGetUsernamesFromFirebase(database) {
      // Getting all *usernames* from Firebase. "shallow" ignores the values -> avoiding to large file
      let usernames_firebase_response = database.getData("", {"shallow": true});
      
      let usernames = [];
      for (var username in usernames_firebase_response){
        usernames.push(username);
      }
      usernames.sort();
      return usernames
  }
  
  function globalWriteDataHeaders(range_data_headers, data_header_values){
      range_data_headers.setValues([data_header_values]);
      range_data_headers.setBackground(global_variables.grey_colorcode);
      range_data_headers.setFontWeight("bold");
    }
  