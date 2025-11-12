-- =============================================
-- CALENDAR INTEGRATION TABLES
-- =============================================

CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- OAuth Credentials (Encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  
  -- Calendar Info
  calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
  calendar_name VARCHAR(255),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  
  -- Sync Settings
  is_active BOOLEAN DEFAULT true,
  sync_token TEXT, -- For incremental sync
  last_sync_at TIMESTAMPTZ,
  
  -- Statistics
  total_events_synced INTEGER DEFAULT 0,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(builder_id, calendar_id)
);

CREATE INDEX idx_calendar_connections_builder ON calendar_connections(builder_id);
CREATE INDEX idx_calendar_connections_active ON calendar_connections(is_active) WHERE is_active = true;

-- =============================================
-- CALENDAR EVENTS (Synced from Google)
-- =============================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google Calendar IDs
  google_event_id VARCHAR(255) NOT NULL,
  google_calendar_id VARCHAR(255) NOT NULL,
  
  -- Event Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  is_all_day BOOLEAN DEFAULT false,
  
  -- Event Type
  event_type VARCHAR(100), -- 'site_visit', 'meeting', 'call', 'other'
  
  -- Related Records
  lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Attendees
  attendees JSONB, -- [{ email, name, status }]
  
  -- Conference/Meet Link
  meet_link TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'
  
  -- Reminders
  reminders JSONB, -- [{ method: 'email', minutes: 30 }]
  
  -- Sync Info
  is_synced BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(google_event_id, google_calendar_id)
);

CREATE INDEX idx_calendar_events_builder ON calendar_events(builder_id);
CREATE INDEX idx_calendar_events_google ON calendar_events(google_event_id);
CREATE INDEX idx_calendar_events_lead ON calendar_events(lead_id);
CREATE INDEX idx_calendar_events_property ON calendar_events(property_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- =============================================
-- SITE VISIT BOOKINGS
-- =============================================

CREATE TABLE site_visit_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  lead_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Booking Details
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  visit_datetime TIMESTAMPTZ NOT NULL, -- Combined date + time
  duration_minutes INTEGER DEFAULT 60,
  
  -- Visitor Info
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(20) NOT NULL,
  visitor_count INTEGER DEFAULT 1, -- Number of people visiting
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50), -- 'lead', 'builder', 'system'
  
  -- Meeting Point
  meeting_point TEXT,
  special_instructions TEXT,
  
  -- Confirmation
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- Reminders Sent
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_2h_sent_at TIMESTAMPTZ,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  feedback_rating INTEGER, -- 1-5
  feedback_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_visits_lead ON site_visit_bookings(lead_id);
CREATE INDEX idx_site_visits_builder ON site_visit_bookings(builder_id);
CREATE INDEX idx_site_visits_property ON site_visit_bookings(property_id);
CREATE INDEX idx_site_visits_date ON site_visit_bookings(visit_date);
CREATE INDEX idx_site_visits_datetime ON site_visit_bookings(visit_datetime);
CREATE INDEX idx_site_visits_status ON site_visit_bookings(status);

-- =============================================
-- AVAILABILITY SLOTS
-- =============================================

CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  builder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Day of Week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time Range
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Settings
  is_available BOOLEAN DEFAULT true,
  slot_duration_minutes INTEGER DEFAULT 60,
  buffer_time_minutes INTEGER DEFAULT 15, -- Gap between appointments
  max_bookings_per_slot INTEGER DEFAULT 1,
  
  -- Override specific dates
  override_dates DATE[], -- Specific dates when this rule doesn't apply
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_builder ON availability_slots(builder_id);
CREATE INDEX idx_availability_day ON availability_slots(day_of_week);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visit_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Calendar Connections
CREATE POLICY "Builders can manage their calendar connections"
  ON calendar_connections FOR ALL
  USING (builder_id = auth.uid());

-- Calendar Events
CREATE POLICY "Builders can manage their calendar events"
  ON calendar_events FOR ALL
  USING (builder_id = auth.uid());

-- Site Visit Bookings
CREATE POLICY "Builders can view their bookings"
  ON site_visit_bookings FOR SELECT
  USING (builder_id = auth.uid());

CREATE POLICY "Leads can view their own bookings"
  ON site_visit_bookings FOR SELECT
  USING (lead_id = auth.uid());

CREATE POLICY "Anyone can create bookings"
  ON site_visit_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Builders and leads can update their bookings"
  ON site_visit_bookings FOR UPDATE
  USING (builder_id = auth.uid() OR lead_id = auth.uid());

-- Availability Slots
CREATE POLICY "Builders can manage their availability"
  ON availability_slots FOR ALL
  USING (builder_id = auth.uid());

CREATE POLICY "Anyone can view availability"
  ON availability_slots FOR SELECT
  USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_calendar_connections_timestamp
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_timestamp
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_visit_bookings_timestamp
  BEFORE UPDATE ON site_visit_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_timestamp
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check availability for a time slot
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_builder_id UUID,
  p_datetime TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  is_available BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_time TIME;
  v_end_time TIMESTAMPTZ;
  v_existing_bookings INTEGER;
  v_max_bookings INTEGER;
BEGIN
  -- Extract day of week and time
  v_day_of_week := EXTRACT(DOW FROM p_datetime);
  v_time := p_datetime::TIME;
  v_end_time := p_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if builder has availability for this day/time
  SELECT COUNT(*), COALESCE(MAX(max_bookings_per_slot), 1)
  INTO v_existing_bookings, v_max_bookings
  FROM availability_slots
  WHERE builder_id = p_builder_id
    AND day_of_week = v_day_of_week
    AND v_time >= start_time
    AND v_time < end_time
    AND is_available = true
    AND (override_dates IS NULL OR p_datetime::DATE != ALL(override_dates));
  
  IF v_existing_bookings = 0 THEN
    RETURN QUERY SELECT false, 'No availability configured for this time slot';
    RETURN;
  END IF;
  
  -- Check existing bookings
  SELECT COUNT(*)
  INTO v_existing_bookings
  FROM site_visit_bookings
  WHERE builder_id = p_builder_id
    AND status NOT IN ('cancelled', 'no_show')
    AND visit_datetime >= p_datetime
    AND visit_datetime < v_end_time;
  
  IF v_existing_bookings >= v_max_bookings THEN
    RETURN QUERY SELECT false, 'Time slot is already fully booked';
    RETURN;
  END IF;
  
  -- Check Google Calendar events
  SELECT COUNT(*)
  INTO v_existing_bookings
  FROM calendar_events
  WHERE builder_id = p_builder_id
    AND status != 'cancelled'
    AND start_time < v_end_time
    AND end_time > p_datetime;
  
  IF v_existing_bookings > 0 THEN
    RETURN QUERY SELECT false, 'Conflicts with existing calendar event';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Slot is available';
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a date range
CREATE OR REPLACE FUNCTION get_available_slots(
  p_builder_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  slot_datetime TIMESTAMPTZ,
  slot_date DATE,
  slot_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_current_date DATE;
  v_slot_record RECORD;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- Get availability slots for current day
    FOR v_slot_record IN
      SELECT 
        start_time,
        end_time,
        slot_duration_minutes,
        buffer_time_minutes
      FROM availability_slots
      WHERE builder_id = p_builder_id
        AND day_of_week = EXTRACT(DOW FROM v_current_date)
        AND is_available = true
        AND (override_dates IS NULL OR v_current_date != ALL(override_dates))
    LOOP
      -- Generate time slots
      DECLARE
        v_current_time TIME := v_slot_record.start_time;
        v_slot_datetime TIMESTAMPTZ;
        v_check_result RECORD;
      BEGIN
        WHILE v_current_time < v_slot_record.end_time LOOP
          v_slot_datetime := (v_current_date || ' ' || v_current_time)::TIMESTAMPTZ;
          
          -- Check if slot is available
          SELECT * INTO v_check_result
          FROM check_slot_availability(p_builder_id, v_slot_datetime, p_duration_minutes);
          
          RETURN QUERY SELECT 
            v_slot_datetime,
            v_current_date,
            v_current_time,
            v_check_result.is_available;
          
          -- Move to next slot
          v_current_time := v_current_time + (v_slot_record.slot_duration_minutes || ' minutes')::INTERVAL;
        END LOOP;
      END;
    END LOOP;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

