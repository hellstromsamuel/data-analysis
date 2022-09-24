function getRange(){
    let ss = SpreadsheetApp.getActive().getSheetByName('Dashboard');
    let start_row = 25; // fixed start row
    let rows_length = ss.getRange("D15").getValue(); // number of users downloaded
  
    let range = ss.getRange("A"+(start_row+1)+":K"+(start_row+rows_length));
    return range;
  }
  
  function colorLastColumn(ss){
    let lastColum = ss.getRange("B23").getValue();
    let start_row = 25;
    let rows_length = ss.getRange("D15").getValue();
    
    // black for last column
    let lastColumnRange = ss.getRange(start_row, lastColum, (rows_length+1), 1);
    lastColumnRange.setFontColor("black");
  }
  
  function setSortText(text, columnNr){
    let ss = SpreadsheetApp.getActive().getSheetByName('Dashboard');
    let start_row = 25;
    let rows_length = ss.getRange("D15").getValue();
  
    // red for new column
    let columnRange = ss.getRange(start_row, columnNr, (rows_length+1), 1);
    columnRange.setFontColor("red");
  
    ss.getRange("A22").setValue(text);
  
    ss.getRange("B23").setValue(columnNr);
  }
  
  function sortData(){
    let ss = SpreadsheetApp.getActive().getSheetByName('Dashboard');
    colorLastColumn(ss);
  
    switch (ss.getRange("A22").getValue()){
      case "Id/username":
        sortByUsername();
        break;
      case "Total number of app sessions":
        sortByAppSessions();
        break;
      case "Total number of threshold tests":
        sortByTests();
        break;
      case "Total number of workouts":
        sortByWorkouts();
        break;
      case "First app session":
        sortByFirstSession();
        break;
      case "Last app session":
        sortByLastSession();
        break
      case "First workout":
        sortByFirstWorkout();
        break;
      case "Last workout":
        sortByLastWorkout();
        break;
      case "First threshold test":
        sortByFirstTest();
        break;
      case "Last threshold test":
        sortByLastTest();
    }
  }
  
  // ----------
  
  
  function sortByUsername(){
    getRange().sort(2);
    setSortText("Id/username", 2);
  }
  
  function sortByAppSessions(){
    getRange().sort({column: 3, ascending: false});
    setSortText("Total number of app sessions", 3);
  }
  
  function sortByTests(){
    getRange().sort({column: 4, ascending: false});
    setSortText("Total number of threshold tests", 4);
  }
  
  function sortByWorkouts(){
    getRange().sort({column: 5, ascending: false});
    setSortText("Total number of workouts", 5);
  }
  
  function sortByFirstSession(){
    getRange().sort({column: 6, ascending: false});
    setSortText("First session", 6);
  }
  
  function sortByLastSession(){
    getRange().sort({column: 7, ascending: false});
    setSortText("Last session", 7);
  }
  
  function sortByFirstWorkout(){
    getRange().sort({column: 8, ascending: false});
    setSortText("First workout", 8);
  }
  
  function sortByLastWorkout(){
    getRange().sort({column: 9, ascending: false});
    setSortText("Last workout", 9);
  }
  
  function sortByFirstTest(){
    getRange().sort({column: 10, ascending: false});
    setSortText("First threshold test", 10);
  }
  
  function sortByLastTest(){
    getRange().sort({column: 11, ascending: false});
    setSortText("First threshold test", 11);
  }
  
  
  