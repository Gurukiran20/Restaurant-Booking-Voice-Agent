import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:5000';

function speak(text) {
  if (!text) return;
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-Speech not supported in this browser');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function App() {
  const [customerName, setCustomerName] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState('Indian');
  const [specialRequests, setSpecialRequests] = useState('');
  const [location, setLocation] = useState('Bangalore,IN');

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [voiceSuggestion, setVoiceSuggestion] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [error, setError] = useState('');

  // Voice conversation state
  const [step, setStep] = useState(-1); // -1 = no active question
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [messages, setMessages] = useState([]);

  // Page state: "booking" | "dashboard" | "contact"
  const [currentPage, setCurrentPage] = useState('booking');

  // Dashboard bookings
  const [allBookings, setAllBookings] = useState([]);

  // Navbar menu open/close
  const [navOpen, setNavOpen] = useState(false);

  const stepsLabels = [
    'Name',
    'Guests',
    'Date',
    'Time',
    'Cuisine',
    'Requests',
    'Location',
  ];

  const questions = [
    {
      key: 'name',
      prompt: 'What is your name?',
      handle: (transcript) => {
        const proper = transcript
          .trim()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (proper) setCustomerName(proper);
      },
    },
    {
      key: 'guests',
      prompt: 'How many guests should I book the table for?',
      handle: (transcript) => {
        const m = transcript.toLowerCase().match(/\d+/);
        if (m) setNumberOfGuests(parseInt(m[0], 10));
      },
    },
    {
      key: 'date',
      prompt:
        'On which date would you like to book? For example, say 6 December 2025.',
      handle: (transcript) => {
        const d = new Date(transcript);
        if (!isNaN(d.getTime())) {
          const iso = d.toISOString().split('T')[0];
          setBookingDate(iso);
        }
      },
    },
    {
      key: 'time',
      prompt: 'At what time? For example, say 8 p.m. or 20 00.',
      handle: (transcript) => {
        const lower = transcript.toLowerCase();
        const m = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
        if (m) {
          let hour = parseInt(m[1], 10);
          let minutes = m[2] ? parseInt(m[2], 10) : 0;
          const ampm = m[3];
          if (ampm === 'pm' && hour < 12) hour += 12;
          if (ampm === 'am' && hour === 12) hour = 0;
          const hh = hour.toString().padStart(2, '0');
          const mm = minutes.toString().padStart(2, '0');
          setBookingTime(`${hh}:${mm}`);
        }
      },
    },
    {
      key: 'cuisine',
      prompt:
        'What cuisine would you like? For example, Indian, Italian, Chinese, Mexican or Thai.',
      handle: (transcript) => {
        const lower = transcript.toLowerCase();
        if (lower.includes('indian')) setCuisinePreference('Indian');
        else if (lower.includes('italian')) setCuisinePreference('Italian');
        else if (lower.includes('chinese')) setCuisinePreference('Chinese');
        else if (lower.includes('mexican')) setCuisinePreference('Mexican');
        else if (lower.includes('thai')) setCuisinePreference('Thai');
      },
    },
    {
      key: 'special',
      prompt:
        'Any special requests like birthday, anniversary or dietary preferences?',
      handle: (transcript) => {
        setSpecialRequests(transcript.trim());
      },
    },
    {
      key: 'location',
      prompt:
        'Which city should I use for weather? For example, Bangalore India or Mangalore India.',
      handle: (transcript) => {
        setLocation(transcript.trim());
      },
    },
  ];

  //booking submit logic reused by button AND voice 
  const submitBooking = async () => {
    setLoading(true);
    setError('');
    setResponseMessage('');
    setVoiceSuggestion('');
    setCreatedBooking(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          numberOfGuests: Number(numberOfGuests),
          bookingDate,
          bookingTime,
          cuisinePreference,
          specialRequests,
          location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setResponseMessage(data.message || 'Booking created successfully');
      setVoiceSuggestion(data.voiceSuggestion || '');
      setCreatedBooking(data.booking || null);

      if (data.voiceSuggestion) {
        speak(data.voiceSuggestion);
      } else {
        speak('Your booking has been created successfully.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create booking');
      speak('Sorry, I could not create your booking due to an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitBooking();
  };

  // Voice Conversation 

  const pushMessage = (from, text) => {
    setMessages((prev) => [
      ...prev,
      {
        from,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const startConversation = () => {
    setError('');
    setLastTranscript('');
    setMessages([]);
    setStep(0);

    const welcome1 =
      'Welcome to our restaurant booking system. Click Start Voice Booking to begin.';
    const welcome2 = 'Okay, I will ask you a few questions for your booking...';

    pushMessage('agent', welcome1);
    pushMessage('agent', welcome2);
    pushMessage('agent', questions[0].prompt);

    speak(
      'Welcome to our restaurant booking Voice Agent. I will ask you a few questions for your booking. ' +
        questions[0].prompt
    );
  };

  //  Web Speech API based voice recognition (no backend)
  const listenForAnswer = () => {
    if (step < 0 || step >= questions.length) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser.';
      setError(msg);
      speak('Sorry, your browser does not support speech recognition.');
      return;
    }

    const currentStep = step;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setLastTranscript('');
    setError('');
    pushMessage('agent', 'Listening... please answer now.');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      pushMessage('user', transcript);
      questions[currentStep].handle(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError('Speech recognition error: ' + event.error);
      setIsListening(false);
      speak(
        'Sorry, I could not understand. Please click Answer with Voice and try again.'
      );
    };

    recognition.onend = async () => {
      setIsListening(false);

      // Move to next question or finish
      const next = currentStep + 1;
      if (next < questions.length) {
        setStep(next);
        pushMessage('agent', questions[next].prompt);
        speak(questions[next].prompt);
      } else {
        // All questions done – auto create booking
        setStep(-1);
        const doneMsg =
          'Thank you. I have filled the booking form with your answers. I will now confirm your booking.';
        pushMessage('agent', doneMsg);
        speak(doneMsg);

        // small delay so user can hear the message
        setTimeout(() => {
          submitBooking();
        }, 1500);
      }
    };

    recognition.start();
  };

  const currentQuestionText =
    step >= 0 && step < questions.length
      ? questions[step].prompt
      : 'No active question.';

  const activeStepIndex = step >= 0 ? step : 0;

  // Mark steps completed based on form fields (manual typing OR voice)
  const completedSteps = [
    customerName.trim().length > 0, // 0: Name
    Number(numberOfGuests) > 0, // 1: Guests
    !!bookingDate, // 2: Date
    !!bookingTime, // 3: Time
    !!cuisinePreference, // 4: Cuisine
    specialRequests.trim().length > 0, // 5: Requests
    location.trim().length > 0, // 6: Location
  ];

  // Dashboard fetching 

  const fetchAllBookings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
      setAllBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings for dashboard', err);
    }
  };

  useEffect(() => {
    if (currentPage === 'dashboard') {
      fetchAllBookings();
    }
  }, [currentPage]);

  // helper: UI label for status
  const formatStatus = (status) => {
    if (!status) return 'Confirmed';
    if (status.toLowerCase() === 'pending') return 'Confirmed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // ---------- UI ----------

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setNavOpen(false);
  };

  return (
    <div style={styles.page}>
      {/* NAVBAR – floating top-left on header */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>Restaurant Booking Voice Agent</div>

        {/* Hamburger icon */}
        <div
          onClick={() => setNavOpen((prev) => !prev)}
          style={styles.hamburger}
        >
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </div>

        {/* Dropdown menu */}
        {navOpen && (
          <div style={styles.navMenu}>
            <button
              type="button"
              style={{
                ...styles.navMenuItem,
                ...(currentPage === 'booking' ? styles.navMenuItemActive : {}),
              }}
              onClick={() => handleNavClick('booking')}
            >
              Booking
            </button>
            <button
              type="button"
              style={{
                ...styles.navMenuItem,
                ...(currentPage === 'dashboard'
                  ? styles.navMenuItemActive
                  : {}),
              }}
              onClick={() => handleNavClick('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              style={{
                ...styles.navMenuItem,
                ...(currentPage === 'contact' ? styles.navMenuItemActive : {}),
              }}
              onClick={() => handleNavClick('contact')}
            >
              Contact Us
            </button>
          </div>
        )}
      </nav>

      {currentPage === 'booking' && (
        <>
          {/* Header */}
          <header style={styles.header}>
            <h1 style={styles.headerTitle}>Restaurant Booking Voice Agent</h1>
            <p style={styles.headerSubtitle}>
              Book your table using just your voice
            </p>
          </header>

          {/* Main two-column layout */}
          <main style={styles.main}>
            {/* Left: Voice flow + chat */}
            <section style={styles.leftPane}>
              {/* Stepper */}
              <div style={styles.stepper}>
                {stepsLabels.map((label, index) => {
                  const isActive =
                    step >= 0 && index === activeStepIndex;
                  const isDone =
                    (step !== -1 && index < activeStepIndex) ||
                    completedSteps[index];

                  return (
                    <div key={label} style={styles.stepItem}>
                      <div
                        style={{
                          ...styles.stepCircle,
                          ...(isActive || isDone ? styles.stepCircleActive : {}),
                        }}
                      >
                        {index + 1}
                      </div>
                      <span style={styles.stepLabel}>{label}</span>
                      {index < stepsLabels.length - 1 && (
                        <div style={styles.stepLine} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Voice booking controls */}
              <div style={styles.voiceCard}>
                <button
                  type="button"
                  style={styles.startVoiceButton}
                  onClick={startConversation}
                  disabled={isListening}
                >
                  Start Voice Booking
                </button>
                <p style={styles.voiceHint}>● Click to continue</p>

                {/* Chat area */}
                <div style={styles.chatArea}>
                  {messages.length === 0 && (
                    <div style={styles.chatEmpty}>
                      Start a voice booking to see the conversation here.
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.chatBubble,
                        ...(m.from === 'user'
                          ? styles.chatBubbleUser
                          : styles.chatBubbleAgent),
                      }}
                    >
                      <div>{m.text}</div>
                      <div style={styles.chatTime}>{m.time}</div>
                    </div>
                  ))}
                </div>

                {/* Current question + answer button */}
                <div style={styles.voiceFooter}>
                  <div style={styles.currentQuestionBox}>
                    <strong>Current question:</strong> {currentQuestionText}
                  </div>
                  <button
                    type="button"
                    style={styles.answerButton}
                    onClick={listenForAnswer}
                    disabled={step === -1 || isListening}
                  >
                    {isListening ? 'Listening… 🎧' : '🎙 Answer with Voice'}
                  </button>
                  {lastTranscript && (
                    <div style={styles.lastHeard}>
                      <strong>Last heard:</strong> {lastTranscript}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Right: Form + booking summary */}
            <section style={styles.rightPane}>
              <h2 style={styles.rightTitle}>Booking Details</h2>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.row}>
                  <label style={styles.label}>Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Number of Guests</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    placeholder="Number of guests"
                    required
                  />
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Booking Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    placeholder="Booking date"
                    required
                  />
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Booking Time</label>
                  <input
                    style={styles.input}
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    placeholder="Booking time"
                    required
                  />
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Cuisine Preference</label>
                  <select
                    style={styles.input}
                    value={cuisinePreference}
                    onChange={(e) => setCuisinePreference(e.target.value)}
                  >
                    <option value="Indian">Indian</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Thai">Thai</option>
                  </select>
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Special Requests</label>
                  <textarea
                    style={{ ...styles.input, height: '70px' }}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Special requests like birthday, anniversary, dietary needs..."
                  />
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Location</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location for weather check"
                  />
                </div>

                <button
                  style={styles.submitButton}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating Booking...' : 'Confirm Booking'}
                </button>
              </form>

              {error && <div style={styles.error}> {error}</div>}

              {responseMessage && (
                <div style={styles.success}> {responseMessage}</div>
              )}

              {voiceSuggestion && (
                <div style={styles.voiceBox}>
                  <strong>Agent says:</strong> {voiceSuggestion}
                </div>
              )}

              {createdBooking && (
                <div style={styles.summaryCard}>
                  <h3>Booking Summary</h3>
                  <p>
                    <strong>Booking ID:</strong> {createdBooking.bookingId}
                  </p>
                  <p>
                    <strong>Name:</strong> {createdBooking.customerName}
                  </p>
                  <p>
                    <strong>Guests:</strong> {createdBooking.numberOfGuests}
                  </p>
                  <p>
                    <strong>Date &amp; Time:</strong>{' '}
                    {new Date(
                      createdBooking.bookingDate
                    ).toLocaleDateString()}{' '}
                    at {createdBooking.bookingTime}
                  </p>
                  <p>
                    <strong>Cuisine:</strong> {createdBooking.cuisinePreference}
                  </p>
                  <p>
                    <strong>Seating:</strong> {createdBooking.seatingPreference}
                  </p>
                  {createdBooking.weatherInfo && (
                    <p>
                      <strong>Weather:</strong>{' '}
                      {createdBooking.weatherInfo.description} (
                      {createdBooking.weatherInfo.temperature}°C)
                    </p>
                  )}
                </div>
              )}
            </section>
          </main>
        </>
      )}

      {currentPage === 'dashboard' && (
        <main style={styles.infoSection}>
          <h2 style={styles.infoTitle}>All Bookings Dashboard</h2>
          <p style={styles.infoText}>This is lists all bookings </p>

          <div style={styles.adminTableWrapper}>
            <table style={styles.adminTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Booking ID</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Guests</th>
                  <th style={styles.tableHeaderCell}>Date</th>
                  <th style={styles.tableHeaderCell}>Time</th>
                  <th style={styles.tableHeaderCell}>Cuisine</th>
                  <th style={styles.tableHeaderCell}>Seating</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Location</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      style={{ ...styles.tableCell, textAlign: 'center' }}
                    >
                      No bookings found.
                    </td>
                  </tr>
                )}
                {allBookings.map((b) => (
                  <tr key={b._id}>
                    <td style={styles.tableCell}>{b.bookingId}</td>
                    <td style={styles.tableCell}>{b.customerName}</td>
                    <td style={styles.centerCell}>{b.numberOfGuests}</td>
                    <td style={styles.centerCell}>
                      {new Date(b.bookingDate).toLocaleDateString('en-IN')}
                    </td>
                    <td style={styles.centerCell}>{b.bookingTime}</td>
                    <td style={styles.tableCell}>{b.cuisinePreference}</td>
                    <td style={styles.tableCell}>{b.seatingPreference}</td>
                    <td style={styles.centerCell}>{formatStatus(b.status)}</td>
                    <td style={styles.tableCell}>{b.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {currentPage === 'contact' && (
        <main style={styles.infoSection}>
          <h2 style={styles.infoTitle}>Contact Us</h2>
          <p style={styles.infoText}>
            Name: <strong>Gurukiran</strong>
          </p>
          <p style={styles.infoText}>
            Email:{' '}
            <a href="mailto:gurusm43@gmail.com" style={{ color: '#2563eb' }}>
              gurusm43@gmail.com
            </a>
          </p>
          <p style={{ ...styles.infoText, marginTop: 8 }}>
            This page is part of the Vaiu AI Software Developer Internship
            assignment for a Restaurant Booking Voice Agent.
          </p>
        </main>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    position: 'relative',
  },

  // NAVBAR – floating in the purple header area
  navbar: {
    position: 'absolute',
    top: 10,
    left: 24,
    right: 24,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#f9fafb',
    backgroundColor: 'transparent',
  },
  navBrand: {
    fontWeight: 600,
    fontSize: '16px',
    letterSpacing: '0.02em',
  },
  hamburger: {
    width: 26,
    height: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  hamburgerLine: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#facc15',
  },
  navMenu: {
    position: 'absolute',
    right: 0,
    top: 32,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 140,
    gap: 4,
  },
  navMenuItem: {
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#e5e7eb',
    fontSize: 13,
    textAlign: 'left',
    cursor: 'pointer',
  },
  navMenuItemActive: {
    backgroundColor: '#4f46e5',
    color: '#fff',
  },

  header: {
    padding: '40px 0 40px',
    background: 'linear-gradient(90deg, #6366f1 0%,  #6366f1 70%)',
    color: '#fff',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: '15px',
    opacity: 0.9,
  },
  main: {
    maxWidth: '1100px',
    margin: '-32px auto 24px',
    padding: '0 16px 24px',
    display: 'grid',
    gridTemplateColumns: '2fr 1.6fr',
    gap: '16px',
  },
  leftPane: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPane: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '18px 18px 20px',
    boxShadow: '0 10px 25px rgba(37, 55, 96, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  rightTitle: {
    marginBottom: 12,
    fontSize: '20px',
    fontWeight: 600,
  },

  // Stepper
  stepper: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: '999px',
    border: '2px solid #e5e7eb',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    zIndex: 1,
  },
  stepCircleActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#46e54e',
    color: '#fff',
  },
  stepLabel: {
    marginLeft: 6,
    fontSize: '12px',
    color: '#4b5563',
    whiteSpace: 'nowrap',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginLeft: 6,
  },

  // Voice card + chat
  voiceCard: {
    marginTop: 8,
    borderRadius: 16,
    background:
      'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08))',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  startVoiceButton: {
    alignSelf: 'center',
    padding: '10px 28px',
    borderRadius: '999px',
    border: 'none',
    background:
      'linear-gradient(135deg, #fd7311ff)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(97, 91, 219, 0.35)',
  },
  voiceHint: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: '12px',
    color: '#4b5563',
  },
  chatArea: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    minHeight: '260px',
    maxHeight: '320px',
    overflowY: 'auto',
    border: '1px solid #e5e7eb',
  },
  chatEmpty: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
  chatBubble: {
    maxWidth: '90%',
    padding: '8px 10px',
    borderRadius: 12,
    marginBottom: 6,
    fontSize: '14px',
  },
  chatBubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderTopLeftRadius: 4,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbeafe',
    borderTopRightRadius: 4,
  },
  chatTime: {
    marginTop: 2,
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'right',
  },
  voiceFooter: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  currentQuestionBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 8,
    fontSize: '13px',
    border: '1px solid #e5e7eb',
  },
  answerButton: {
    alignSelf: 'flex-start',
    padding: '6px 14px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#0ea5e9',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
  lastHeard: {
    fontSize: '12px',
    color: '#4b5563',
  },

  // Form
  form: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: '14px',
  },
  submitButton: {
    marginTop: 8,
    padding: '10px 14px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#169607ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Messages / summary
  error: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 8,
    fontSize: '13px',
  },
  success: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: 8,
    fontSize: '13px',
  },
  voiceBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    border: '1px solid #bfdbfe',
    fontSize: '13px',
  },
  summaryCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '13px',
  },

  // Dashboard / Contact container
  infoSection: {
    maxWidth: '1100px',
    margin: '24px auto',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: 8,
  },
  infoText: {
    fontSize: '14px',
    color: '#4b5563',
  },

  adminTableWrapper: {
    marginTop: 14,
    maxHeight: '420px',
    overflowY: 'auto',
  },
  adminTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeaderCell: {
    border: '1px solid #e5e7eb',
    padding: '6px 8px',
    backgroundColor: '#f9fafb',
    fontWeight: 600,
    fontSize: '12px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  tableCell: {
    border: '1px solid #e5e7eb',
    padding: '6px 8px',
    fontSize: '12px',
    textAlign: 'left',
  },
  centerCell: {
    border: '1px solid #e5e7eb',
    padding: '6px 8px',
    fontSize: '12px',
    textAlign: 'center',
  },
};

export default App;
