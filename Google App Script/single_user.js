function setUpDropdownUsernames(all_usernames){
    // all usernames from mainFunction firebase_dashboard
    let ss = SpreadsheetApp.getActive().getSheetByName('Single user activities');
  
    let dropdownCell = ss.getRange('A9');  
    dropdownCell.setDataValidation(null); // removing last values before adding new
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(all_usernames).build();
    dropdownCell.setDataValidation(rule);
    dropdownCell.setValue(all_usernames[0]);
  }
  
  
  function analyzeSpecificUser(username, downloaded_userdata){
    let total_number_of_app_sessions = Object.keys(downloaded_userdata).length;
    let first_session = "";
    let last_session = "";
    let activities = {"id": [], "data": []};
      
    for (var session_key in downloaded_userdata){
      if (first_session === ""){
        first_session = session_key;
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
          if (!activities['id'].includes(activityId)){
            activities['id'].push(activityId);
            activities['data'].push(lastActivityData)
          }
        }
      }
    }
  
    last_session = session_key;
  
    return [username, total_number_of_app_sessions, first_session.slice(0, 10), last_session.slice(0, 10), activities];
  }
  
  
  function downloadSpecificUser(){
    const start = new Date().getTime();
  
    let ss = SpreadsheetApp.getActive().getSheetByName('Single user activities');
    let database = FirebaseApp.getDatabaseByUrl("https://tymewear-32549.firebaseio.com");
    let overview_startrow = 20;
    let activities_startrow = 25;
    let scriptlogCell = ss.getRange("A13");
    let activitiesHeaderCells = ss.getRange("A"+(activities_startrow-1)+":E"+(activities_startrow-1));
    let overviewCells = ss.getRange("A"+overview_startrow+":F"+overview_startrow);
  
    overviewCells.clearContent();
    let activitiesDataCells = ss.getRange("A"+activities_startrow+":E"+ss.getLastRow());
    activitiesDataCells.clearContent();
    activitiesDataCells.setBackground("white");
    scriptlogCell.setFontColor("black");
    activitiesHeaderCells.setValues([["Date/time", "Duration", "Activity-type", "Sport", "Completed"]]);
    activitiesHeaderCells.setBackground("#f3f3f3");
  
    Logger.log("Downloading from Firebase ...");
    scriptlogCell.setValue("Downloading from Firebase ...");
  
  
    let username = ss.getRange('A9').getValue();
    ss.getRange("A16").setValue("User: " + username);
  
    var analyzed_userdata = null;
    try {
        var downloaded_userdata = database.getData("/"+username);          
        analyzed_userdata = analyzeSpecificUser(username, downloaded_userdata);
      }
    catch(err) {
      let error_message = err.name + ": " + err.message;
      Logger.log(error_message);
      scriptlogCell.setValue(error_message);
      scriptlogCell.setFontColor("red");
      return;
    }
  
  
    let activities = analyzed_userdata.pop(0);
  
    var total_threshold_tests = 0;
    var total_workouts = 0;
  
    for (var i = 0; i<activities['id'].length; i++){
      var activities_range = ss.getRange("A"+(activities_startrow+i)+":E"+(activities_startrow+i));
  
      if (activities['data'][i]['activity-type'] === 0){ // assuming 'activity-type: 0' is workout
        total_workouts++;
      } else {
        total_threshold_tests++;
        activities_range.setBackground("#fff2e6");
      }
      
      activities_range.setValues([[activities['id'][i], activities['data'][i]['duration'], activities['data'][i]['activity-type'], 
                      activities['data'][i]['sport'], '']]);
      activities_range.setHorizontalAlignment("center");
    }
  
    overviewCells.setValues([[analyzed_userdata[0], analyzed_userdata[1],analyzed_userdata[2], analyzed_userdata[3],total_threshold_tests, total_workouts]]);
  
    // Sort by Date/time decending
    ss.getRange("A"+activities_startrow+":E"+ss.getLastRow()).sort({column: 1, ascending: false});
  
  
    const end = new Date().getTime();
    eval(UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js').getContentText());
    const diff = moment.duration(end-start);
    const download_duration = diff.minutes() + " minutes, " + diff.seconds() + " seconds, " + diff.milliseconds() + " milliseconds";
    scriptlogCell.setValue("Downloaded: " + new Date().toLocaleString() + "\nDownload duration: " + download_duration);
  }
  
  
  