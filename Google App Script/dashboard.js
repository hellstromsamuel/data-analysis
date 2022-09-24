/* 
  --- Code for spreadsheet 'Dashboard' ---
*/

function dashboardGetAnalyzedUserdata(username, id, downloaded_userdata){
    let total_number_of_app_sessions = Object.keys(downloaded_userdata).length;
  
    let first_session = "";
    let last_session = "";
    var first_workout = "";
    var last_workout = "";
    var first_test = "";
    var last_test = "";
  
    let activityIDs = [];
    let workouts = [];
    let threshold_tests = [];
      
    for (var session_key in downloaded_userdata){
      var session_date = (+session_key.slice(5,7)) + "/" + (+session_key.slice(8,10)) + "/" + session_key.slice(0,4); // '+' removes '0'
      if (first_session === ""){
        first_session = session_date;
      }
      
      for (var event_key in downloaded_userdata[session_key]){
        var event_name = event_key.slice(24);
  
        var d = downloaded_userdata[session_key][event_key];
  
        if (event_name === "finish activity file") {
          var j = JSON.parse(d);
          var activityId = j['date'] + "-" + j['start-time'];
  
          if (j['duration'].length <= 5){
            j['duration'] = '00:' + j['duration'];
          }
          var lastActivityData = {'date': j['date'], 'start-time': j['start-time'],
                              'end-time': j['end-time'], 'activity-type': j['activity-type'], 
                              'sport': j['sport'], 'duration': j['duration']};
          if (!activityIDs.includes(activityId)){
            activityIDs.push(activityId);
            activityIDs.push(lastActivityData);
            
            // setting first workout and first test
            if (lastActivityData['activity-type'] === 0){
              workouts.push(lastActivityData);
            }
            if (lastActivityData['activity-type'] !== 0){
              threshold_tests.push(lastActivityData);
            }
          }
        }
        
      }
    }
  
    last_session = session_date;
  
    if (workouts.length > 0){
      first_workout = workouts[0]['date'];
      last_workout = workouts[workouts.length-1]['date'];
    }
    if (threshold_tests.length > 0){
      first_test = threshold_tests[0]['date'];
      last_test = threshold_tests[threshold_tests.length-1]['date'];
    }
  
    return [id, username, total_number_of_app_sessions, threshold_tests.length, workouts.length, first_session, last_session, first_workout, last_workout, first_test, last_test];
  }
  
  
  function dashboardMainProgram(){
    const database = FirebaseApp.getDatabaseByUrl("https://tymewear-32549.firebaseio.com");
    const spreadsheet = global_variables.main_spreadsheet; // 'Dashboard spreadsheet'
    const header_text = "Dashboard";
    const range_script_log = spreadsheet.getRange("A10");
  
    let analyzed_userdata = [];
    let error_data = {};
    
    const start_row = 25; // fixed start row for writing data
    const range_data_headers = spreadsheet.getRange("A"+start_row+":K"+start_row);
    const data_header_values = ["", "Id/username", "Total number of app sessions", 
                                "Total number of threshold tests", "Total number of workouts", 
                                "First app session", "Last app session", "First workout", 
                                "Last workout", "First threshold test", "Last threshold test"];
    const usernames_not_downloaded = ["anonymus", "contact", "support", "master", "info", 
                                     "arnar", "arnarsteinn1", "alusti", "samuel-h",
                                     "juan", "lilykmuir"];
  
    // clear all previous data on spreadsheet
    globalClearSpreadsheet(spreadsheet);
  
    // Write spreadsheet header
    globalWriteSpeadsheetHeader(spreadsheet, header_text);
  
    // Write data headers
    globalWriteDataHeaders(range_data_headers, data_header_values)
  
    // Write usernames not included
    spreadsheet.getRange("A16").setValue("Not downloaded these usernames:");
    spreadsheet.getRange("D16").setValue(usernames_not_downloaded.join(", "));
  
    // Timer - tracking how long it takes to download all user data
    const start = new Date().getTime();
  
    Logger.log("Downloading from Firebase ...");
    range_script_log.setValue("Downloading from Firebase ...");
  
    let usernames = globalGetUsernamesFromFirebase(database);
    spreadsheet.getRange("D14").setValue(usernames.length);
  
    var id = 1;
    for (var i = 0; i < 10; i++){
      if (usernames_not_downloaded.includes(usernames[i])){
        continue;
      }
      try {
        var downloaded_userdata = database.getData("/"+usernames[i]);    
        analyzed_userdata.push(dashboardGetAnalyzedUserdata(usernames[i], id, downloaded_userdata));
        id++;
      }
      catch(err) {
        error_data[usernames[i]] = (err.name + ": " + err.message);
        Logger.log(err.name + ": " + err.message);
      }
    }
  
    spreadsheet.getRange("A15").setValue("Total number of users downloaded:");
    spreadsheet.getRange("D15").setValue(analyzed_userdata.length);
    const usernames_error = Object.keys(error_data);
    spreadsheet.getRange("D17").setValue(usernames_error.join(", "));
  
    let dataCells = spreadsheet.getRange("A"+(start_row+1)+":K"+(start_row+analyzed_userdata.length));
    dataCells.setValues(analyzed_userdata);
    dataCells.setFontColor("black");
  
    spreadsheet.getRange("A"+(start_row+1)+":B"+(start_row+analyzed_userdata.length)).setHorizontalAlignment("center");
  
    const end = new Date().getTime();
    eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js').getContentText());
    const diff = moment.duration(end-start);
    const download_duration = diff.minutes() + " minutes, " + diff.seconds() + " seconds";
    Logger.log("Download complete - " + download_duration);
    range_script_log.setValue("Download complete - " + download_duration);
  
    let dropdownCell = spreadsheet.getRange('A22'); 
    var partRule = SpreadsheetApp.newDataValidation().requireValueInList(data_header_values).build();
    dropdownCell.setDataValidation(partRule);
    dropdownCell.setValue("Id/username");
  
    spreadsheet.getRange("A23").setValue("Last column:");
    spreadsheet.getRange("B23").setValue(2);
    spreadsheet.getRange("B"+(start_row)+":B"+(start_row+analyzed_userdata.length)).setFontColor("red");
  
    // writing when it was last updated
    globalWriteUpdatedTextFromDashboard("Updated: " + new Date().toLocaleString());
  
    // writing all usernames to "Single user" tab
    setUpDropdownUsernames(usernames); 
  
    // error data to the 'Download errors from Firebase' spreadsheet
    downloadErrorsWriteData(error_data); 
  }
  
  
  
  
  