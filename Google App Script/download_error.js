/* 
  --- Code for spreadsheet 'Downlaod errors from Firebase' ---
*/

function downloadErrorsWriteData(error_users){
    const spreadsheet = SpreadsheetApp.getActive().getSheetByName('Download errors from Firebase');
    const grey_colorcode = global_variables.grey_colorcode;
    const header_text = "Download errors from firebase";
  
    const usernames = Object.keys(error_users);
    const usernames_errors = Object.values(error_users);
    const number_of_users = Object.keys(error_users).length;
    
    const data_startrow = 7;
    const range_data_headers = spreadsheet.getRange("A"+(data_startrow-1)+":B"+(data_startrow-1));
    const data_header_values = ["Username", "Error message"];
    const range_usernames = spreadsheet.getRange("A"+data_startrow+":A"+(data_startrow+number_of_users-1));
    const range_username_errors = spreadsheet.getRange("B"+data_startrow+":B"+(data_startrow+number_of_users-1));
    
    // clear all previous data on spreadsheet
    globalClearSpreadsheet(spreadsheet);
    
    // Write spreadsheet header and add updated text (from 'Dashboard' tab)
    globalWriteSpeadsheetHeader(spreadsheet, header_text);
    globalWriteUpdatedTextFromDashboard(spreadsheet);
  
    // Writing data headers
    globalWriteDataHeaders(range_data_headers, data_header_values);
  
    // Writing userneams
    range_usernames.setValues([usernames]);
  
    // Writing error messages
    range_username_errors.setValues([usernames_errors]);
    range_username_errors.setWrap(true);
  }
  