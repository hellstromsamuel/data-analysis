from datetime import datetime
from datetime import timedelta

import pyrebase
import gspread


def getSessionsData(data):
    first_session = ""
    last_session = ""
    active_days = {}
    session_lengths = []

    workout_data = {'workouts': []}
    threshold_tests = {'tests': []}
    
    current_day = first_session
    for i in data: # i -> keys on the dict
        #print(i)
        if (first_session == ""): 
            first_session = i
        current_day = i.split(" ")[0]
        if (current_day in active_days):
            active_days[current_day] += 1
        else:
            active_days[current_day] = 1
        
        first_event = None
        last_event = None

        
        last_workout_start = None

        last_test_start = None

        for event in data[i]:
            if (first_event == None): 
                first_event = event[11:19]

            event_name = event[24:]

            if ((event_name == "BUTTON-CLICK") and 
                (data[i][event].strip().upper() == "START RECORDING")):
                last_workout_start = event

            if ((event_name == "BUTTON-CLICK") and 
                (data[i][event].strip().upper() == "FULL STOP") and
                (last_workout_start != None)):
    
                #2022-01-20-06-03:58
                start = datetime(int(last_workout_start[0:4]), int(last_workout_start[5:7]), int(last_workout_start[8:10]),
                                    int(last_workout_start[11:13]), int(last_workout_start[14:16]), int(last_workout_start[17:19]))
                stop = datetime(int(event[0:4]), int(event[5:7]), int(event[8:10]),
                                    int(event[11:13]), int(event[14:16]), int(event[17:19]))
                workout_duration = stop-start # have 'str()' around the variable to get the printed version

                workout_data['workouts'].append({'start': start, "stop": stop, 
                                                "duration": workout_duration}) # add a completed workout
                last_workout_start = None # resetting workout tracked duration a session

            # -----
            
            if ((event_name == "WRITE") and 
                (data[i][event] == " => StartDataMonitor")):
                last_test_start = event

            if ((event_name == "BTN:") and 
                ((data[i][event].strip().upper() == "REST") or (data[i][event].strip().upper() == "FINISH RAMP")) and
                (last_test_start != None)):
    
                #2022-01-20-06-03:58
                start = datetime(int(last_test_start[0:4]), int(last_test_start[5:7]), int(last_test_start[8:10]),
                                    int(last_test_start[11:13]), int(last_test_start[14:16]), int(last_test_start[17:19]))
                stop = datetime(int(event[0:4]), int(event[5:7]), int(event[8:10]),
                                    int(event[11:13]), int(event[14:16]), int(event[17:19]))
                test_duration = stop-start # have 'str()' around the variable to get the printed version

                threshold_tests['tests'].append({'start': start, "stop": stop, 
                                                "duration": test_duration}) # add a completed workout
                last_test_start = None # resetting workout tracked duration a session


        last_event = event[11:19]

        time_1 = datetime.strptime(first_event[0:2]+':'+first_event[3:5]+':'+first_event[6:8],"%H:%M:%S")
        time_2 = datetime.strptime(last_event[0:2]+':'+last_event[3:5]+':'+last_event[6:8],"%H:%M:%S")

        session_length = time_2 - time_1
        session_lengths.append(session_length.seconds)
    
    
    last_session = i
    

    return first_session, last_session, active_days, session_lengths, workout_data, threshold_tests


def getAvgSessionLength(session_lengths):
    return timedelta(seconds=(sum(session_lengths)/len(session_lengths)))

def getDayIntervals(active_days):
    day_intervals = []
    prev_day = None
    #printmd("**Activities (no. of sessions):**")
    for day in active_days:
        #print(day+": " + str(active_days[day]))
        if (day != prev_day and prev_day != None):
            before_array = prev_day.split("-")
            before = datetime(int(before_array[0]), int(before_array[1]), int(before_array[2][:2]))
            after_array = day.split("-")     
            after = datetime(int(after_array[0]), int(after_array[1]), int(after_array[2][:2]))
            day_intervals.append((after-before).days)
        prev_day = day
    return day_intervals

def getAvgSessionsActiveDay(active_days):
    return sum(active_days.values())/len(active_days)




# --------------------
# Download a specific user data from Realtime Database, and set up a summary profile based on the data
# Needs ref to Realtime database (db)

def downloadAndAnalyzeUserData(db, nr, username):
    data = db.child(username).get().val() # Get all user data from Firebase

    first_session, last_session, active_days, session_lengths, workout_data, threshold_tests = getSessionsData(data)
    
    last_session_array = last_session.split("-")
    then = datetime(int(last_session_array[0]), int(last_session_array[1]), int(last_session_array[2][:2]))         
    now  = datetime.now()                         
    time_since_last_session = now - then                         # Build-in datetime function
    time_since_last_session = str(time_since_last_session)[:-21].strip()
    if (time_since_last_session == ''):
        time_since_last_session = 0

    
    avg_session_length = str(getAvgSessionLength(session_lengths))
    if (len(avg_session_length) > 7):
        avg_session_length = avg_session_length[:7]

    day_intervals = getDayIntervals(active_days)
    avg_day_interval = 0
    if (len(day_intervals) > 0):
        avg_day_interval = round((sum(day_intervals)/len(day_intervals)), 1)

    first_session_array = first_session.split("-")
    last_session_array = last_session.split("-")
    first_day = datetime(int(first_session_array[0]), int(first_session_array[1]), int(first_session_array[2][:2]))         
    last_day = datetime(int(last_session_array[0]), int(last_session_array[1]), int(last_session_array[2][:2]))         
    time_span = last_day - first_day
    time_span = str(time_span)[:-13].strip()
    if (time_span == ''):
        time_span = 0


    workouts = workout_data['workouts']

    first_workout = ''
    last_workout = ''
    avg_workout_length = ''
    total_workout_duration = ''
    workouts_time_span = 0
    time_since_last_workout = 0
    avg_workout_day_interval = 0

    if (len(workouts) > 0):
        first_workout = workouts[0]['start']
        last_workout = workouts[-1]['start']

        workouts_time_span = str(last_workout-first_workout)[:-14].strip()
        if (workouts_time_span == ''):
            workouts_time_span = 0

        time_since_last_workout = now-last_workout
        time_since_last_workout = str(time_since_last_workout)[:-21].strip()

        active_workout_days = {}
        for workout in workout_data['workouts']:
            if (total_workout_duration == ''):
                total_workout_duration = workout['duration']
            else:
                total_workout_duration += workout['duration']
            
            date = str(workout['start'])[:10]
            if (date in active_workout_days):
                active_workout_days[date] += 1
            else:
                active_workout_days[date] = 1
        

        avg_workout_length = str(total_workout_duration/len(workouts))
        if (len(avg_workout_length) > 7):
            avg_workout_length = avg_workout_length[:7]

        workout_day_intervals = getDayIntervals(active_workout_days)
        if (len(workout_day_intervals) > 0):
            avg_workout_day_interval = round((sum(workout_day_intervals)/len(workout_day_intervals)), 1)



    tests = threshold_tests['tests']

    first_test = ''
    last_test = ''
    tests_time_span = 0
    time_since_last_test = ''

    if (len(tests) > 0):
        first_test = tests[0]['start']
        last_test = tests[-1]['start']

        tests_time_span = str(last_test-first_test)[:-14].strip()
        if (tests_time_span == ''):
            tests_time_span = 0

        time_since_last_test = now-last_test
        time_since_last_test = float(str(time_since_last_test)[:-21].strip())



    user_data = {"nr": nr, "username": username, "total_sessions": len(session_lengths), "avg_session_length": avg_session_length, 
                            "avg_sessions_active_day": round(float(getAvgSessionsActiveDay(active_days)), 1), 
                            "first_session": first_session[:-8], "last_session": last_session[:-8], 
                            "time_span": float(time_span),
                            "time_since_last_session": float(time_since_last_session),  "avg_day_interval": float(avg_day_interval), 
                            'first_workout': str(first_workout).strip(), 'last_workout': str(last_workout).strip(),
                            'time_since_last_workout': time_since_last_workout, 
                            'workouts_time_span': float(workouts_time_span),
                            'total_number_of_workouts': len(workouts), "avg_workout_day_interval": avg_workout_day_interval,
                            'avg_workout_length': avg_workout_length, 'total_workout_duration': str(total_workout_duration),
                            'first_test': str(first_test).strip(), 'last_test': str(last_test).strip(), 'tests_time_span': float(tests_time_span),
                            'time_since_last_test': time_since_last_test, 'total_number_of_tests': len(tests)}

    return user_data




# --------------------
# Set up Firebase and Google Sheets connections

def setUpFirebaseAndGoogleSheetsConnection():
    # -> Firebase
    config = {
        """
        *****
        REMOVED FIREBASE CONFIG DETAILS (SEE NOTION)
        *****
        """
    }

    firebase = pyrebase.initialize_app(config)
    db = firebase.database()

    # -> Google Sheets
    gc = gspread.service_account(filename='/Users/samuelrjh/Tymewear/Python/service_account.json')
    sh = gc.open("Tyme Wear - Firebase Realtime Database")

    return db, sh # return ref to Realtime Database (db) and ref to the Google Spreadsheet (sh)


def getFirebaseUsernames(db):
    print("Collecting usernames from database ...")
    firebase_usernames = list(db.shallow().get().val())
    firebase_usernames.sort()
    print("Collecting complete\n")
    return firebase_usernames




# --------------------
# Sheet 1 - All users
def writeDataToSheet1(total_usernames, sh, all_user_data):
    wks1 = sh.get_worksheet(0)

    wks1.format("A23:I23", {"textFormat": {"bold":True}})
    wks1.update("A23:I23", [["Id", "Username", "Total sessions in the app", 
                            "Total workouts", "Total threshold tests",
                            "First session", "Last session", "Sessions time span (days)",
                            "Time since last session (days)"]])

    data_sheet1 = []

    users_included = 0
    for username in all_user_data:
        if (username == "anonymus" or username == "contact" or username == "support" 
            or username == "master" or username == "info" or username == "arnar"
            or username == "arnarsteinn1" or username == "alusti" or username == "samuel-h"
            or username == "juan" or username == "lilykmuir"):
            continue

        users_included += 1
        user_data = all_user_data[username]

        user_array = [users_included, username, user_data['total_sessions'], 
                    user_data['total_number_of_workouts'], user_data['total_number_of_tests'],
                    user_data['first_session'][:10], user_data['last_session'][:10], user_data['time_span'],
                    user_data['time_since_last_session']]
        data_sheet1.append(user_array)

        
    startrow = 24

    wks1.update("B3", "Total users in the database:")
    wks1.update("B3", total_usernames) 

    wks1.update("B5", "Total users included:")
    wks1.update("B5", len(data_sheet1))

    wks1.update("A"+str(startrow)+":I"+str(startrow+len(data_sheet1)), data_sheet1)


# --------------------
# Sheet 2 - Workout data
def writeDataToSheet2(sh, all_user_data):
    wks2 = sh.get_worksheet(1)

    wks2.format("A27:P27", {"textFormat": {"bold":True}})
    wks2.update("A27:P27", [["Id", "Username", "Total sessions in the app", "Total workouts:",
                            "Avg. workout duration:", "Total workout duration:",
                            "Avg. days between workouts", "Avg. days between sessions", 
                            "Workouts time span (days):", "Sessions time span (days)", 
                            "First session", "First workout:", "Last workout:", "Last session", 
                            "Time since last workout (days):", "Time since last session (days)"]])

    data_sheet2 = []

    users_included = 0

    for username in all_user_data:
        user_data = all_user_data[username]

        # Remove unrelevant users
        if (user_data['first_workout'] == '' or  # user_data['time_span'] == '' or 
            username == "anonymus" or username == "contact" or username == "support" 
            or username == "master" or username == "info" or username == "arnar"
            or username == "arnarsteinn1" or username == "alusti" or username == "samuel-h"
            or username == "juan" or username == "lilykmuir"):
            continue
        
        check_workout_day_interval = user_data['avg_workout_day_interval']
        check_total_duration_hours = int(user_data['total_workout_duration'][-8:-6])
        check_total_duration_minutes = int(user_data['total_workout_duration'][-5:-3])

        # Remove if 'workout_day_interval' < 1, 'total_workout_duration-hours' < 1' and 'total_workout_duration-minutes' < 5
        if (check_workout_day_interval < 1) and (check_total_duration_hours < 1) and (check_total_duration_minutes < 5):
            continue

        users_included += 1

        user_array = [users_included, username, user_data['total_sessions'], user_data['total_number_of_workouts'],
                    user_data['avg_workout_length'], user_data['total_workout_duration'],
                    user_data['avg_workout_day_interval'], user_data['avg_day_interval'], 
                    user_data['workouts_time_span'], user_data['time_span'], 
                    user_data['first_session'][:10], user_data['first_workout'][:10], 
                    user_data['last_workout'][:10], user_data['last_session'][:10], 
                    user_data['time_since_last_workout'], user_data['time_since_last_session']]

        data_sheet2.append(user_array)

    startrow = 28

    wks2.update("A6", "Active users with workout data:")
    wks2.update("B6", users_included)

    wks2.update("A"+str(startrow)+":P"+str(startrow+users_included), data_sheet2)


# --------------------
# Sheet 3 - No workouts/tests
def writeDataToSheet3(sh, all_user_data):
    wks3 = sh.get_worksheet(2)

    wks3.format("A8:J8", {"textFormat": {"bold":True}})
    wks3.update("A8:J8", [["Username", "Total sessions in the app", 
                            "Avg. session length", "Avg. sessions on an active day",
                            "Avg. days between sessions",
                            "First session", "Last session", "Sessions time span (days)",
                            "Time since last session (days)"]])

    data_sheet3 = []

    users_included = 0
    for username in all_user_data:
        user_data = all_user_data[username]

        if (user_data['total_number_of_workouts'] > 0 or user_data['total_number_of_tests'] > 0 
            or username == "anonymus" or username == "contact" or username == "support" 
            or username == "master" or username == "info" or username == "arnar"
            or username == "arnarsteinn1" or username == "alusti" or username == "samuel-h"
            or username == "juan" or username == "lilykmuir"):
            continue

        user_array = [username, user_data['total_sessions'], 
                    user_data['avg_session_length'], user_data['avg_sessions_active_day'],
                    user_data['avg_day_interval'],
                    user_data['first_session'][:10], user_data['last_session'][:10], user_data['time_span'],
                    user_data['time_since_last_session']]

        data_sheet3.append(user_array)

        users_included += 1
        

    startrow = 9

    wks3.update("A5", "Active users (workout data):")
    wks3.update("B5", users_included)

    wks3.update("A"+str(startrow)+":J"+str(startrow+users_included), data_sheet3)


# --------------------
# Sheet 4 - Threshold tests
def writeDataToSheet4(sh, all_user_data):
    wks4 = sh.get_worksheet(3)

    wks4.format("A8:F8", {"textFormat": {"bold":True}})
    wks4.update("A8:F8", [["Username", 
                            "First test", "Last test", "Tests time span (days)",
                            "Time since last test (days)", "Total threshold tests"]])

    data_sheet4 = []

    users_included = 0
    for username in all_user_data:
        user_data = all_user_data[username]

        if (#user_data['first_test'] == '' 
            username == "anonymus" or username == "contact" or username == "support" 
            or username == "master" or username == "info" or username == "arnar"
            or username == "arnarsteinn1" or username == "alusti" or username == "samuel-h"
            or username == "juan" or username == "lilykmuir"):
            continue

        user_array = [username, user_data['first_test'][:10], user_data['last_test'][:10], 
                    user_data['tests_time_span'], user_data['time_since_last_test'], user_data['total_number_of_tests']]

        data_sheet4.append(user_array)

        users_included += 1


    startrow = 9

    wks4.update("A5", "Number of users included:")
    wks4.update("B5", users_included)

    wks4.update("A"+str(startrow)+":F"+str(startrow+users_included), data_sheet4)





# -------------------
# Main program

def percentage(part, whole):
    percentage = 100 * float(part)/float(whole)
    return str(round(percentage, 2)) + "%"


def downloadDataFromAllUsers(usernames, db):
    data = {}
    error_usernames = []
    exceptions = []

    print("Downloading and analyzing user data ...")

    print("-> Progress: " + percentage(0, len(usernames)), end='\r')

    i = 1

    for username in usernames:
        try:
            data[username.strip()] = downloadAndAnalyzeUserData(db, i, username.strip())
            print("-> Progress: " + percentage(i, len(usernames)) + (" - " + str(i) + "/" + str(len(usernames)) + " users"), end='\r')
            i += 1
        except Exception as e:
            error_usernames.append(username)
            exceptions.append(str(e))
    
    print("-> Progress: " + percentage(i, len(usernames)))
    print("Download complete\n")

    print("\nDOWNLOADING ERRORS (most likely too large user-files)")
    print("-> Users: " + ', '.join(error_usernames) + "\n")
    print("-> Exceptions: " + ', '.join(exceptions) + "\n")

    return data


def writeDataToAllSpreadSheets(total_usernames, sh, all_user_data):
    print("Writing data to Google Sheets ...")
    writeDataToSheet1(total_usernames, sh, all_user_data)
    writeDataToSheet2(sh, all_user_data)
    writeDataToSheet3(sh, all_user_data)
    writeDataToSheet4(sh, all_user_data)
    print("Writing complete")
    

def testScriptOneUser():
    db, sh = setUpFirebaseAndGoogleSheetsConnection() # Ref to Realtime Database and Google Spreadsheet
    # Download data from a specific user
    userdata = downloadAndAnalyzeUserData(db, 1, "christine")
    print(userdata)

    
    
# --------------------
# Main function - downloads all user data and writes to Google Sheet

def runScript():
    db, sh = setUpFirebaseAndGoogleSheetsConnection() # Ref to Realtime Database and Google Spreadsheet
    usernames = getFirebaseUsernames(db)
    all_user_data = downloadDataFromAllUsers(usernames, db) # Saves all analyzed data in this variable

    # check if user is downloaded
    #print(all_user_data["arnar"])

    writeDataToAllSpreadSheets(len(usernames), sh, all_user_data)


#testScriptOneUser()
runScript()