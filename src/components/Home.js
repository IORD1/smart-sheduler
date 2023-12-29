import { useEffect ,useState} from "react";
import './Home.css';
import Logo from "./Logo";
import {ReactComponent as ArrowRight} from './assests/arrow_forward_FILL0_wght400_GRAD0_opsz24.svg';
import TodayDate from "./TodayDate";
const { GoogleGenerativeAI } = require("@google/generative-ai");

function Home() {
  const [eventData, setevetData] = useState();
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' or 'tasks'
  const [todos, setTodos] = useState([]);
  const backgroundColors = ["#ec3a5a", "#fb8231", "#fdf9a0","#20bf6b","#349cdb","#3e6dd7","#8c59d0"];
  const fontColors = ["#ffffff","#ffffff","#0e0e0e","#ffffff","#ffffff","#ffffff","#ffffff",]
    const gapi = window.gapi;
  const google = window.google;

  const CLIENT_ID = "527900086936-rkb3si94935g83g2vmtjmoi83lmcpb1h.apps.googleusercontent.com";
  const API_KEY = "AIzaSyA-6Om9C4ynVH8PhB_H7y8Pz5nbZYX80f4";
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = "https://www.googleapis.com/auth/calendar";

  const accessToken = localStorage.getItem('access_token');
  const expiresIn = localStorage.getItem('expires_in');
  const genAI = new GoogleGenerativeAI("AIzaSyArPJf6Oy5YpOJ5LVjCj6Nfekz9et5T2pA");

  let gapiInited = false, gisInited = false, tokenClient;
  useEffect(() => {
    //const expiryTime = new Date().getTime() + expiresIn * 1000;
    gapiLoaded();
    gisLoaded();
    window.addEventListener('keydown', handleKeyDown);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  })

  function handleKeyDown(event) {
    // Check if Ctrl key is pressed and Arrow Right key is pressed
    if (event.ctrlKey && event.key === 'ArrowRight') {
      // Switch between 'schedule' and 'tasks'
      setActiveTab(activeTab === 'schedule' ? 'tasks' : 'schedule');
    }
  }

  function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
  }

  async function initializeGapiClient() {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;

    if (accessToken && expiresIn) {
      gapi.client.setToken({
        access_token: accessToken,
        expires_in: expiresIn,
      });
      listUpcomingEvents();
    }
  }

  function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });

    gisInited = true;
  }

  //Enables user interaction after all libraries are loaded.

  function handleAuthClick() {
    // document.getElementById("autorize_home").hidden = true;
    document.getElementById("autorize_home").style.display = "none";
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        throw (resp);
      }
      await listUpcomingEvents();
      const { access_token, expires_in } = gapi.client.getToken();
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('expires_in', expires_in)
    };

    if (!(accessToken && expiresIn)) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  //Sign out the user upon button click.

  function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      localStorage.clear();
    }
  }

  async function listUpcomingEvents() {
    // document.getElementById('autorize_home').hidden = "true";
    let response;
    const today = new Date();
    // today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set time to the beginning of the next day

    try {
      const request = {
        'calendarId': 'primary',
        'timeMin': today.toISOString(),
        'timeMax': tomorrow.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
      };
      response = await gapi.client.calendar.events.list(request);
    } catch (err) {
      document.getElementById('event_container').innerText = err.message;
      return;
    }

    const events = response.result.items;
    setevetData(events);
    if (!events || events.length === 0) {
      document.getElementById('event_container').innerText = 'No events found.';
      return;
    }
    if(document.getElementById("autorize_home")){
      document.getElementById("autorize_home").style.display = "none";
    }
  }
  
  function addManualEvent(eventName, eventLocation, eventDescription, startDateTime, endDateTime, attendeeEmail) {
    var event = {
      'kind': 'calendar#event',
      'summary': eventName,
      'location': eventLocation,
      'description': eventDescription,
      'start': {
        'dateTime': startDateTime,
        'timeZone': 'UTC'
      },
      'end': {
        'dateTime': endDateTime,
        'timeZone': 'UTC'
      },
      'recurrence': [
        'RRULE:FREQ=DAILY;COUNT=1'
      ],
      'attendees': [
        {'email': attendeeEmail, 'responseStatus': 'needsAction'},
      ],
      'reminders': {
        'useDefault': true,
      },
      "guestsCanSeeOtherGuests": true,
    };
  
    var request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
      'sendUpdates': 'all'
    });
  
    request.execute((event) => {
      console.log(event);
      window.open(event.htmlLink);
    }, (error) => {
      console.error(error);
    });
  }
   



  
    function convertDateTime(dataTime){
      const dateTime = new Date(dataTime);
      let hours = dateTime.getHours();
      const minutes = dateTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12 || 12;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            return formattedTime;
    }

    function handleTabClick(tab) {
      setActiveTab(tab);
    }
  
    function handleAddTodoClick(todoText) {
      setTodos([...todos, todoText]);
    }


    function createEventSentences(events){
      return events.map((event) => {
        const summary = event.summary;
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);
    
        const formattedStartTime = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
        });
    
        const formattedEndTime = endTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
        });
    
        return `I have to ${summary} scheduled from ${formattedStartTime} to ${formattedEndTime}.`;
      });
    }

    function createTodoSentences(todos) {
      return todos.map((todo) => {
        const task = todo.task;
        const time = parseFloat(todo.time); // Parse time as float
        const formattedTime = formatTime(time);
    
        return `I want to do ${task} and require ${formattedTime} time.`;
      });
    }
    
    // Helper function to format time
    function formatTime(time) {
      const hours = Math.floor(time);
      const minutes = Math.round((time - hours) * 60);
    
      if (hours === 0) {
        return `${minutes} min`;
      } else if (hours === 1) {
        return `${hours} hr ${minutes} min`;
      } else {
        return `${hours} hrs ${minutes} min`;
      }
    }

    function printTodos(todoDataString) {
      try {
        // Parse the string into a JSON object
        const todoData = JSON.parse(todoDataString);
    
        // Check if the parsed object has a "todos" property
        if (todoData && todoData.todos && Array.isArray(todoData.todos)) {
          // Iterate over each todo and print its name and time
          todoData.todos.forEach(todo => {
            console.log(`Todo: ${todo.task}, Start Time: ${todo.start_time}, End Time: ${todo.end_time}`);
          });
        } else {
          console.error('Invalid todo data format.');
        }
      } catch (error) {
        console.error('Error parsing todo data:', error.message);
      }
    }

    async function run(prompt) {
      const model = genAI.getGenerativeModel({ model: "gemini-pro"});    
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Find the indices of the first and second occurrences of ```
      const firstBackticksIndex = text.indexOf('{');
      const secondBackticksIndex = text.lastIndexOf("```");

      // Extract the substring between the first and second occurrences of ```
      const trimmedTodoDataString = text.slice(firstBackticksIndex , secondBackticksIndex);
      let modifiedString = trimmedTodoDataString.replace(/"\btodo\b"/g, '"task"');
      modifiedString = modifiedString.replace(/"\bname\b"/g, '"task"');
      modifiedString = modifiedString.replace(/"\bscheduled_todos\b"/g, '"todos"');
      modifiedString = modifiedString.replace(/"\bschedule\b"/g, '"todos"');


      console.log(modifiedString);
      printTodos(modifiedString);
      // addManualEvent();
      // addManualEvent(
      //   'Meeting with Team',
      //   'Office',
      //   'Discuss project updates',
      //   '2023-12-30T09:30:00.000Z',
      //   '2023-12-30T11:00:00.000Z',
      //   'pratham111ingole@gmail.com'
      // );
    }
    


    function sheduleEvents(){
      console.log("clicked");

      // console.log(eventData);

      const eventSentences = createEventSentences(eventData);
      const todoSentences = createTodoSentences(todos);

      // Output the sentences
      // console.log(eventSentences.join('\n'));
      // // console.log(todos);
      // console.log(todoSentences.join('\n'));


      let prompt = "Create a schedule for me, for given todos based on the time it takes to do each todo. I have already scheduled the following events which cannot be re-scheduled which are : \n "
      + eventSentences.join('\n') 
      + " Now create scheduled for the following todo. Also take in account the time it takes to complete each todo. The list of todos are : \n"
      + todoSentences.join('\n')
      + " .\n Return a json object consisting of list of scheduled todos and the starting and ending time for each task as per you."
      + " The new schedule should not overlap with already sheduled tasks. Do not add the already scheduled task in this json object.  Take in account that I start working at 9 am till 10pm. Only return schedule for todos not sheduled. Do not add already schedule tasks to this object. ";

      // console.log(prompt);

      run(prompt)

    }




  
  return (
    <div>
      <div id="autorize_home" >
        <div className="autorize_container">
          <div className="header">
            <Logo />
            <div className="autorize-line"></div>
            <div className="colaborators">
              <div className="gpt icon"></div>
              <div className="x">x</div>
              <div className="calender icon"></div>
            </div>
          </div>
          <div id="image-container">
            <div id="welcomeImage"></div>
            <div id="welcomeImageText">Shedule task and Plan your day with ease</div>
          </div>
           <div id="authorize_button"  onClick={handleAuthClick}>
            <p id="button-text">Authorize</p>
            <ArrowRight fill='#66FC00' style={{ height:30, width: 30 }} />
          </div>
        </div>
      </div>

      <div id="loggedin"  hidden={!accessToken && !expiresIn}>
        <div id="homescreen">
          <div id="navbar">
            <div id="logoutButton"  onClick={handleSignoutClick}>
              <ArrowRight fill='#ebb6b6' style={{ height:30, width: 30,rotate:"180deg" }} />
            </div>
            <div>
              <p>Today</p>
              <TodayDate/>
            </div>
            <div id="sheduleItButton" onClick={sheduleEvents}>
              <ArrowRight fill='#a9e97e' style={{ height:30, width: 30 }} />
            </div>
          </div>
          <div id="tab-row">
            <div
              className={`sheduleTab ${activeTab === 'schedule' ? 'selectedTab' : ''}`}
              onClick={() => handleTabClick('schedule')}
            >
              Schedule
            </div>
            <div
              className={`sheduleTab ${activeTab === 'tasks' ? 'selectedTab' : ''}`}
              onClick={() => handleTabClick('tasks')}
            >
              Tasks
            </div>
          </div>
          {activeTab === 'schedule' ? (
        <div id="event_container">
                {(eventData && eventData.length) ? eventData.map((item,index) => {
                  return <div 
                  className="eventBars" 
                  key={item.id} 
                  style={{     
                    color : fontColors[index % fontColors.length],
                    backgroundColor: backgroundColors[index % backgroundColors.length],
                    borderRadius: `${index === 0 ? '5px 5px 0 0' : ''}${index === eventData.length - 1 ? '0 0 5px 5px' : ''}`,
                  }}
                  >
                    <p className="eventIndex">{index+1}</p>
                    
                    {item.start.date? <p className="eventTimes allDayEvent">All Day</p> : <div className="eventTimes"><p>{convertDateTime(item.start.dateTime)}</p><p> {convertDateTime(item.end.dateTime)}</p></div>}
                    
                    <p className="eventSummary">{item.summary}</p> 
                  </div>
                }) : <>No Data found</>}
          </div> ) : (
        <div id="tasks_container">
          <TodoList todos={todos} />
          <TodoInput onAddTodo={handleAddTodoClick} />
        </div>
      )}
        </div>  
      </div>
    </div>
  );
}


function TodoInput({ onAddTodo }) {
  const [todoText, setTodoText] = useState('');

  function handleInputChange(e) {
    setTodoText(e.target.value);
  }

  function handleAddTodo() {
    if (todoText.trim() !== '') {
      const [task, time] = parseTodoText(todoText);
      onAddTodo({ task, time });
      setTodoText('');
    }
  }

  function parseTodoText(text) {
    const regex = /(.+)\s?@(\d+(\.\d+)?)?/;
    const match = text.match(regex);
    const task = match ? match[1].trim() : text.trim();
    const time = match ? match[2] : null;
    return [task, time];
  }

  return (
    <div className="todoInputContainer">
      <input
        type="text"
        placeholder="Enter your todo..."
        value={todoText}
        onChange={handleInputChange}
        id="todoInput"
      />
      <button id="todoSend" onClick={handleAddTodo}>-</button>
    </div>
  );
}

function TodoList({ todos }) {
  const backgroundColors = ["#ec3a5a", "#fb8231", "#fdf9a0","#20bf6b","#349cdb","#3e6dd7","#8c59d0"];
  const fontColors = ["#ffffff","#ffffff","#0e0e0e","#ffffff","#ffffff","#ffffff","#ffffff",]
  return (
    <div className="todoListContainer">
        {todos.map((todo, index) => (
          <div 
          className="taskbars" 
          key={index}
          style={{     
            color : fontColors[index % fontColors.length],
            backgroundColor: backgroundColors[index % backgroundColors.length],
            borderRadius: `${index === 0 ? '5px 5px 0 0' : ''}${index === todos.length - 1 ? '0 0 5px 5px' : ''}`,
          }}
          >
            <div id="taskIndex">{index+1}</div>
            <div id="taskSummary">{todo.task}</div>
            <div id="taskTime"
            style={{
              borderColor : fontColors[index % fontColors.length],
            }}
            >
              {todo.time ? `${todo.time} hr` : '-'}
            </div>
          </div>
        ))}
    </div>
  );
}


export default Home;
