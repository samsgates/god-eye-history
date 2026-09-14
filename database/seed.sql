INSERT INTO historical_events(
 id,slug,title,short_description,full_description,date_start,date_end,date_precision,date_confidence,
 location,location_precision,location_confidence,historical_place_name,modern_place_name,country,city,categories,
 importance_score,confidence_score,sources,significance,verification_status
) VALUES
('seed-great-fire','great-fire-london','Great Fire of London','A major conflagration swept through central London.',
 'The Great Fire of London burned through much of the medieval City of London in September 1666.','1666-09-02','1666-09-06','exact_day',.98,
 ST_SetSRID(ST_MakePoint(-0.0855,51.5115),4326)::geography,'city',.9,'City of London','London','United Kingdom','London',ARRAY['disaster','architecture'],.95,.98,
 '[{"title":"Encyclopaedia Britannica","url":"https://www.britannica.com/event/Great-Fire-of-London"}]'::jsonb,
 'The fire transformed London’s built environment and safety practices.','verified')
ON CONFLICT(id) DO NOTHING;
