-- ============================================================
-- FoodoraX — Move demo restaurants to San Francisco
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- The iOS Simulator's fake GPS defaults to San Francisco (37.7749, -122.4194).
-- Co-locating the demo restaurants there (like the Rideva project does) means
-- the customer, restaurant, and rider are all near each other on the simulator,
-- so the map, route, and delivery flow all look correct while testing.
--
-- For production with real restaurants, ignore this — real coords come from
-- the restaurant's address on signup.
-- ============================================================

UPDATE restaurants SET latitude = 37.7749, longitude = -122.4194, address = '101 Market St', city = 'San Francisco'
  WHERE id = 'b0000000-0000-0000-0000-000000000001'; -- Burger Republic (Downtown)

UPDATE restaurants SET latitude = 37.7858, longitude = -122.4064, address = '250 Powell St', city = 'San Francisco'
  WHERE id = 'b0000000-0000-0000-0000-000000000002'; -- Pizza Forno (Union Square)

UPDATE restaurants SET latitude = 37.7965, longitude = -122.3994, address = '1 Embarcadero Center', city = 'San Francisco'
  WHERE id = 'b0000000-0000-0000-0000-000000000003'; -- Sakura Sushi (Embarcadero)

UPDATE restaurants SET latitude = 37.7599, longitude = -122.4148, address = '2800 Mission St', city = 'San Francisco'
  WHERE id = 'b0000000-0000-0000-0000-000000000004'; -- Taco Fiesta (Mission)

UPDATE restaurants SET latitude = 37.7694, longitude = -122.4862, address = '1234 Irving St', city = 'San Francisco'
  WHERE id = 'b0000000-0000-0000-0000-000000000005'; -- Green Bowl (Sunset)
