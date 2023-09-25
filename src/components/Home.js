import { useEffect } from "react";
import './Home.css';
import Logo from "./Logo";
import {ReactComponent as ArrowRight} from './assests/arrow_forward_FILL0_wght400_GRAD0_opsz24.svg';
function Home() {
    const gapi = window.gapi;
  const google = window.google;

  const CLIENT_ID = "527900086936-rkb3si94935g83g2vmtjmoi83lmcpb1h.apps.googleusercontent.com";
  const API_KEY = "AIzaSyA-6Om9C4ynVH8PhB_H7y8Pz5nbZYX80f4";
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = "https://www.googleapis.com/auth/calendar";

  const accessToken = localStorage.getItem('access_token');
  const expiresIn = localStorage.getItem('expires_in');

  let gapiInited = false, gisInited = false, tokenClient;

  useEffect(() => {
    //const expiryTime = new Date().getTime() + expiresIn * 1000;
    gapiLoaded()
    gisLoaded()
  }, [])

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
    let response;
    try {
      const request = {
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
      };
      response = await gapi.client.calendar.events.list(request);
    } catch (err) {
      document.getElementById('content').innerText = err.message;
      return;
    }

    const events = response.result.items;
    if (!events || events.length === 0) {
      document.getElementById('content').innerText = 'No events found.';
      return;
    }
    // Flatten to string to display
    const output = events.reduce(
      (str, event) => `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,'Events:\n');
    document.getElementById('content').innerText = output;
  }
  
  function addManualEvent(){
    var event = {
      'kind': 'calendar#event',
      'summary': 'Event 2',
      'location': 'Masai School, Bangalore',
      'description': 'Paty time',
      'start': {
        'dateTime': '2023-03-18T01:05:00.000Z',
        'timeZone': 'UTC'
      },
      'end': {
        'dateTime': '2023-03-18T01:35:00.000Z',
        'timeZone': 'UTC'
      },
      'recurrence': [
        'RRULE:FREQ=DAILY;COUNT=1'
      ],
      'attendees': [
        {'email': 'tecasdhmovdd@gmail.com','responseStatus':'needsAction'},
      ],
      'reminders': {
        'useDefault': true,
      },
      "guestsCanSeeOtherGuests": true,
    }

      var request = gapi.client.calendar.events.insert({'calendarId': 'primary','resource': event,'sendUpdates': 'all'});
      request.execute((event)=>{
          console.log(event)
          window.open(event.htmlLink)
      },(error)=>{
        console.error(error);
      });
    }
  return (
    <div>
      <div id="autorize_home" hidden={accessToken}>
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
        <button id="signout_button"   onClick={handleSignoutClick}>Sign Out</button>
        <button id='add_manual_event' onClick={addManualEvent}>Add Event</button>
        <pre id="content" style={{ whiteSpace: 'pre-wrap' }}></pre>
      </div>
    </div>
  );
}

export default Home;
