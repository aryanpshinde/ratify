update activity_logs
set created_at = date_trunc('milliseconds', created_at)
where created_at <> date_trunc('milliseconds', created_at);
